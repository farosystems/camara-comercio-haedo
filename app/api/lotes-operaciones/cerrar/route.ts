import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const supabase = createClient()
    const data = await request.json()

    // Obtener el ID numérico del usuario
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nombre, rol')
      .eq('clerk_user_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 })
    }

    const { id_lote } = data

    if (!id_lote) {
      return NextResponse.json({ error: 'ID de lote requerido' }, { status: 400 })
    }

    // Validar que el lote existe y está abierto
    const { data: lote, error: loteError } = await supabase
      .from('lotes_operaciones')
      .select('*')
      .eq('id_lote', id_lote)
      .eq('abierto', true)
      .single()

    if (loteError || !lote) {
      return NextResponse.json({
        error: 'Lote no encontrado o ya está cerrado'
      }, { status: 400 })
    }

    // Verificar que el usuario es propietario del lote o es admin
    if (lote.fk_id_usuario !== usuario.id && usuario.rol !== 'admin') {
      return NextResponse.json({
        error: 'No tienes permisos para cerrar este lote'
      }, { status: 403 })
    }

    // Calcular el saldo final solo de cuentas de tipo "Efectivo"
    // Obtener todos los movimientos del detalle_lotes_operaciones para este lote con info de cuenta
    const { data: detallesLote, error: detallesError } = await supabase
      .from('detalle_lotes_operaciones')
      .select(`
        tipo,
        monto,
        fk_id_cuenta_tesoreria,
        cuenta:cuentas_tesoreria!fk_id_cuenta_tesoreria(tipo)
      `)
      .eq('fk_id_lote', id_lote)

    if (detallesError) {
      console.error('Error obteniendo detalles del lote:', detallesError)
      return NextResponse.json({
        error: 'Error calculando saldo final'
      }, { status: 500 })
    }

    // Calcular saldo final solo de cuentas de tipo "Efectivo"
    let ingresosEfectivo = 0
    let egresosEfectivo = 0

    detallesLote?.forEach(detalle => {
      if (detalle.cuenta?.tipo?.toLowerCase() === 'efectivo') {
        if (detalle.tipo === 'ingreso') {
          ingresosEfectivo += parseFloat(detalle.monto || 0)
        } else if (detalle.tipo === 'egreso') {
          egresosEfectivo += parseFloat(detalle.monto || 0)
        }
      }
    })

    const saldoFinalCuenta1 = ingresosEfectivo - egresosEfectivo

    const ahora = new Date()
    const fechaCierre = ahora.toISOString().split('T')[0] // YYYY-MM-DD
    const horaCierre = ahora.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    })

    // Cerrar el lote
    const { data: loteCerrado, error: errorCierre } = await supabase
      .from('lotes_operaciones')
      .update({
        abierto: false,
        tipo_lote: 'cierre',
        fecha_cierre: fechaCierre,
        hora_cierre: horaCierre,
        saldo_final: saldoFinalCuenta1,
        observaciones: data.observaciones?.trim() || lote.observaciones
      })
      .eq('id_lote', id_lote)
      .select(`
        *,
        caja:cajas!fk_id_caja(id, nombre),
        usuario:usuarios!fk_id_usuario(nombre)
      `)
      .single()

    if (errorCierre) {
      console.error('Error cerrando lote:', errorCierre)
      return NextResponse.json({ error: 'Error cerrando el lote' }, { status: 500 })
    }

    // Calcular resumen financiero para la respuesta
    let totalIngresos = 0
    let totalEgresos = 0

    detallesLote?.forEach(detalle => {
      if (detalle.tipo === 'ingreso') {
        totalIngresos += parseFloat(detalle.monto || 0)
      } else if (detalle.tipo === 'egreso') {
        totalEgresos += parseFloat(detalle.monto || 0)
      }
    })

    const resumenFinanciero = {
      saldo_inicial: lote.saldo_inicial || 0,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      saldo_final: saldoFinalCuenta1
    }

    return NextResponse.json({
      success: true,
      lote: loteCerrado,
      resumen: resumenFinanciero,
      message: 'Caja cerrada exitosamente'
    })

  } catch (error) {
    console.error('Error en API cerrar lote:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}