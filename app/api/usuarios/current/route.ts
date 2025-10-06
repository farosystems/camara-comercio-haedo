import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const supabase = createClient()

    // Obtener el usuario desde la base de datos usando el clerk_user_id
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, fk_id_caja, status')
      .eq('clerk_user_id', user.id)
      .single()

    if (error) {
      console.error('Error obteniendo usuario:', error)
      return NextResponse.json({ error: 'Error obteniendo usuario' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      usuario
    })

  } catch (error) {
    console.error('Error en API usuarios/current:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
