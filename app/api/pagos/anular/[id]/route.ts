import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pagoId = params.id
    const supabase = createClient()

    // Obtener el pago a anular
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .select(`
        *,
        socios!inner(id, razon_social)
      `)
      .eq('id', pagoId)
      .single()

    if (pagoError || !pago) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el pago no esté ya anulado
    if ((pago as any).estado === 'Anulado') {
      return NextResponse.json(
        { error: 'El pago ya está anulado' },
        { status: 400 }
      )
    }

    // 1. Actualizar el estado del pago a "Anulado"
    const { error: updatePagoError } = await supabase
      .from('pagos')
      .update({ estado: 'Anulado' } as any)
      .eq('id', pagoId)

    if (updatePagoError) {
      console.error('Error actualizando pago:', updatePagoError)
      return NextResponse.json(
        { error: 'Error al anular el pago' },
        { status: 500 }
      )
    }

    // 2. Si el pago estaba asociado a un movimiento de socio, reactivar la cuota
    if ((pago as any).fk_id_movimiento) {
      // Obtener el movimiento asociado
      const { data: movimiento, error: movimientoError } = await supabase
        .from('movimientos_socios')
        .select('*')
        .eq('id', (pago as any).fk_id_movimiento)
        .single()

      if (!movimientoError && movimiento) {
        // Cambiar el estado del movimiento a "Pendiente" para que pueda ser pagado nuevamente
        const { error: updateMovimientoError } = await supabase
          .from('movimientos_socios')
          .update({
            estado: 'Pendiente',
            saldo: (movimiento as any).monto // Restaurar el saldo al monto original
          } as any)
          .eq('id', (pago as any).fk_id_movimiento)

        if (updateMovimientoError) {
          console.error('Error reactivando movimiento:', updateMovimientoError)
        }
      }
    }

    // 3. Crear un movimiento en la caja en negativo (egreso por anulación)
    const nombreSocio = (pago as any).socios?.razon_social || 'Socio desconocido'

    // Obtener el usuario actual de Clerk
    const user = await currentUser()
    if (user) {
      // Obtener el ID del usuario de la base de datos
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single()

      if (usuario) {
        // Verificar si el usuario tiene una caja/lote abierto
        const { data: loteAbierto } = await supabase
          .from('lotes_operaciones')
          .select('id_lote')
          .eq('fk_id_usuario', (usuario as any).id)
          .eq('abierto', true)
          .single()

        if (loteAbierto && (pago as any).fk_id_cuenta_tesoreria) {
          // Solo registrar en detalle de lote (no en movimientos_caja)
          const { error: errorDetalleLote } = await supabase
            .from('detalle_lotes_operaciones')
            .insert([{
              fk_id_lote: (loteAbierto as any).id_lote,
              fk_id_cuenta_tesoreria: (pago as any).fk_id_cuenta_tesoreria,
              tipo: 'egreso',
              monto: (pago as any).monto,
              concepto: `Anulación de Pago - ${nombreSocio}`,
              observaciones: `Anulación de pago #${pagoId} - ${nombreSocio}`
            }] as any)

          if (errorDetalleLote) {
            console.error('Error registrando en detalle de lote:', errorDetalleLote)
            console.log('El pago se anuló correctamente, pero no se pudo registrar en el lote de caja')
          } else {
            console.log('Anulación registrada en lote de caja activo:', (loteAbierto as any).id_lote)
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Pago anulado exitosamente',
      pago: { ...(pago as any), estado: 'Anulado' }
    })

  } catch (error) {
    console.error('Error en API de anulación de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
