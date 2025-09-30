import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: 'ID de usuario requerido' 
      }, { status: 400 })
    }

    // Obtener información del usuario antes de eliminarlo
    const { data: usuario, error: getUserError } = await supabase
      .from('usuarios')
      .select('clerk_user_id')
      .eq('id', userId)
      .single()

    if (getUserError || !usuario) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 })
    }

    // 1. Eliminar usuario de Clerk si tiene clerk_user_id
    if (usuario.clerk_user_id) {
      try {
        await clerkClient.users.deleteUser(usuario.clerk_user_id)
      } catch (clerkError) {
        console.error('Error eliminando usuario de Clerk:', clerkError)
        // Continuar con la eliminación de la base de datos aunque falle Clerk
      }
    }

    // 2. Eliminar usuario de la base de datos
    // Las relaciones CASCADE se encargarán de eliminar registros relacionados
    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error eliminando usuario de la base de datos:', deleteError)
      return NextResponse.json({ 
        error: 'Error eliminando usuario de la base de datos: ' + deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('Error eliminando usuario:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + error.message 
    }, { status: 500 })
  }
}



