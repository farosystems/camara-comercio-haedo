import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface Module {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
  orden: number;
  activo: boolean;
  puede_ver: boolean;
}

export function usePermissions(moduleName: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    async function checkPermissions() {
      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/permissions/${moduleName}`);
        if (response.ok) {
          const data = await response.json();
          setHasPermission(data.puede_ver);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error verificando permisos:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermissions();
  }, [moduleName, user]);

  return { hasPermission, loading };
}

export function useModulePermissions(moduleName: string) {
  const [permissions, setPermissions] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false
  });
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    async function loadPermissions() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/permissions/${moduleName}`);
        if (response.ok) {
          const data = await response.json();
          setPermissions(data);
        }
      } catch (error) {
        console.error('Error cargando permisos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [moduleName, user]);

  return { ...permissions, loading };
}

export function useUserModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    async function loadUserModules() {
      if (!user) {
        setModules([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/modules');
        if (response.ok) {
          const data = await response.json();
          setModules(data);
        } else {
          setModules([]);
        }
      } catch (error) {
        console.error('Error cargando módulos del usuario:', error);
        setModules([]);
      } finally {
        setLoading(false);
      }
    }

    loadUserModules();
  }, [user]);

  return { modules, loading };
}
