import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]

    // Actualizar cuotas que están vencidas
    const { data, error } = await supabase
      .from('movimientos_socios')
      .update({ estado: 'Vencida' })
      .eq('tipo', 'Cargo')
      .eq('estado', 'Pendiente')
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', today)
      .select('id, fk_id_socio, concepto, fecha_vencimiento')

    if (error) {
      console.error('Error actualizando cuotas vencidas:', error)
      return NextResponse.json(
        { error: 'Error al actualizar cuotas vencidas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: `Se actualizaron ${data?.length || 0} cuotas a estado "Vencida"`
    })

  } catch (error) {
    console.error('Error en update-overdue:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}