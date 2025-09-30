import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json()

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'ID de usuario, contraseña actual y nueva contraseña son requeridos' 
      }, { status: 400 })
    }

    // Validar nueva contraseña
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'La nueva contraseña debe tener al menos 8 caracteres' 
      }, { status: 400 })
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'La nueva contraseña debe contener al menos una letra y un número' 
      }, { status: 400 })
    }

    // Obtener información del usuario
    const { data: usuario, error: getUserError } = await supabase
      .from('usuarios')
      .select('clerk_user_id, password_hash, email')
      .eq('id', userId)
      .single()

    if (getUserError || !usuario) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 })
    }

    // Verificar contraseña actual
    if (usuario.password_hash !== currentPassword) {
      return NextResponse.json({ 
        error: 'La contraseña actual es incorrecta' 
      }, { status: 401 })
    }

    // 1. Actualizar contraseña en Clerk si tiene clerk_user_id
    if (usuario.clerk_user_id) {
      try {
        await clerkClient.users.updateUser(usuario.clerk_user_id, {
          password: newPassword
        })
      } catch (clerkError: any) {
        console.error('Error actualizando contraseña en Clerk:', clerkError)
        
        // Manejar errores específicos de Clerk
        if (clerkError.errors && Array.isArray(clerkError.errors)) {
          const error = clerkError.errors[0]
          if (error.code === 'form_password_pwned') {
            return NextResponse.json({ 
              error: 'La contraseña es muy común, elige una más segura' 
            }, { status: 400 })
          }
          if (error.code === 'form_password_validation_failed') {
            return NextResponse.json({ 
              error: 'La contraseña no cumple con los requisitos de seguridad' 
            }, { status: 400 })
          }
        }
        
        return NextResponse.json({ 
          error: 'Error actualizando contraseña en Clerk: ' + clerkError.message 
        }, { status: 500 })
      }
    }

    // 2. Actualizar contraseña en la base de datos
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ 
        password_hash: newPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error actualizando contraseña en la base de datos:', updateError)
      return NextResponse.json({ 
        error: 'Error actualizando contraseña en la base de datos: ' + updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error: any) {
    console.error('Error cambiando contraseña:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + error.message 
    }, { status: 500 })
  }
}



