import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName,
      representanteLegal,
      telefono 
    } = await request.json()

    if (!email || !password || !firstName) {
      return NextResponse.json({ 
        error: 'Email, password y firstName son requeridos' 
      }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Formato de email inválido' 
      }, { status: 400 })
    }

    // Validar contraseña (requisitos de Clerk)
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'La contraseña debe tener al menos 8 caracteres' 
      }, { status: 400 })
    }

    // Verificar que la contraseña tenga al menos una letra y un número
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json({ 
        error: 'La contraseña debe contener al menos una letra y un número' 
      }, { status: 400 })
    }

    // 1. Crear usuario en Clerk primero
    // Usar el nombre del representante legal como username, limpiando caracteres especiales
    let username = representanteLegal 
      ? representanteLegal
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales excepto espacios
          .replace(/\s+/g, '') // Quitar espacios
          .substring(0, 18) // Limitar longitud (dejamos espacio para números)
      : email.split('@')[0] // Fallback al email si no hay representante legal

    // Si el username está vacío después de la limpieza, usar email como fallback
    if (!username || username.length < 3) {
      username = email.split('@')[0].substring(0, 18)
    }
    
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      username: username,
      password,
      firstName,
      lastName: lastName || '',
      publicMetadata: {
        role: 'socio'
      },
      skipPasswordChecks: false,
      skipPasswordRequirement: false
    })

    // 2. Crear usuario en nuestra tabla de usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        nombre: `${firstName} ${lastName || ''}`.trim(),
        email: email,
        telefono: telefono || null,
        rol: 'socio',
        status: 'Activo',
        password_hash: password, // También guardamos la contraseña por si acaso
        clerk_user_id: clerkUser.id, // Ahora sí guardamos el ID de Clerk
        prueba_gratis: false
      })
      .select()
      .single()

    if (usuarioError) {
      // Si falla la creación en nuestra DB, eliminar el usuario de Clerk (rollback)
      try {
        await clerkClient.users.deleteUser(clerkUser.id)
      } catch (deleteError) {
        console.error('Error eliminando usuario de Clerk tras fallo en DB:', deleteError)
      }
      
      return NextResponse.json({ 
        error: 'Error creando usuario en base de datos: ' + usuarioError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      clerkUserId: clerkUser.id,
      usuarioId: usuario.id,
      message: 'Usuario creado exitosamente en Clerk y base de datos'
    })

  } catch (error: any) {
    console.error('Error creando usuario:', error)
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      errors: error.errors,
      clerkTraceId: error.clerkTraceId
    })
    
    // Manejar errores específicos de Clerk
    if (error.errors && Array.isArray(error.errors)) {
      const clerkError = error.errors[0]
      console.error('Clerk error details:', clerkError)
      
      if (clerkError.code === 'form_identifier_exists') {
        return NextResponse.json({ 
          error: 'Ya existe un usuario con este email en Clerk' 
        }, { status: 409 })
      }
      if (clerkError.code === 'form_password_pwned') {
        return NextResponse.json({ 
          error: 'La contraseña es muy común, elige una más segura' 
        }, { status: 400 })
      }
      if (clerkError.code === 'form_password_length_too_short') {
        return NextResponse.json({ 
          error: 'La contraseña debe tener al menos 8 caracteres' 
        }, { status: 400 })
      }
      if (clerkError.code === 'form_param_format_invalid') {
        return NextResponse.json({ 
          error: 'Formato de datos inválido: ' + clerkError.longMessage 
        }, { status: 400 })
      }
      if (clerkError.code === 'form_password_validation_failed') {
        return NextResponse.json({ 
          error: 'La contraseña no cumple con los requisitos de seguridad' 
        }, { status: 400 })
      }
      if (clerkError.code === 'form_data_missing') {
        return NextResponse.json({ 
          error: 'Datos requeridos faltantes: ' + clerkError.longMessage 
        }, { status: 400 })
      }
      if (clerkError.code === 'form_username_invalid' || clerkError.code === 'form_identifier_exists') {
        return NextResponse.json({ 
          error: 'El nombre de usuario ya existe. Intenta con un nombre diferente.' 
        }, { status: 409 })
      }
      
      // Error genérico de Clerk con más detalles
      return NextResponse.json({ 
        error: clerkError.longMessage || clerkError.message || 'Error en Clerk'
      }, { status: 400 })
    }

    // Error HTTP específico
    if (error.status === 422) {
      return NextResponse.json({ 
        error: 'Datos inválidos para crear usuario en Clerk. Verifica email y contraseña.'
      }, { status: 422 })
    }

    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + error.message 
    }, { status: 500 })
  }
}
