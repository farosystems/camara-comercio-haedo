import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkUserPermissions } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { module: string } }
) {
  try {
    const usuario = await getCurrentUser();
    
    // Los administradores tienen todos los permisos
    if (usuario.rol === 'admin') {
      return NextResponse.json({
        puede_ver: true,
        puede_crear: true,
        puede_editar: true,
        puede_eliminar: true
      });
    }
    
    // Obtener permisos específicos del módulo
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: permisos, error } = await supabase
      .from('permisos_usuarios')
      .select(`
        puede_ver,
        puede_crear,
        puede_editar,
        puede_eliminar,
        modulos!inner(nombre)
      `)
      .eq('fk_id_usuario', usuario.id)
      .eq('modulos.nombre', params.module)
      .single();
    
    if (error || !permisos) {
      return NextResponse.json({
        puede_ver: false,
        puede_crear: false,
        puede_editar: false,
        puede_eliminar: false
      });
    }
    
    return NextResponse.json({
      puede_ver: permisos.puede_ver || false,
      puede_crear: permisos.puede_crear || false,
      puede_editar: permisos.puede_editar || false,
      puede_eliminar: permisos.puede_eliminar || false
    });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    return NextResponse.json(
      { error: 'Error obteniendo permisos' },
      { status: 500 }
    );
  }
}








