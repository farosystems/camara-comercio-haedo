import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const supabase = createClient()

    const { data: cuentas, error } = await supabase
      .from('cuentas')
      .select('*')
      .order('nombre')

    if (error) {
      console.error('Error obteniendo cuentas:', error)
      return NextResponse.json({ error: 'Error obteniendo cuentas' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cuentas: cuentas || []
    })

  } catch (error) {
    console.error('Error en API cuentas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}