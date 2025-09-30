import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberIds, cargoId, fecha, fechaVencimiento } = body

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un ID de socio' },
        { status: 400 }
      )
    }

    if (!cargoId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del cargo' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Obtener información del cargo
    const { data: cargo, error: cargoError } = await supabase
      .from('cargos')
      .select('*')
      .eq('id', cargoId)
      .eq('activo', true)
      .single()

    if (cargoError || !cargo) {
      return NextResponse.json(
        { error: 'Cargo no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Obtener información de los socios
    const { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('id, razon_social')
      .in('id', memberIds)

    if (sociosError || !socios || socios.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron socios válidos' },
        { status: 404 }
      )
    }

    // Crear los movimientos para cada socio
    const movimientos = socios.map(socio => {
      // Determinar el estado inicial basado en la fecha de vencimiento
      let estadoInicial = 'Pendiente'
      if (fechaVencimiento) {
        const hoy = new Date().toISOString().split('T')[0]
        if (fechaVencimiento < hoy) {
          estadoInicial = 'Vencida'
        }
      }

      const movement: any = {
        fk_id_socio: socio.id,
        fecha: fecha || new Date().toISOString().split('T')[0],
        tipo: 'Cargo',
        concepto: cargo.nombre,
        monto: cargo.monto || 0,
        saldo: 0, // Se calculará después de insertar
        estado: estadoInicial,
        fk_id_cargo: cargo.id
      }

      // Solo agregar fecha_vencimiento si se proporcionó
      if (fechaVencimiento) {
        movement.fecha_vencimiento = fechaVencimiento
      }

      return movement
    })

    // Insertar todos los movimientos
    const { data: insertedMovements, error: insertError } = await supabase
      .from('movimientos_socios')
      .insert(movimientos)
      .select('id, fk_id_socio, fecha, tipo, concepto, monto, saldo, estado')

    if (insertError) {
      console.error('Error insertando movimientos:', insertError)
      return NextResponse.json(
        { error: 'Error al generar las cuotas' },
        { status: 500 }
      )
    }

    // Actualizar los saldos para cada socio
    for (const socio of socios) {
      // Obtener todos los movimientos del socio ordenados por fecha
      const { data: allMovements, error: movementsError } = await supabase
        .from('movimientos_socios')
        .select('*')
        .eq('fk_id_socio', socio.id)
        .order('fecha', { ascending: true })
        .order('created_at', { ascending: true })

      if (movementsError) {
        console.error('Error obteniendo movimientos:', movementsError)
        continue
      }

      // Calcular saldos acumulativos
      let saldoAcumulado = 0
      const movimientosConSaldo = allMovements.map(movement => {
        if (movement.tipo === 'Cargo') {
          saldoAcumulado += movement.monto
        } else if (movement.tipo === 'Pago') {
          saldoAcumulado -= movement.monto
        }
        return {
          ...movement,
          saldo: saldoAcumulado
        }
      })

      // Actualizar todos los movimientos con los saldos correctos
      for (const movement of movimientosConSaldo) {
        await supabase
          .from('movimientos_socios')
          .update({ saldo: movement.saldo })
          .eq('id', movement.id)
      }
    }

    // Contar cuotas por estado
    const cuotasVencidas = movimientos.filter(m => m.estado === 'Vencida').length
    const cuotasPendientes = movimientos.filter(m => m.estado === 'Pendiente').length

    let message = `Se generaron ${insertedMovements?.length || 0} cuotas correctamente`
    if (cuotasVencidas > 0) {
      message += `. Nota: ${cuotasVencidas} cuotas se marcaron como vencidas por fecha de vencimiento pasada.`
    }

    return NextResponse.json({
      success: true,
      count: insertedMovements?.length || 0,
      vencidas: cuotasVencidas,
      pendientes: cuotasPendientes,
      message: message
    })

  } catch (error) {
    console.error('Error en generate-charges:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}