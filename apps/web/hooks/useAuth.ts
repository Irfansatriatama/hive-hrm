import { useSession } from '@/lib/auth';

export function useAuth() {
  const { data: session, isPending } = useSession();
  
  return {
    user: session?.user
      ? {
          ...session.user,
          role: (session.user as any).role as string || 'EMPLOYEE',
        }
      : undefined,
    session: session?.session,
    isLoading: isPending,
    isAuthenticated: !!session,
  };
}
