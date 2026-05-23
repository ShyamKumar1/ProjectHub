import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as models from '../db/models';
import { query } from '../db/pool';

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/google — Google OAuth token exchange (supports both implicit and PKCE)
  app.post('/api/v1/auth/google', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      access_token?: string;
      code?: string;
      code_verifier?: string;
      redirect_uri?: string;
    };

    try {
      console.log('Google auth POST body keys:', Object.keys(body));
      let accessToken = body.access_token;

      // PKCE authorization code flow — exchange code for token
      if (!accessToken && body.code) {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: body.code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: body.redirect_uri || '',
            grant_type: 'authorization_code',
            ...(body.code_verifier ? { code_verifier: body.code_verifier } : {}),
          }),
        });
        const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
        console.log('Google token exchange response:', tokenData.error || 'success');
        if (!tokenData.access_token) {
          return reply.status(401).send({ success: false, error: 'Code exchange failed: ' + (tokenData.error || 'unknown') });
        }
        accessToken = tokenData.access_token;
      }

      if (!accessToken)
        return reply.status(400).send({ success: false, error: 'access_token or code required' });

      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok)
        return reply.status(401).send({ success: false, error: 'Invalid Google token' });

      const googleUser = (await res.json()) as {
        id: string;
        email: string;
        name: string;
        picture: string;
      };

      let user = await models.findUserByGoogleId(googleUser.id);
      if (!user) {
        user = await models.findUserByEmail(googleUser.email);
        if (user) {
          // Link Google account to existing user
          await query(
            'UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3',
            [googleUser.id, googleUser.picture, user.id],
          );
        } else {
          const crypto = await import('node:crypto');
          user = await models.createUser({
            id: crypto.randomUUID(),
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.picture,
            google_id: googleUser.id,
          });
        }
      }

      // Generate JWT
      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            timezone: user.timezone,
          },
        },
      };
    } catch (err) {
      console.error('Google auth error:', err instanceof Error ? err.message : err, (err as any)?.stack);
      return reply.status(500).send({ success: false, error: 'Authentication failed: ' + (err instanceof Error ? err.message : 'unknown') });
    }
  });

  // POST /api/v1/auth/github — GitHub OAuth code exchange
  app.post('/api/v1/auth/github', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.body as { code?: string };
    if (!code) return reply.status(400).send({ success: false, error: 'code required' });

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (!tokenData.access_token)
        return reply.status(401).send({ success: false, error: 'Invalid GitHub code' });

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const githubUser = (await userRes.json()) as {
        id: number;
        email: string;
        login: string;
        avatar_url: string;
      };

      const githubId = String(githubUser.id);
      let user = await models.findUserByGithubId(githubId);

      if (!user) {
        user = await models.findUserByEmail(githubUser.email);
        if (user) {
          await query(
            'UPDATE users SET github_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3',
            [githubId, githubUser.avatar_url, user.id],
          );
        } else {
          const crypto = await import('node:crypto');
          user = await models.createUser({
            id: crypto.randomUUID(),
            email: githubUser.email || `${githubUser.login}@github.com`,
            name: githubUser.login,
            avatar_url: githubUser.avatar_url,
            github_id: githubId,
          });
        }
      }

      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            timezone: user.timezone,
          },
        },
      };
    } catch (err) {
      return reply.status(500).send({ success: false, error: 'GitHub authentication failed' });
    }
  });

  // GET /api/v1/auth/session
  app.get('/api/v1/auth/session', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<{ id: string; email: string; name: string }>();
      const user = await models.findUserById(payload.id);
      if (!user) return reply.status(401).send({ success: false, error: 'Session expired' });
      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            timezone: user.timezone,
          },
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    } catch {
      return reply.status(401).send({ success: false, error: 'Not authenticated' });
    }
  });

  // POST /api/v1/auth/logout
  app.post('/api/v1/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('token', { path: '/' });
    return { success: true, data: { logged_out: true } };
  });
}
