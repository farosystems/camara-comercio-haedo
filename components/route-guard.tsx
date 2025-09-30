'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  moduleName: string;
}

export function RouteGuard({ children, moduleName }: RouteGuardProps) {
  const { hasPermission, loading } = usePermissions(moduleName);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPermission) {
      router.push('/home');
    }
  }, [hasPermission, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Acceso Denegado</h2>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a este módulo.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}








