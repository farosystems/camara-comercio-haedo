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

    console.log('Datos recibidos en transferencia:', JSON.stringify(data, null, 2))

    // Obtener el ID numérico del usuario desde la base de datos usando el clerk_user_id
    let { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('clerk_user_id', user.id)
      .single()

    // Si el usuario no existe, crearlo
    if (usuarioError && usuarioError.code === 'PGRST116') {
      console.log('Usuario no existe, creándolo...')
      const nuevoUsuario = {
        nombre: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Usuario',
        email: user.emailAddresses[0]?.emailAddress || `usuario_${user.id}@temp.com`,
        clerk_user_id: user.id,
        rol: 'socio'
      }

      const { data: usuarioCreado, error: errorCreacion } = await supabase
        .from('usuarios')
        .insert([nuevoUsuario])
        .select('id, nombre')
        .single()

      if (errorCreacion || !usuarioCreado) {
        console.error('Error creando usuario:', errorCreacion)
        return NextResponse.json({
          error: 'Error creando usuario en la base de datos'
        }, { status: 400 })
      }

      usuario = usuarioCreado
    } else if (usuarioError || !usuario) {
      console.error('Error obteniendo usuario:', usuarioError)
      return NextResponse.json({
        error: 'Error obteniendo usuario de la base de datos'
      }, { status: 400 })
    }

    // Verificar que el usuario tenga una caja abierta
    const { data: cajaAbierta, error: cajaError } = await supabase
      .from('lotes_operaciones')
      .select('id_lote')
      .eq('fk_id_usuario', usuario.id)
      .eq('abierto', true)
      .single()

    if (cajaError || !cajaAbierta) {
      console.error('No hay caja abierta para el usuario:', usuario.id)
      return NextResponse.json(
        { error: 'Debe abrir una caja antes de registrar transferencias' },
        { status: 400 }
      )
    }

    // Validar campos obligatorios
    if (!data.fk_id_cuenta || data.fk_id_cuenta === 0 || !data.concepto_ingreso || !data.fk_id_concepto || data.fk_id_concepto === 0 || !data.ingresos || data.ingresos <= 0 || !data.caja_destino_id) {
      console.log('Error de validación:', {
        fk_id_cuenta: data.fk_id_cuenta,
        concepto_ingreso: data.concepto_ingreso,
        fk_id_concepto: data.fk_id_concepto,
        ingresos: data.ingresos,
        caja_destino_id: data.caja_destino_id
      })
      return NextResponse.json({
        error: 'Faltan campos obligatorios para la transferencia',
        details: {
          cuenta_valida: data.fk_id_cuenta && data.fk_id_cuenta !== 0,
          concepto_valido: !!data.concepto_ingreso,
          fk_concepto_valido: data.fk_id_concepto && data.fk_id_concepto !== 0,
          monto_valido: data.ingresos && data.ingresos > 0,
          caja_destino_valida: !!data.caja_destino_id
        },
        received: data
      }, { status: 400 })
    }

    // 1. Preparar datos del EGRESO (desde la caja del usuario actual)
    const egresoData = {
      fk_id_cuenta: data.fk_id_cuenta,
      fecha: data.fecha,
      concepto_ingreso: `Transferencia a otra caja - ${data.concepto_ingreso}`,
      apellido_nombres: data.apellido_nombres || null,
      fk_id_proveedor: data.fk_id_proveedor || null,
      numero_comprobante: data.numero_comprobante || null,
      nota: data.nota || null,
      fk_id_concepto: data.fk_id_concepto, // Concepto ID = 4
      tipo: 'Egreso',
      ingresos: parseFloat(data.ingresos),
      observaciones: `Transferencia hacia caja destino ID: ${data.caja_destino_id}. ${data.observaciones || ''}`,
      fk_id_usuario: usuario.id
    }

    // 2. Insertar el EGRESO en movimientos_caja
    const { data: egreso, error: egresoError } = await supabase
      .from('movimientos_caja')
      .insert([egresoData])
      .select()
      .single()

    if (egresoError) {
      console.error('Error insertando egreso:', egresoError)
      return NextResponse.json({ error: 'Error guardando el egreso' }, { status: 500 })
    }

    // 3. Verificar si el usuario actual tiene una caja abierta para registrar el egreso en detalle_lotes_operaciones
    const { data: loteOrigenAbierto } = await supabase
      .from('lotes_operaciones')
      .select('id_lote')
      .eq('fk_id_usuario', usuario.id)
      .eq('abierto', true)
      .single()

    if (loteOrigenAbierto) {
      // Registrar el egreso en el detalle del lote del usuario actual
      const { error: errorDetalleLoteOrigen } = await supabase
        .from('detalle_lotes_operaciones')
        .insert([{
          fk_id_lote: loteOrigenAbierto.id_lote,
          fk_id_cuenta_tesoreria: data.fk_id_cuenta,
          tipo: 'egreso',
          monto: parseFloat(data.ingresos),
          concepto: `Transferencia - ${data.concepto_ingreso}`,
          observaciones: `Transferencia desde módulo hacia caja destino ID: ${data.caja_destino_id}`
        }])

      if (errorDetalleLoteOrigen) {
        console.error('Error registrando egreso en detalle de lote origen:', errorDetalleLoteOrigen)
        // No fallar la operación principal, pero registrar el error
        console.log('El egreso se guardó correctamente, pero no se pudo registrar en el lote de caja del usuario')
      } else {
        console.log('Egreso registrado en lote de caja del usuario:', loteOrigenAbierto.id_lote)
      }
    }

    // 4. Obtener información del lote destino
    const { data: loteDestino, error: loteDestinoError } = await supabase
      .from('lotes_operaciones')
      .select('fk_id_usuario, id_lote')
      .eq('id_lote', data.caja_destino_id)
      .eq('abierto', true)
      .single()

    if (loteDestinoError || !loteDestino) {
      // El lote destino no existe o no está abierto - reversar el egreso
      await supabase
        .from('movimientos_caja')
        .delete()
        .eq('id', egreso.id)

      return NextResponse.json({
        error: 'La caja destino no existe o no está abierta'
      }, { status: 400 })
    }

    // 5. Preparar datos del INGRESO (hacia la caja destino)
    const ingresoData = {
      fk_id_cuenta: data.fk_id_cuenta,
      fecha: data.fecha,
      concepto_ingreso: `Transferencia recibida - ${data.concepto_ingreso}`,
      apellido_nombres: data.apellido_nombres || null,
      fk_id_proveedor: data.fk_id_proveedor || null,
      numero_comprobante: data.numero_comprobante || null,
      nota: data.nota || null,
      fk_id_concepto: 5, // Concepto ID = 5 para ingresos en caja destino
      tipo: 'Ingreso',
      ingresos: parseFloat(data.ingresos),
      observaciones: `Transferencia recibida desde usuario ${usuario.nombre}. ${data.observaciones || ''}`,
      fk_id_usuario: loteDestino.fk_id_usuario // Usuario de la caja destino
    }

    // 6. Insertar el INGRESO en movimientos_caja
    const { data: ingreso, error: ingresoError } = await supabase
      .from('movimientos_caja')
      .insert([ingresoData])
      .select()
      .single()

    if (ingresoError) {
      console.error('Error insertando ingreso:', ingresoError)

      // Reversar el egreso
      await supabase
        .from('movimientos_caja')
        .delete()
        .eq('id', egreso.id)

      return NextResponse.json({ error: 'Error guardando el ingreso - operación revertida' }, { status: 500 })
    }

    // 7. Registrar el ingreso en el detalle del lote destino
    const { error: errorDetalleLoteDestino } = await supabase
      .from('detalle_lotes_operaciones')
      .insert([{
        fk_id_lote: data.caja_destino_id,
        fk_id_cuenta_tesoreria: data.fk_id_cuenta,
        tipo: 'ingreso',
        monto: parseFloat(data.ingresos),
        concepto: `Transferencia recibida - ${data.concepto_ingreso}`,
        observaciones: `Transferencia recibida desde usuario ${usuario.nombre}`
      }])

    if (errorDetalleLoteDestino) {
      console.error('Error registrando ingreso en detalle de lote destino:', errorDetalleLoteDestino)
      // No fallar la operación principal, pero registrar el error
      console.log('El ingreso se guardó correctamente, pero no se pudo registrar en el lote de caja destino')
    } else {
      console.log('Ingreso registrado en lote de caja destino:', data.caja_destino_id)
    }

    return NextResponse.json({
      success: true,
      egreso,
      ingreso,
      message: 'Transferencia realizada exitosamente',
      detalles: {
        usuario_origen: usuario.nombre,
        caja_destino_id: data.caja_destino_id,
        monto: parseFloat(data.ingresos)
      }
    })

  } catch (error) {
    console.error('Error en API transferencia:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}