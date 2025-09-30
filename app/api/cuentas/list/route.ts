import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Obtener todas las cuentas
    const { data: cuentas, error } = await supabase
      .from('cuentas')
      .select('*')
      .order('nombre')

    if (error) {
      console.error('Error obteniendo cuentas:', error)
      return NextResponse.json(
        { error: 'Error obteniendo las cuentas: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      cuentas: cuentas || []
    })

  } catch (error) {
    console.error('Error en API de listado de cuentas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}