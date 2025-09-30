import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const socioId = parseInt(params.id)

    if (isNaN(socioId)) {
      return NextResponse.json(
        { error: 'ID de socio inválido' },
        { status: 400 }
      )
    }
    
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

    // Verificar que el socio existe
    const { data: existingSocio, error: findError } = await supabase
      .from('socios')
      .select('id')
      .eq('id', socioId)
      .single()

    if (findError || !existingSocio) {
      return NextResponse.json(
        { error: 'Socio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el CUIT no esté duplicado por otro socio
    const { data: existingCuit, error: cuitError } = await supabase
      .from('socios')
      .select('id')
      .eq('cuit', body.cuit)
      .neq('id', socioId)
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
        { error: 'Ya existe otro socio con ese CUIT' },
        { status: 400 }
      )
    }

    // Verificar que el email no esté duplicado por otro socio
    const { data: existingEmail, error: emailError } = await supabase
      .from('socios')
      .select('id')
      .eq('mail', body.mail)
      .neq('id', socioId)
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
        { error: 'Ya existe otro socio con ese email' },
        { status: 400 }
      )
    }

    // Preparar datos del socio para actualización
    const socioData = {
      nombre_socio: body.nombre_socio,
      razon_social: body.razon_social,
      nombre_fantasia: body.nombre_fantasia || null,
      domicilio_comercial: body.domicilio_comercial,
      nro_comercial: body.nro_comercial || null,
      telefono_comercial: body.telefono_comercial || null,
      celular: body.celular || null,
      mail: body.mail,
      comercializa: body.comercializa || false,
      quiero_comercializar: body.quiero_comercializar || false,
      es_comercializador: body.es_comercializador || false,
      rubro: body.rubro || null,
      fecha_alta: body.fecha_alta,
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
      habilitado: body.habilitado !== undefined ? body.habilitado : true,
      status: body.status || 'Activo',
      fk_id_usuario: body.fk_id_usuario || null,
      updated_at: new Date().toISOString()
    }

    // Actualizar el socio en la base de datos
    const { data: socio, error: updateError } = await supabase
      .from('socios')
      .update(socioData)
      .eq('id', socioId)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando socio:', updateError)
      return NextResponse.json(
        { error: 'Error actualizando el socio: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Socio actualizado exitosamente',
      socio
    })

  } catch (error) {
    console.error('Error en API de actualización de socio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}