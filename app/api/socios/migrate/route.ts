import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró el archivo' },
        { status: 400 }
      )
    }

    console.log('Archivo recibido:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type)

    // Leer el archivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let data: any[] = []

    // Procesar según el tipo de archivo
    try {
      if (file.name.endsWith('.csv')) {
        // Usar xlsx para procesar CSV también (más robusto)
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else {
        // Procesar Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)
      }

      console.log('Datos procesados:', data.length, 'filas')
      if (data.length > 0) {
        console.log('Primera fila:', data[0])
      }

    } catch (parseError: any) {
      console.error('Error procesando archivo:', parseError)
      return NextResponse.json(
        { error: 'Error procesando el archivo: ' + parseError.message },
        { status: 400 }
      )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío o no tiene el formato correcto' },
        { status: 400 }
      )
    }

    // Obtener rubros y tipos de comercio existentes
    const supabase = createClient()

    const { data: rubros, error: rubrosError } = await supabase
      .from('rubros')
      .select('id, nombre')

    if (rubrosError) {
      console.error('Error cargando rubros:', rubrosError)
      return NextResponse.json(
        { error: 'Error cargando rubros: ' + rubrosError.message },
        { status: 500 }
      )
    }

    const { data: tiposComercio, error: tiposError } = await supabase
      .from('tipo_comercios')
      .select('id, nombre')

    if (tiposError) {
      console.error('Error cargando tipos de comercio:', tiposError)
      return NextResponse.json(
        { error: 'Error cargando tipos de comercio: ' + tiposError.message },
        { status: 500 }
      )
    }

    const rubrosMap = new Map(rubros?.map(r => [r.nombre.toUpperCase(), r.id]) || [])
    const tiposComercioMap = new Map(tiposComercio?.map(t => [t.nombre.toUpperCase(), t.id]) || [])

    // Procesar cada fila
    const sociosToInsert = []
    const errors = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      try {
        // Buscar rubro_id
        let rubro_id = null
        if (row.rubro && row.rubro.trim()) {
          rubro_id = rubrosMap.get(row.rubro.toUpperCase().trim())
        }

        // Buscar tipo_comercio_id
        let tipo_comercio_id = null
        if (row.comercializa && row.comercializa.trim()) {
          tipo_comercio_id = tiposComercioMap.get(row.comercializa.toUpperCase().trim())
        }

        // Validar campos obligatorios (solo los realmente obligatorios)
        if (!row.nombre_socio || !row.razon_social || !row.domicilio_comercial) {
          errors.push(`Fila ${i + 2}: Faltan campos obligatorios básicos (nombre_socio, razon_social, domicilio_comercial)`)
          continue
        }

        // Si falta mail, usar un email temporal
        if (!row.mail || row.mail.trim() === '' || row.mail === 'undefined' || row.mail === 'NO TIENE') {
          row.mail = `temp_${i}_${Date.now()}@temporal.com`
        }

        // Si falta documento, usar uno temporal
        if (!row.documento) {
          row.documento = `TEMP${String(i).padStart(8, '0')}`
        }

        // Si falta CUIT, usar uno temporal
        if (!row.cuit) {
          row.cuit = `20${String(row.documento).padStart(8, '0')}1`
        }

        // Función para convertir fechas de Excel a fecha válida
        const parseExcelDate = (dateValue: any): string | null => {
          if (!dateValue) return null

          // Si es un número (fecha de Excel)
          if (typeof dateValue === 'number') {
            // Los números de Excel representan días desde 1900-01-01
            const excelEpoch = new Date(1900, 0, 1)
            const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000)
            return date.toISOString().split('T')[0]
          }

          // Si es string, intentar parsearlo
          try {
            const date = new Date(dateValue)
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]
            }
          } catch {
            return null
          }

          return null
        }

        // Normalizar estado civil
        const normalizeEstadoCivil = (estado: any): string | null => {
          if (!estado) return null
          const estadoStr = estado.toString().trim().toUpperCase()

          const mapping: { [key: string]: string } = {
            'SOLTERO': 'Soltero',
            'SOLTERA': 'Soltero',
            'CASADO': 'Casado',
            'CASADA': 'Casado',
            'DIVORCIADO': 'Divorciado',
            'DIVORCIADA': 'Divorciado',
            'VIUDO': 'Viudo',
            'VIUDA': 'Viudo',
            'UNION DE HECHO': 'Unión de hecho',
            'UNIÓN DE HECHO': 'Unión de hecho'
          }

          return mapping[estadoStr] || null
        }

        const socio = {
          nombre_socio: row.nombre_socio?.toString().trim() || '',
          tipo_socio: row.tipo_socio?.toString().trim() || 'Activo',
          razon_social: row.razon_social?.toString().trim() || '',
          nombre_fantasia: row.nombre_fantasia?.toString().trim() || null,
          domicilio_comercial: row.domicilio_comercial?.toString().trim() || '',
          nro_comercial: row.nro_comercial?.toString().trim() || null,
          telefono_comercial: row.telefono_comercial?.toString().trim() || null,
          celular: row.celular?.toString().trim() || null,
          mail: row.mail?.toString().trim() || '',
          rubro_id,
          tipo_comercio_id,
          fecha_alta: parseExcelDate(row.fecha_alta) || new Date().toISOString().split('T')[0],
          fecha_baja: parseExcelDate(row.fecha_baja),
          fecha_nacimiento: parseExcelDate(row.fecha_nacimiento),
          documento: row.documento?.toString().trim() || '',
          nacionalidad: row.nacionalidad?.toString().trim() || 'Argentina',
          estado_civil: normalizeEstadoCivil(row.estado_civil),
          domicilio_personal: row.domicilio_personal?.toString().trim() || null,
          nro_personal: row.nro_personal?.toString().trim() || null,
          localidad: row.localidad?.toString().trim() || null,
          codigo_postal: row.codigo_postal?.toString().trim() || null,
          telefono_fijo: row.telefono_fijo?.toString().trim() || null,
          cuit: row.cuit?.toString().trim() || '',
          habilitado: row.habilitado?.toString().trim() || null,
          fk_id_usuario: null
        }

        sociosToInsert.push(socio)
      } catch (error) {
        errors.push(`Fila ${i + 2}: Error procesando datos - ${error}`)
      }
    }

    console.log('Socios a insertar:', sociosToInsert.length)
    console.log('Errores encontrados:', errors.length)

    if (sociosToInsert.length === 0) {
      console.log('No hay socios para insertar. Errores:', errors)
      return NextResponse.json(
        {
          error: 'No se pudieron procesar los datos',
          details: errors
        },
        { status: 400 }
      )
    }

    // Log del primer socio para verificar estructura
    if (sociosToInsert.length > 0) {
      console.log('Primer socio a insertar:', JSON.stringify(sociosToInsert[0], null, 2))
    }

    // Insertar en la base de datos
    console.log('Intentando insertar en la base de datos...')
    const { data: insertedSocios, error: insertError } = await supabase
      .from('socios')
      .insert(sociosToInsert)
      .select()

    if (insertError) {
      console.error('Error de inserción completo:', JSON.stringify(insertError, null, 2))
      return NextResponse.json(
        {
          error: 'Error insertando en la base de datos',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      )
    }

    console.log('Inserción exitosa:', insertedSocios?.length, 'socios creados')

    return NextResponse.json({
      success: true,
      count: insertedSocios?.length || 0,
      errors: errors.length > 0 ? errors : null
    })

  } catch (error: any) {
    console.error('Error en migración completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    })
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}