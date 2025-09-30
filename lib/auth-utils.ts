import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase';

// Definir interfaces para los tipos
interface Modulo {
  id: number;
  nombre: string;
  activo: boolean;
  orden: number;
  [key: string]: any;
}

interface Permiso {
  fk_id_usuario: number;
  fk_id_modulo: number;
  puede_ver: boolean;
  [key: string]: any;
}

export async function getCurrentUser() {
  try {
    const { userId } = auth();
    console.log('Clerk userId:', userId);
    
    if (!userId) {
      throw new Error('No autorizado');
    }
    
    const supabase = createClient();
    
    // Buscar usuario en nuestra base de datos
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, rol, email, nombre, status')
      .eq('clerk_user_id', userId)
      .single();
      
    if (error || !usuario) {
      console.error('Error obteniendo usuario o usuario no encontrado:', error);
      throw new Error('Usuario no encontrado en el sistema');
    }

    if (usuario.status !== 'Activo') {
      throw new Error('Usuario inactivo o bloqueado');
    }
    
    console.log('Usuario encontrado:', usuario);
    return usuario;
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    throw error;
  }
}

export async function checkUserPermissions(moduleName: string) {
  const usuario = await getCurrentUser();
  
  // Los administradores tienen acceso completo
  if (usuario.rol === 'admin') {
    return true;
  }
  
  const supabase = createClient();
  
  // Verificar permisos específicos del módulo
  const { data: permisos, error } = await supabase
    .from('permisos_usuarios')
    .select(`
      puede_ver,
      modulos!inner(nombre)
    `)
    .eq('fk_id_usuario', usuario.id)
    .eq('modulos.nombre', moduleName)
    .single();
    
  if (error || !permisos) {
    return false;
  }
  
  return permisos.puede_ver;
}

export async function getUserModules() {
  try {
    const usuario = await getCurrentUser();
    console.log('Usuario obtenido:', usuario);
    
    const supabase = createClient();
    
    // Los administradores ven todos los módulos activos
    if (usuario.rol === 'admin') {
      console.log('Usuario es admin, obteniendo todos los módulos');
      const { data: modulos, error } = await supabase
        .from('modulos')
        .select('*')
        .eq('activo', true)
        .order('orden');
        
      if (error) {
        console.error('Error obteniendo módulos para admin:', error);
        throw error;
      }
      
      console.log('Módulos para admin:', modulos);
      // Agregar puede_ver = true para todos los módulos de admin
      return modulos.map((modulo: Modulo) => ({
        ...modulo,
        puede_ver: true
      }));
    }
    
    // Otros usuarios ven solo módulos con permisos
    console.log('Usuario no es admin, obteniendo módulos con permisos. ID usuario:', usuario.id);
    
    // Primero obtener los permisos del usuario
    const supabaseClient = createClient();
    const { data: permisos, error: permisosError } = await supabaseClient
      .from('permisos_usuarios')
      .select('*')
      .eq('fk_id_usuario', usuario.id)
      .eq('puede_ver', true);
      
    if (permisosError) {
      console.error('Error obteniendo permisos:', permisosError);
      throw permisosError;
    }
    
    console.log('Permisos obtenidos:', permisos);
    
    if (!permisos || permisos.length === 0) {
      console.log('No hay permisos para el usuario');
      return [];
    }
    
    // Obtener los IDs de módulos que el usuario puede ver
    const modulosIds = permisos.map((p: Permiso) => p.fk_id_modulo);
    console.log('IDs de módulos que puede ver:', modulosIds);
    
    // Obtener los módulos activos
    const { data: modulos, error: modulosError } = await supabaseClient
      .from('modulos')
      .select('*')
      .in('id', modulosIds)
      .eq('activo', true)
      .order('orden');
      
    if (modulosError) {
      console.error('Error obteniendo módulos:', modulosError);
      throw modulosError;
    }
    
    console.log('Módulos obtenidos:', modulos);
    
    // Agregar puede_ver = true a todos los módulos
    const modulosConPermisos = modulos.map((modulo: Modulo) => ({
      ...modulo,
      puede_ver: true
    }));
    
    console.log('Módulos finales:', modulosConPermisos);
    return modulosConPermisos;
  } catch (error) {
    console.error('Error en getUserModules:', error);
    throw error;
  }
}

export async function createUserFromClerk(clerkUser: any) {
  const supabase = createClient();
  
  const { data: existingUser, error: checkError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('clerk_user_id', clerkUser.id)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Crear nuevo usuario
  const { data: newUser, error } = await supabase
    .from('usuarios')
    .insert({
      nombre: `${clerkUser.firstName} ${clerkUser.lastName}`,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      clerk_user_id: clerkUser.id,
      rol: 'socio', // Rol por defecto
      status: 'Activo'
    })
    .select()
    .single();

  if (error) throw error;
  return newUser;
}

export async function updateUserLastAccess(userId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('usuarios')
    .update({ ultimo_acceso: new Date().toISOString() })
    .eq('clerk_user_id', userId);

  if (error) {
    console.error('Error actualizando último acceso:', error);
  }
}
