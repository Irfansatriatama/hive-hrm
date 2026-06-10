import { betterAuth } from 'better-auth';
import { customSession } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveEmployeeId(userId: string, email: string) {
  const byUser = await prisma.employee.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (byUser) return byUser.id;

  const byEmail = await prisma.employee.findUnique({
    where: { email },
    select: { id: true },
  });
  return byEmail?.id ?? null;
}

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
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const employee_id = await resolveEmployeeId(user.id, user.email);
      return {
        user: {
          ...user,
          employee_id,
        },
        session,
      };
    }),
  ],
});
