import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'

// Función para convertir fechas de Excel a formato ISO
function parseExcelDate(dateValue: any): string | null {
  if (!dateValue) return null

  // Si es un string con formato DD/M/YYYY o D/M/YYYY
  if (typeof dateValue === 'string') {
    const parts = dateValue.split('/')
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      let year = parts[2]

      // Si el año es de 2 dígitos, convertirlo a 4 dígitos
      if (year.length === 2) {
        const yearNum = parseInt(year)
        // Asumimos que años < 50 son 2000+, años >= 50 son 1900+
        year = yearNum < 50 ? `20${year}` : `19${year}`
      }

      return `${year}-${month}-${day}`
    }
  }

  // Si es un número (fecha de Excel)
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue)
    const year = date.y
    const month = String(date.m).padStart(2, '0')
    const day = String(date.d).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Si es un objeto Date
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0]
  }

  return null
}

// Función para normalizar el estado civil
function normalizeEstadoCivil(value: any): string | null {
  if (!value) return null

  const valueStr = String(value).toLowerCase().trim()

  // Mapear variaciones comunes a los valores permitidos
  const mappings: { [key: string]: string } = {
    'soltero': 'Soltero',
    'soltera': 'Soltero',
    's': 'Soltero',
    'casado': 'Casado',
    'casada': 'Casado',
    'c': 'Casado',
    'divorciado': 'Divorciado',
    'divorciada': 'Divorciado',
    'd': 'Divorciado',
    'viudo': 'Viudo',
    'viuda': 'Viudo',
    'v': 'Viudo',
    'union de hecho': 'Unión de hecho',
    'union': 'Unión de hecho',
    'conviviente': 'Unión de hecho',
    'u': 'Unión de hecho'
  }

  return mappings[valueStr] || null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Leer el archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parsear el archivo Excel
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Obtener todos los rubros y tipos de comercio para mapear nombres a IDs
    const { data: rubros } = await supabase
      .from('rubros')
      .select('id, nombre') as any

    const { data: tiposComercio } = await supabase
      .from('tipo_comercios')
      .select('id, nombre') as any

    const rubrosMap = new Map(rubros?.map((r: any) => [r.nombre.toLowerCase(), r.id]) || [])
    const tiposComercioMap = new Map(tiposComercio?.map((t: any) => [t.nombre.toLowerCase(), t.id]) || [])

    const results = {
      success: 0,
      errors: [] as any[],
      total: data.length
    }

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i]

      try {
        // Generar email genérico si no existe
        let email = row.mail || row.email || null
        if (!email) {
          // Generar email único basado en el nombre y un timestamp
          const timestamp = Date.now()
          const nombreBase = (row.nombre_socio || row.nombre || 'socio').toLowerCase().replace(/\s+/g, '')
          email = `${nombreBase}.${timestamp}@sin-email.local`
        }

        // Mapear columnas del Excel a campos de la base de datos
        const socioData: any = {
          nro_socio: row.nro_socio || row.numero_socio || row.numero || null,
          nombre_socio: row.nombre_socio || row.nombre || 'SIN NOMBRE',
          razon_social: row.razon_social || row.nombre_socio || row.nombre || 'SIN RAZON SOCIAL',
          nombre_fantasia: row.nombre_fantasia || null,
          domicilio_comercial: row.domicilio_comercial || row.domicilio || 'SIN DOMICILIO',
          nro_comercial: row.nro_comercial || null,
          telefono_comercial: row.telefono_comercial || row.telefono || null,
          celular: row.celular || null,
          mail: email,
          fecha_alta: parseExcelDate(row.fecha_alta || row.fecha_ingreso),
          fecha_baja: parseExcelDate(row.fecha_baja),
          fecha_nacimiento: parseExcelDate(row.fecha_nacimiento),
          documento: row.documento || row.dni || null,
          estado_civil: normalizeEstadoCivil(row.estado_civil),
          nacionalidad: row.nacionalidad || 'Argentina',
          domicilio_personal: row.domicilio_personal || null,
          nro_personal: row.nro_personal || null,
          localidad: row.localidad || null,
          codigo_postal: row.codigo_postal || null,
          telefono_fijo: row.telefono_fijo || null,
          cuit: row.cuit || null,
          habilitado: row.habilitado || null,
          tipo_socio: row.tipo_socio || 'Activo',
          fk_id_usuario: null
        }

        // Mapear rubro por nombre
        if (row.rubro) {
          const rubroNombre = String(row.rubro).toLowerCase().trim()
          socioData.rubro_id = rubrosMap.get(rubroNombre) || null
        } else {
          socioData.rubro_id = null
        }

        // Mapear tipo_comercio por nombre
        if (row.tipo_comercio) {
          const tipoComercioNombre = String(row.tipo_comercio).toLowerCase().trim()
          socioData.tipo_comercio_id = tiposComercioMap.get(tipoComercioNombre) || null
        } else {
          socioData.tipo_comercio_id = null
        }

        // Verificar si el socio ya existe por nro_socio o mail y saltearlo
        if (socioData.nro_socio) {
          const { data: existingNro } = await supabase
            .from('socios')
            .select('id')
            .eq('nro_socio', socioData.nro_socio)
            .single() as any

          if (existingNro) {
            // Si ya existe, saltear este registro
            continue
          }
        }

        // Verificar si ya existe un socio con el mismo mail (solo si no es genérico)
        if (socioData.mail && !socioData.mail.includes('@sin-email.local')) {
          const { data: existingMail } = await supabase
            .from('socios')
            .select('id')
            .eq('mail', socioData.mail)
            .single() as any

          if (existingMail) {
            // Si ya existe, saltear este registro
            continue
          }
        }

        // Insertar el socio
        const { error: insertError } = await supabase
          .from('socios')
          .insert([socioData] as any)

        if (insertError) {
          results.errors.push({
            row: i + 2,
            error: insertError.message,
            data: row
          })
        } else {
          results.success++
        }

      } catch (error: any) {
        results.errors.push({
          row: i + 2,
          error: error.message || 'Error desconocido',
          data: row
        })
      }
    }

    return NextResponse.json({
      message: `Importación completada: ${results.success} éxitos, ${results.errors.length} errores`,
      results
    })

  } catch (error: any) {
    console.error('Error en importación:', error)
    return NextResponse.json(
      { error: 'Error procesando el archivo: ' + error.message },
      { status: 500 }
    )
  }
}
