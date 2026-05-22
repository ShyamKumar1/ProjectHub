// DB connection — Neon serverless driver
import { neon } from '@neondatabase/serverless';

const getSql = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  return neon(url);
};

export default getSql;
