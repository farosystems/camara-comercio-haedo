import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const supabase = createClient();
    
    // Buscar si ya existe un usuario con este clerk_user_id
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();
      
    if (existingUser) {
      return NextResponse.json({ 
        message: 'Usuario ya configurado', 
        usuario: existingUser 
      });
    }
    
    // Buscar un usuario sin clerk_user_id para asignarle este
    const { data: usuariosSinClerk, error: errorSinClerk } = await supabase
      .from('usuarios')
      .select('*')
      .is('clerk_user_id', null)
      .limit(1);
      
    if (errorSinClerk || !usuariosSinClerk || usuariosSinClerk.length === 0) {
      // Crear un nuevo usuario
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert({
          nombre: 'Usuario Socio',
          email: 'socio@agrupacion.com',
          rol: 'socio',
          status: 'Activo',
          clerk_user_id: userId,
          prueba_gratis: false
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creando usuario:', createError);
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Usuario creado y configurado', 
        usuario: newUser 
      });
    }
    
    // Actualizar el usuario existente con el clerk_user_id
    const { data: updatedUser, error: updateError } = await supabase
      .from('usuarios')
      .update({ clerk_user_id: userId })
      .eq('id', usuariosSinClerk[0].id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
      return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Usuario configurado correctamente', 
      usuario: updatedUser 
    });
    
  } catch (error) {
    console.error('Error en setup-user:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}








