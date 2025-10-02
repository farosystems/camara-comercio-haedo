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

    // Obtener el ID numérico del usuario incluyendo su rol
    let { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nombre, rol')
      .eq('clerk_user_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const abierto = searchParams.get('abierto')
    const cajaId = searchParams.get('caja_id')
    const todos = searchParams.get('todos') // Para resumen general
    const excluirUsuario = searchParams.get('excluir_usuario') // Para excluir lotes del usuario actual

    let query = supabase
      .from('lotes_operaciones')
      .select(`
        *,
        caja:cajas!fk_id_caja(id, nombre),
        usuario:usuarios!fk_id_usuario(nombre)
      `)

    // FILTROS DE SEGURIDAD POR ROL
    if (excluirUsuario === 'true') {
      // Para dropdown de transferencias: mostrar solo lotes de OTROS usuarios
      query = query.neq('fk_id_usuario', usuario.id)
    } else if (todos === 'true') {
      // Para resumen general: admin puede ver todos, socios ven todos los suyos
      if (usuario.rol !== 'admin') {
        // Los socios pueden ver todos sus propios lotes (no hay restricción adicional)
        query = query.eq('fk_id_usuario', usuario.id)
      }
      // Si es admin, no agregamos filtro (puede ver de todos los usuarios)
    } else {
      // Para consultas normales, siempre filtrar por usuario
      query = query.eq('fk_id_usuario', usuario.id)
    }

    if (abierto !== null) {
      query = query.eq('abierto', abierto === 'true')
    }

    if (cajaId) {
      query = query.eq('fk_id_caja', cajaId)
    }

    query = query.order('fecha_apertura', { ascending: false })

    const { data: lotes, error } = await query

    if (error) {
      console.error('Error obteniendo lotes:', error)
      return NextResponse.json({ error: 'Error obteniendo lotes' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lotes: lotes || []
    })

  } catch (error) {
    console.error('Error en API lotes-operaciones:', error)
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
    let { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('clerk_user_id', user.id)
      .single()

    // Si el usuario no existe, crearlo
    if (usuarioError && usuarioError.code === 'PGRST116') {
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

    // Validar campos obligatorios
    if (!data.fk_id_caja || data.saldo_inicial === undefined || data.saldo_inicial < 0) {
      return NextResponse.json({
        error: 'Faltan campos obligatorios o el saldo inicial debe ser mayor o igual a 0'
      }, { status: 400 })
    }

    // Verificar que no haya otro lote abierto para este usuario y caja
    const { data: loteAbierto, error: errorLoteAbierto } = await supabase
      .from('lotes_operaciones')
      .select('id_lote')
      .eq('fk_id_usuario', usuario.id)
      .eq('fk_id_caja', data.fk_id_caja)
      .eq('abierto', true)
      .single()

    if (loteAbierto) {
      return NextResponse.json({
        error: 'Ya tienes un lote abierto para esta caja. Debes cerrarlo antes de abrir uno nuevo.'
      }, { status: 400 })
    }

    const ahora = new Date()
    const horaApertura = ahora.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    })

    // Crear nuevo lote
    const { data: lote, error } = await supabase
      .from('lotes_operaciones')
      .insert([{
        fk_id_usuario: usuario.id,
        fk_id_caja: data.fk_id_caja,
        abierto: true,
        tipo_lote: 'apertura',
        hora_apertura: horaApertura,
        observaciones: data.observaciones?.trim() || null,
        saldo_inicial: parseFloat(data.saldo_inicial) || 0
      }])
      .select(`
        *,
        caja:cajas!fk_id_caja(id, nombre),
        usuario:usuarios!fk_id_usuario(nombre)
      `)
      .single()

    if (error) {
      console.error('Error creando lote:', error)
      return NextResponse.json({ error: 'Error creando el lote' }, { status: 500 })
    }

    // Si hay saldo inicial > 0, crear registros en detalle_lotes_operaciones y movimientos_caja
    if (parseFloat(data.saldo_inicial) > 0) {
      // Obtener una cuenta por defecto (la primera cuenta de efectivo, o la primera disponible)
      const { data: cuentaEfectivo } = await supabase
        .from('cuentas')
        .select('id')
        .eq('tipo', 'Efectivo')
        .limit(1)
        .single()

      let cuentaId = cuentaEfectivo?.id

      // Si no hay cuenta de efectivo, usar la primera cuenta disponible
      if (!cuentaId) {
        const { data: primeraCuenta } = await supabase
          .from('cuentas')
          .select('id')
          .limit(1)
          .single()

        cuentaId = primeraCuenta?.id
      }

      if (cuentaId) {
        // Crear registro en detalle_lotes_operaciones
        const { error: errorDetalle } = await supabase
          .from('detalle_lotes_operaciones')
          .insert([{
            fk_id_lote: lote.id_lote,
            fk_id_cuenta_tesoreria: cuentaId,
            tipo: 'ingreso',
            monto: parseFloat(data.saldo_inicial),
            concepto: 'Saldo inicial de caja',
            observaciones: 'Apertura de caja - saldo inicial'
          }])

        if (errorDetalle) {
          console.error('Error creando movimiento inicial en detalle_lotes:', errorDetalle)
          // No fallar la operación si no se puede crear el detalle, pero log el error
        }

        // Crear registro en movimientos_caja
        const fechaApertura = lote.fecha_apertura || new Date().toISOString()
        const { error: errorMovimientoCaja } = await supabase
          .from('movimientos_caja')
          .insert([{
            fk_id_cuenta: 1, // Cuenta de ID = 1
            fecha: fechaApertura,
            concepto_ingreso: 'Apertura de caja',
            apellido_nombres: null,
            fk_id_proveedor: null,
            numero_comprobante: null,
            nota: `Saldo inicial de caja - Lote ${lote.id_lote}`,
            fk_id_concepto: 6, // Concepto de ID = 6
            tipo: 'Ingreso',
            ingresos: parseFloat(data.saldo_inicial),
            observaciones: `Apertura de caja ${lote.caja?.nombre || ''} - Usuario: ${usuario.nombre}`,
            fk_id_usuario: usuario.id
          }])

        if (errorMovimientoCaja) {
          console.error('Error creando movimiento en movimientos_caja:', errorMovimientoCaja)
          // No fallar la operación si no se puede crear el movimiento, pero log el error
        }
      }
    }

    return NextResponse.json({
      success: true,
      lote,
      message: 'Caja abierta exitosamente'
    })

  } catch (error) {
    console.error('Error en API lotes-operaciones POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}