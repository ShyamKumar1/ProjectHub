// Fastify + TypeScript backend - Auth middleware
import { FastifyRequest, FastifyReply } from 'fastify';

// Augment Fastify types for JWT
declare module 'fastify' {
  interface FastifyRequest {
    jwtVerify: () => Promise<{ id: string; email: string; name: string }>;
    user?: { id: string; email: string; name: string };
  }
  interface FastifyInstance {
    jwt: {
      sign: (payload: object, options?: object) => string;
      verify: (token: string) => object;
      decode: (token: string) => object | null;
    };
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
}

export function getUserFromRequest(request: FastifyRequest): { id: string; email: string; name: string } {
  return request.user as { id: string; email: string; name: string };
}
