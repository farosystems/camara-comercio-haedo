import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { pedidoIds } = await request.json()

    if (!pedidoIds || !Array.isArray(pedidoIds)) {
      return NextResponse.json({ error: 'pedidoIds array is required' }, { status: 400 })
    }

    if (pedidoIds.length === 0) {
      return NextResponse.json({ itemsCount: {} })
    }

    // Obtener todos los items de los pedidos en una sola consulta
    const { data, error } = await supabase
      .from('items_pedido')
      .select('fk_id_pedido, cantidad')
      .in('fk_id_pedido', pedidoIds)

    if (error) {
      console.error('Error obteniendo items de pedidos:', error)
      return NextResponse.json({ error: 'Error obteniendo items de pedidos' }, { status: 500 })
    }

    // Agrupar y sumar por pedido
    const itemsCount: { [key: string]: number } = {}
    
    // Inicializar todos los pedidos con 0
    pedidoIds.forEach(pedidoId => {
      itemsCount[pedidoId] = 0
    })

    // Sumar las cantidades por pedido
    data?.forEach(item => {
      const pedidoId = item.fk_id_pedido
      itemsCount[pedidoId] = (itemsCount[pedidoId] || 0) + (item.cantidad || 0)
    })

    return NextResponse.json({ itemsCount })
  } catch (error) {
    console.error('Error en API items-count-batch:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
