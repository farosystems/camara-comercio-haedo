import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar campos obligatorios
    if (!body.nombre) {
      return NextResponse.json(
        { error: 'El nombre de la cuenta es obligatorio' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verificar que el nombre no esté duplicado
    const { data: existingCuenta, error: existingError } = await supabase
      .from('cuentas')
      .select('id')
      .eq('nombre', body.nombre)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error verificando nombre duplicado:', existingError)
      return NextResponse.json(
        { error: 'Error verificando nombre duplicado' },
        { status: 500 }
      )
    }

    if (existingCuenta) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese nombre' },
        { status: 400 }
      )
    }

    // Preparar datos de la cuenta
    const cuentaData = {
      nombre: body.nombre,
      descripcion: body.descripcion || null,
      tipo: body.tipo || 'Otro',
      numero_cuenta: body.numero_cuenta || null,
      banco: body.banco || null,
      activo: body.activo !== undefined ? body.activo : true,
      saldo_inicial: body.saldo_inicial || 0
    }

    // Insertar la cuenta en la base de datos
    const { data: cuenta, error: insertError } = await supabase
      .from('cuentas')
      .insert([cuentaData])
      .select()
      .single()

    if (insertError) {
      console.error('Error insertando cuenta:', insertError)
      return NextResponse.json(
        { error: 'Error creando la cuenta: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      cuenta
    }, { status: 201 })

  } catch (error) {
    console.error('Error en API de creación de cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}