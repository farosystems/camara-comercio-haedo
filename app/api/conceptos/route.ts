import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: conceptos, error } = await supabase
      .from('conceptos_movimientos')
      .select('*')
      .eq('activo', true)
      .order('categoria', { ascending: true })
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error fetching conceptos:', error)
      return NextResponse.json(
        { error: 'Error al obtener conceptos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ conceptos: conceptos || [] })
  } catch (error) {
    console.error('Error in conceptos API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, tipo, categoria } = body

    // Validaciones
    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: 'Nombre y tipo son obligatorios' },
        { status: 400 }
      )
    }

    if (!['Ingreso', 'Egreso'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo debe ser Ingreso o Egreso' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: concepto, error } = await supabase
      .from('conceptos_movimientos')
      .insert([{
        nombre,
        descripcion,
        tipo,
        categoria,
        activo: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating concepto:', error)
      return NextResponse.json(
        { error: 'Error al crear concepto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Concepto creado exitosamente',
      concepto
    })
  } catch (error) {
    console.error('Error in conceptos POST API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}