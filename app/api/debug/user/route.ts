import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('Clerk userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const supabase = createClient();
    
    // Buscar usuario en nuestra base de datos
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();
      
    if (error) {
      console.error('Error obteniendo usuario:', error);
      return NextResponse.json({ error: 'Error obteniendo usuario', details: error }, { status: 500 });
    }
    
    if (!usuario) {
      // Buscar todos los usuarios para debug
      const { data: todosUsuarios, error: errorTodos } = await supabase
        .from('usuarios')
        .select('*');
        
      return NextResponse.json({ 
        error: 'Usuario no encontrado', 
        clerkUserId: userId,
        todosUsuarios: todosUsuarios,
        errorTodos: errorTodos
      }, { status: 404 });
    }
    
    // Buscar permisos del usuario
    const { data: permisos, error: errorPermisos } = await supabase
      .from('permisos_usuarios')
      .select(`
        puede_ver,
        modulos!inner(*)
      `)
      .eq('fk_id_usuario', usuario.id);
      
    return NextResponse.json({ 
      usuario, 
      permisos,
      errorPermisos
    });
    
  } catch (error) {
    console.error('Error en debug endpoint:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}





