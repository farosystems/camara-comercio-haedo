import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: proveedores, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('razon_social', { ascending: true })

    if (error) {
      console.error('Error fetching proveedores:', error)
      return NextResponse.json(
        { error: 'Error al obtener proveedores' },
        { status: 500 }
      )
    }

    return NextResponse.json({ proveedores: proveedores || [] })
  } catch (error) {
    console.error('Error in proveedores API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razon_social, nombre, apellido, email, telefono, estado } = body

    // Validaciones
    if (!razon_social) {
      return NextResponse.json(
        { error: 'La razón social es obligatoria' },
        { status: 400 }
      )
    }

    if (estado && !['Activo', 'Inactivo'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado debe ser Activo o Inactivo' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: proveedor, error } = await supabase
      .from('proveedores')
      .insert([{
        razon_social,
        nombre,
        apellido,
        email,
        telefono,
        estado: estado || 'Activo'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating proveedor:', error)
      return NextResponse.json(
        { error: 'Error al crear proveedor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Proveedor creado exitosamente',
      proveedor
    })
  } catch (error) {
    console.error('Error in proveedores POST API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}