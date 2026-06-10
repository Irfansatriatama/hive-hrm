import { useSession } from '@/lib/auth';

export function useAuth() {
  const { data: session, isPending } = useSession();
  
  return {
    user: session?.user
      ? {
          ...session.user,
          role: (session.user as any).role as string || 'EMPLOYEE',
          employee_id: (session.user as any).employee_id as string | null | undefined,
        }
      : undefined,
    session: session?.session,
    isLoading: isPending,
    isAuthenticated: !!session,
  };
}
