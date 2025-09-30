import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ 
        error: 'Usuario no autenticado' 
      }, { status: 401 })
    }

    // Buscar usuario por clerk_user_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado en la base de datos' 
      }, { status: 404 })
    }

    // Si el usuario es un socio, buscar la información del socio
    let socio = null
    if (usuario.rol === 'socio') {
      const { data: socioData, error: socioError } = await supabase
        .from('socios')
        .select('*')
        .eq('fk_id_usuario', usuario.id)
        .single()

      if (!socioError && socioData) {
        socio = socioData
      }
    }

    return NextResponse.json({ 
      usuario,
      socio
    })

  } catch (error: any) {
    console.error('Error obteniendo usuario actual:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + error.message 
    }, { status: 500 })
  }
}



