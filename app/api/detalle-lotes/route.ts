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
    const { searchParams } = new URL(request.url)
    const loteId = searchParams.get('lote_id')
    const todos = searchParams.get('todos') // Para resumen general

    // Si es para resumen general, aplicar filtros de seguridad por rol
    if (todos === 'true') {
      // Obtener información del usuario incluyendo su rol
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, rol')
        .eq('clerk_user_id', user.id)
        .single()

      if (!usuario) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 })
      }

      let query = supabase
        .from('detalle_lotes_operaciones')
        .select(`
          *,
          cuenta:cuentas!fk_id_cuenta_tesoreria(nombre, tipo),
          lote:lotes_operaciones!fk_id_lote(
            id_lote,
            fk_id_usuario,
            caja:cajas!fk_id_caja(nombre),
            usuario:usuarios!fk_id_usuario(nombre)
          )
        `)
        .order('fecha_movimiento', { ascending: false })

      // FILTROS DE SEGURIDAD POR ROL
      if (usuario.rol !== 'admin') {
        // Si no es admin, primero obtener todos sus lotes y luego filtrar los detalles
        const { data: userLotes } = await supabase
          .from('lotes_operaciones')
          .select('id_lote')
          .eq('fk_id_usuario', usuario.id)

        if (userLotes && userLotes.length > 0) {
          const loteIds = userLotes.map(lote => lote.id_lote)
          query = query.in('fk_id_lote', loteIds)
        } else {
          // Si no tiene lotes, no devolver nada
          query = query.eq('fk_id_lote', -1) // Filtro que nunca va a coincidir
        }
      }

      const { data: detalles, error } = await query

      if (error) {
        console.error('Error obteniendo detalle de todos los lotes:', error)
        return NextResponse.json({ error: 'Error obteniendo movimientos' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        detalles: detalles || []
      })
    }

    if (!loteId) {
      return NextResponse.json({ error: 'ID de lote requerido' }, { status: 400 })
    }

    // Verificar que el lote pertenece al usuario actual
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 })
    }

    const { data: lote } = await supabase
      .from('lotes_operaciones')
      .select('id_lote')
      .eq('id_lote', loteId)
      .eq('fk_id_usuario', usuario.id)
      .single()

    if (!lote) {
      return NextResponse.json({ error: 'Lote no encontrado o no autorizado' }, { status: 403 })
    }

    // Obtener detalle de movimientos del lote
    const { data: detalles, error } = await supabase
      .from('detalle_lotes_operaciones')
      .select(`
        *,
        cuenta:cuentas!fk_id_cuenta_tesoreria(nombre, tipo)
      `)
      .eq('fk_id_lote', loteId)
      .order('fecha_movimiento', { ascending: false })

    if (error) {
      console.error('Error obteniendo detalle de lote:', error)
      return NextResponse.json({ error: 'Error obteniendo movimientos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      detalles: detalles || []
    })

  } catch (error) {
    console.error('Error en API detalle-lotes:', error)
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

    // Obtener el ID numérico del usuario
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 })
    }

    // Validar campos obligatorios
    if (!data.fk_id_lote || !data.fk_id_cuenta_tesoreria || !data.tipo || !data.monto || data.monto <= 0) {
      return NextResponse.json({
        error: 'Faltan campos obligatorios o el monto debe ser mayor a 0'
      }, { status: 400 })
    }

    // Verificar que el lote existe, está abierto y pertenece al usuario
    const { data: lote, error: loteError } = await supabase
      .from('lotes_operaciones')
      .select('id_lote, abierto')
      .eq('id_lote', data.fk_id_lote)
      .eq('fk_id_usuario', usuario.id)
      .single()

    if (loteError || !lote) {
      return NextResponse.json({
        error: 'Lote no encontrado o no autorizado'
      }, { status: 400 })
    }

    if (!lote.abierto) {
      return NextResponse.json({
        error: 'No se pueden agregar movimientos a un lote cerrado'
      }, { status: 400 })
    }

    // Insertar movimiento en el detalle del lote
    const { data: detalle, error } = await supabase
      .from('detalle_lotes_operaciones')
      .insert([{
        fk_id_lote: data.fk_id_lote,
        fk_id_cuenta_tesoreria: data.fk_id_cuenta_tesoreria,
        tipo: data.tipo,
        monto: parseFloat(data.monto),
        concepto: data.concepto?.trim() || null,
        observaciones: data.observaciones?.trim() || null
      }])
      .select(`
        *,
        cuenta:cuentas!fk_id_cuenta_tesoreria(nombre, tipo)
      `)
      .single()

    if (error) {
      console.error('Error creando movimiento en lote:', error)
      return NextResponse.json({ error: 'Error creando el movimiento' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      detalle,
      message: 'Movimiento registrado exitosamente'
    })

  } catch (error) {
    console.error('Error en API detalle-lotes POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}