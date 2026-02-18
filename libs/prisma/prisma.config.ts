import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: { path: './prisma/migrations' },
  datasource: {
    url: env('DATABASE_URL'),
    shadowUrl: process.env['SHADOW_DATABASE_URL'],
  },
});
