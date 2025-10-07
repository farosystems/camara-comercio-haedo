import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getArgentinaDateString } from '@/lib/date-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar campos obligatorios
    const requiredFields = ['nombre_socio', 'razon_social', 'domicilio_comercial', 'mail', 'documento', 'cuit']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es obligatorio` },
          { status: 400 }
        )
      }
    }

    const supabase = createClient()

    // Verificar que el CUIT no esté duplicado
    const { data: existingCuit, error: cuitError } = await supabase
      .from('socios')
      .select('id')
      .eq('cuit', body.cuit)
      .single()

    if (cuitError && cuitError.code !== 'PGRST116') {
      console.error('Error verificando CUIT:', cuitError)
      return NextResponse.json(
        { error: 'Error verificando CUIT duplicado' },
        { status: 500 }
      )
    }

    if (existingCuit) {
      return NextResponse.json(
        { error: 'Ya existe un socio con ese CUIT' },
        { status: 400 }
      )
    }

    // Verificar que el email no esté duplicado
    const { data: existingEmail, error: emailError } = await supabase
      .from('socios')
      .select('id')
      .eq('mail', body.mail)
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error verificando email:', emailError)
      return NextResponse.json(
        { error: 'Error verificando email duplicado' },
        { status: 500 }
      )
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Ya existe un socio con ese email' },
        { status: 400 }
      )
    }

    // Preparar datos del socio
    const socioData = {
      nombre_socio: body.nombre_socio,
      razon_social: body.razon_social,
      nombre_fantasia: body.nombre_fantasia || null,
      domicilio_comercial: body.domicilio_comercial,
      nro_comercial: body.nro_comercial || null,
      telefono_comercial: body.telefono_comercial || null,
      celular: body.celular || null,
      mail: body.mail,
      comercializa: body.comercializa || null,
      rubro: body.rubro || null,
      rubro_id: body.rubro_id || null,
      tipo_comercio_id: body.tipo_comercio_id || null,
      fecha_alta: body.fecha_alta || getArgentinaDateString(),
      fecha_baja: body.fecha_baja || null,
      fecha_nacimiento: body.fecha_nacimiento || null,
      documento: body.documento,
      estado_civil: body.estado_civil || null,
      nacionalidad: body.nacionalidad || 'Argentina',
      domicilio_personal: body.domicilio_personal || null,
      nro_personal: body.nro_personal || null,
      localidad: body.localidad || null,
      codigo_postal: body.codigo_postal || null,
      telefono_fijo: body.telefono_fijo || null,
      cuit: body.cuit,
      habilitado: body.habilitado || null,
      tipo_socio: body.tipo_socio || 'Activo',
      fk_id_usuario: body.fk_id_usuario || null
    }

    // Insertar el socio en la base de datos
    const { data: socio, error: insertError } = await supabase
      .from('socios')
      .insert([socioData])
      .select()
      .single()

    if (insertError) {
      console.error('Error insertando socio:', insertError)
      return NextResponse.json(
        { error: 'Error creando el socio: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Socio creado exitosamente',
      socio
    }, { status: 201 })

  } catch (error) {
    console.error('Error en API de creación de socio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}