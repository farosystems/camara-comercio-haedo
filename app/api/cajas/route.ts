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

    // Obtener todas las cajas activas
    const { data: cajas, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) {
      console.error('Error obteniendo cajas:', error)
      return NextResponse.json({ error: 'Error obteniendo las cajas' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cajas: cajas || []
    })

  } catch (error) {
    console.error('Error en API cajas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const supabase = createClient()
    const data = await request.json()

    // Validar campos obligatorios
    if (!data.nombre?.trim()) {
      return NextResponse.json({
        error: 'El nombre de la caja es obligatorio'
      }, { status: 400 })
    }

    // Insertar nueva caja
    const { data: caja, error } = await supabase
      .from('cajas')
      .insert([{
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creando caja:', error)
      return NextResponse.json({ error: 'Error creando la caja' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      caja,
      message: 'Caja creada exitosamente'
    })

  } catch (error) {
    console.error('Error en API cajas POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}