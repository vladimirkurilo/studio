"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useHydratedAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: Array<'guest' | 'admin'>;
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const user = useHydratedAuthStore(state => state.user);
  const hydrated = useHydratedAuthStore(state => state.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return; // Wait for Zustand to rehydrate

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // If user role is not allowed, redirect to home or a specific unauthorized page
      router.replace('/'); 
    }
  }, [user, hydrated, allowedRoles, router]);

  if (!hydrated || !user || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    // Show a loading skeleton or spinner while checking auth or redirecting
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
