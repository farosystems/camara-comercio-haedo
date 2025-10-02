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

    console.log('Datos recibidos en API:', JSON.stringify(data, null, 2))

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
        { error: 'Debe abrir una caja antes de registrar movimientos' },
        { status: 400 }
      )
    }

    // Validar campos obligatorios
    if (!data.fk_id_cuenta || data.fk_id_cuenta === 0 || !data.concepto_ingreso || !data.fk_id_concepto || data.fk_id_concepto === 0 || !data.ingresos || data.ingresos <= 0) {
      console.log('Error de validación:', {
        fk_id_cuenta: data.fk_id_cuenta,
        concepto_ingreso: data.concepto_ingreso,
        fk_id_concepto: data.fk_id_concepto,
        ingresos: data.ingresos
      })
      return NextResponse.json({
        error: 'Faltan campos obligatorios o el monto debe ser mayor a 0',
        details: {
          cuenta_valida: data.fk_id_cuenta && data.fk_id_cuenta !== 0,
          concepto_valido: !!data.concepto_ingreso,
          fk_concepto_valido: data.fk_id_concepto && data.fk_id_concepto !== 0,
          monto_valido: data.ingresos && data.ingresos > 0
        },
        received: data
      }, { status: 400 })
    }


    // Preparar datos del movimiento
    const movimientoData = {
      fk_id_cuenta: data.fk_id_cuenta,
      fecha: data.fecha,
      concepto_ingreso: data.concepto_ingreso,
      apellido_nombres: data.apellido_nombres || null,
      fk_id_proveedor: data.fk_id_proveedor || null,
      numero_comprobante: data.numero_comprobante || null,
      nota: data.nota || null,
      fk_id_concepto: data.fk_id_concepto,
      tipo: data.tipo,
      ingresos: parseFloat(data.ingresos),
      observaciones: data.observaciones || null,
      fk_id_usuario: usuario.id
    }

    // Insertar el movimiento
    const { data: movimiento, error: movimientoError } = await supabase
      .from('movimientos_caja')
      .insert([movimientoData])
      .select()
      .single()

    if (movimientoError) {
      console.error('Error insertando movimiento:', movimientoError)
      return NextResponse.json({ error: 'Error guardando el movimiento' }, { status: 500 })
    }

    // Verificar si el usuario tiene una caja abierta para registrar también en detalle_lotes_operaciones
    const { data: loteAbierto } = await supabase
      .from('lotes_operaciones')
      .select('id_lote')
      .eq('fk_id_usuario', usuario.id)
      .eq('abierto', true)
      .single()

    if (loteAbierto) {
      // Registrar el movimiento también en el detalle del lote activo
      const { error: errorDetalleLote } = await supabase
        .from('detalle_lotes_operaciones')
        .insert([{
          fk_id_lote: loteAbierto.id_lote,
          fk_id_cuenta_tesoreria: data.fk_id_cuenta,
          tipo: data.tipo.toLowerCase(), // 'Ingreso' -> 'ingreso', 'Egreso' -> 'egreso'
          monto: parseFloat(data.ingresos),
          concepto: data.concepto_ingreso,
          observaciones: `Movimiento desde módulo: ${data.observaciones || 'Sin observaciones'}${data.apellido_nombres ? ` - ${data.apellido_nombres}` : ''}${data.numero_comprobante ? ` - Comprobante: ${data.numero_comprobante}` : ''}`
        }])

      if (errorDetalleLote) {
        console.error('Error registrando en detalle de lote:', errorDetalleLote)
        // No fallar la operación principal, pero registrar el error
        console.log('El movimiento se guardó correctamente, pero no se pudo registrar en el lote de caja')
      } else {
        console.log('Movimiento registrado también en lote de caja activo:', loteAbierto.id_lote)
      }
    }

    return NextResponse.json({
      success: true,
      movimiento,
      message: 'Movimiento guardado exitosamente'
    })

  } catch (error) {
    console.error('Error en API movimientos-caja:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get('cuenta_id')

    // Obtener información del usuario incluyendo su rol
    let { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nombre, rol')
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
        .select('id, nombre, rol')
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

    let query = supabase
      .from('movimientos_caja')
      .select(`
        *,
        cuenta:cuentas!fk_id_cuenta(nombre, tipo),
        concepto:conceptos_movimientos!fk_id_concepto(nombre, tipo),
        proveedor:proveedores!fk_id_proveedor(razon_social),
        usuario:usuarios!fk_id_usuario(nombre)
      `)
      .order('fecha', { ascending: false })
      .order('id', { ascending: false })

    // FILTROS DE SEGURIDAD POR ROL
    if (usuario.rol !== 'admin') {
      // Si no es admin, solo puede ver sus propios movimientos
      query = query.eq('fk_id_usuario', usuario.id)
    }
    // Si es admin, puede ver todos los movimientos (no agregamos filtro)

    if (cuentaId) {
      query = query.eq('fk_id_cuenta', cuentaId)
    }

    const { data: movimientos, error } = await query

    if (error) {
      console.error('Error obteniendo movimientos:', error)
      return NextResponse.json({ error: 'Error obteniendo movimientos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      movimientos: movimientos || [],
      userRole: usuario.rol // Opcional: para debug
    })

  } catch (error) {
    console.error('Error en API movimientos-caja GET:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}