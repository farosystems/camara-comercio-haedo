import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getArgentinaDateString } from '@/lib/date-utils'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const { movementId, socioId, amount, cuentaId, cuentaDestinoId, reference } = await request.json()

    // Validaciones
    if (!movementId || !socioId || !amount || amount <= 0 || !cuentaId || !cuentaDestinoId) {
      return NextResponse.json(
        { error: 'Datos inválidos. Verifique movementId, socioId, amount, cuentaId y cuentaDestinoId' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 1. Obtener el ID numérico del usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('clerk_user_id', user.id)
      .single()

    if (usuarioError || !usuario) {
      console.error('Error obteniendo usuario:', usuarioError)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 })
    }

    // 2. Verificar que el usuario tenga una caja abierta
    const { data: cajaAbierta, error: cajaError } = await supabase
      .from('lotes_operaciones')
      .select('id_lote')
      .eq('fk_id_usuario', usuario.id)
      .eq('abierto', true)
      .single()

    if (cajaError || !cajaAbierta) {
      console.error('No hay caja abierta para el usuario:', usuario.id)
      return NextResponse.json(
        { error: 'Debe abrir una caja antes de registrar pagos' },
        { status: 400 }
      )
    }

    // 2. Obtener el movimiento actual
    const { data: movement, error: movementError } = await supabase
      .from('movimientos_socios')
      .select('*')
      .eq('id', movementId)
      .eq('fk_id_socio', socioId)
      .single()

    if (movementError || !movement) {
      console.error('Error obteniendo movimiento:', movementError)
      return NextResponse.json(
        { error: 'No se encontró el movimiento especificado' },
        { status: 404 }
      )
    }

    // Verificar que el movimiento esté pendiente o vencido
    if (movement.estado === 'Cobrada') {
      return NextResponse.json(
        { error: 'Esta cuota ya está cobrada' },
        { status: 400 }
      )
    }

    // Verificar que el monto no sea mayor al saldo
    if (amount > movement.saldo) {
      return NextResponse.json(
        { error: 'El monto a pagar no puede ser mayor al saldo pendiente' },
        { status: 400 }
      )
    }

    // 2. Crear el registro de pago
    const timestamp = Date.now().toString().slice(-8)
    const randomSuffix = Math.random().toString(36).substr(2, 4)
    const pagoId = `PAG-${timestamp}-${randomSuffix}`

    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .insert({
        id: pagoId,
        fk_id_socio: socioId,
        fecha: getArgentinaDateString(),
        monto: amount,
        fk_id_movimiento: movementId,
        fk_id_cuenta_tesoreria: cuentaId,
        referencia: reference
      })
      .select()
      .single()

    if (pagoError) {
      console.error('Error creando pago:', pagoError)
      return NextResponse.json(
        { error: 'Error al registrar el pago' },
        { status: 500 }
      )
    }

    // 3. Actualizar solo el saldo de la cuota que se está pagando
    const nuevoSaldo = movement.saldo - amount
    const nuevoEstado = nuevoSaldo <= 0 ? 'Cobrada' : movement.estado

    const { error: updateError } = await supabase
      .from('movimientos_socios')
      .update({
        saldo: nuevoSaldo,
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', movementId)

    if (updateError) {
      console.error('Error actualizando movimiento:', updateError)

      // Si falla la actualización, eliminar el pago creado
      await supabase
        .from('pagos')
        .delete()
        .eq('id', pagoId)

      return NextResponse.json(
        { error: 'Error al actualizar el saldo de la cuota' },
        { status: 500 }
      )
    }

    // 4. Generar registro en movimientos_caja (usando cuenta destino)
    const movimientoCajaData = {
      fk_id_cuenta: cuentaDestinoId, // Usar la cuenta destino seleccionada
      fecha: getArgentinaDateString(),
      concepto_ingreso: `Pago de cuota - ${movement.concepto}`,
      apellido_nombres: null, // Se puede obtener del socio si es necesario
      fk_id_proveedor: null,
      numero_comprobante: reference || null,
      nota: `Pago procesado por ${usuario.nombre}`,
      fk_id_concepto: 3, // ID = 3 como especificado
      tipo: 'Ingreso',
      ingresos: amount,
      observaciones: `Pago de cuota movimiento ${movementId}`,
      fk_id_usuario: usuario.id
    }

    const { data: movimientoCaja, error: movimientoCajaError } = await supabase
      .from('movimientos_caja')
      .insert([movimientoCajaData])
      .select()
      .single()

    if (movimientoCajaError) {
      console.error('Error creando movimiento en caja:', movimientoCajaError)
      // No fallar la operación principal, pero registrar el error
      console.log('El pago se procesó correctamente, pero no se pudo registrar en movimientos de caja')
    }

    // 5. Generar registro en detalle_lotes_operaciones si hay un lote abierto (usando cuenta destino)
    const { data: loteAbierto } = await supabase
      .from('lotes_operaciones')
      .select('id_lote')
      .eq('fk_id_usuario', usuario.id)
      .eq('abierto', true)
      .single()

    if (loteAbierto) {
      const { error: errorDetalleLote } = await supabase
        .from('detalle_lotes_operaciones')
        .insert([{
          fk_id_lote: loteAbierto.id_lote,
          fk_id_cuenta_tesoreria: cuentaDestinoId, // Usar la cuenta destino seleccionada
          tipo: 'ingreso',
          monto: amount,
          concepto: `Pago de cuota - ${movement.concepto}`,
          observaciones: `Pago procesado desde módulo de cuotas - Movimiento: ${movementId}${reference ? ` - Ref: ${reference}` : ''}`
        }])

      if (errorDetalleLote) {
        console.error('Error registrando en detalle de lote:', errorDetalleLote)
        // No fallar la operación principal, pero registrar el error
        console.log('El pago se procesó correctamente, pero no se pudo registrar en el lote de caja')
      } else {
        console.log('Pago registrado también en lote de caja activo:', loteAbierto.id_lote)
      }
    }

    // 6. Determinar el tipo de pago y mensaje
    const esPagoTotal = nuevoSaldo <= 0
    const tipoPago = esPagoTotal ? 'total' : 'parcial'

    let mensaje = ''
    if (esPagoTotal) {
      mensaje = `Pago total procesado exitosamente. La cuota ha sido marcada como COBRADA.`
    } else {
      mensaje = `Pago parcial procesado exitosamente. Saldo restante: $${nuevoSaldo.toLocaleString()}`
    }

    return NextResponse.json({
      success: true,
      message: mensaje,
      pago: pago,
      tipoPago,
      saldoAnterior: movement.saldo,
      montoPagado: amount,
      saldoRestante: nuevoSaldo
    })

  } catch (error) {
    console.error('Error en process-payment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}