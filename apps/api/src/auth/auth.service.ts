import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const apiUrl = process.env.BETTER_AUTH_URL || 'http://localhost:4000';

export const auth = betterAuth({
  baseURL: apiUrl,
  basePath: '/auth',
  trustedOrigins: [
    frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    apiUrl,
  ],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'EMPLOYEE' }
    }
  }
});
