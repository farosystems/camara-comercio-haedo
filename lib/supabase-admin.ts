import { createClient } from '@/lib/supabase'
import { Usuario } from '@/lib/supabase'

// =====================================================
// INTERFACES PARA MÓDULO DE MOVIMIENTOS
// =====================================================

export interface Cuenta {
  id: number
  nombre: string
  descripcion: string | null
  tipo: 'Bancaria' | 'Efectivo' | 'Otro'
  numero_cuenta: string | null
  banco: string | null
  activo: boolean
  saldo_inicial: number
  created_at: string
  updated_at: string
}

export interface ConceptoMovimiento {
  id: number
  nombre: string
  descripcion: string | null
  tipo: 'Ingreso' | 'Egreso'
  categoria: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface MovimientoBancario {
  id: number
  fk_id_cuenta: number
  fecha: string
  concepto_ingreso: string
  apellido_nombres: string | null
  fk_id_socio: number | null
  numero_comprobante: string | null
  nota: string | null
  fk_id_concepto: number
  egresos_fines_generales: number
  egresos_fines_especificos: number
  ingresos: number
  saldo_cuenta: number
  comprobante_path: string | null
  observaciones: string | null
  created_at: string
  updated_at: string
}

export interface MovimientoEfectivo {
  id: number
  fk_id_cuenta: number
  fecha: string
  concepto_ingreso: string
  apellido_nombres: string | null
  fk_id_socio: number | null
  numero_comprobante: string | null
  nota: string | null
  fk_id_concepto: number
  egresos_fines_generales: number
  egresos_fines_especificos: number
  ingresos: number
  saldo_cuenta: number
  comprobante_path: string | null
  observaciones: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// FUNCIONES PARA USUARIOS (ya existentes)
// =====================================================

export async function getUsuarios(): Promise<Usuario[]> {
  const supabase = createClient()
  
  // Primero obtener todos los usuarios
  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('*')
    .order('nombre')
  
  if (usuariosError) throw usuariosError
  if (!usuarios) return []
  
  // Luego obtener todos los socios
  const { data: socios, error: sociosError } = await supabase
    .from('socios')
    .select('id, nombre_socio, fk_id_usuario')
  
  if (sociosError) throw sociosError
  
  // Combinar los datos manualmente
  const usuariosConSocios = usuarios.map(usuario => {
    const sociosDelUsuario = socios?.filter(socio => socio.fk_id_usuario === usuario.id) || []
    
    // Debug: Log para ver qué está pasando
    if (usuario.rol === 'socio') {
      console.log(`Usuario ${usuario.nombre} (ID: ${usuario.id}) - Socios encontrados:`, sociosDelUsuario)
    }
    
    return {
      ...usuario,
      socios: sociosDelUsuario.map(socio => ({
        id: socio.id,
        razon_social: socio.nombre_socio
      }))
    }
  })
  
  // Debug: Log general de socios
  console.log('Todos los socios obtenidos:', socios)
  
  return usuariosConSocios
}

export async function getEstadisticasUsuarios() {
  const supabase = createClient()
  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('rol, status, prueba_gratis')
  
  if (error) throw error
  
  return {
    total: usuarios?.length || 0,
    administradores: usuarios?.filter((u: any) => u.rol === 'admin').length || 0,
    supervisores: usuarios?.filter((u: any) => u.rol === 'supervisor').length || 0,
    socios: usuarios?.filter((u: any) => u.rol === 'socio').length || 0,
    activos: usuarios?.filter((u: any) => u.status === 'Activo').length || 0,
    pruebaGratis: usuarios?.filter((u: any) => u.prueba_gratis).length || 0
  }
}

export async function crearUsuario(userData: Omit<Usuario, 'creado_el' | 'id' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('usuarios')
    .insert(userData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function actualizarUsuario(id: number, userData: Partial<Usuario>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('usuarios')
    .update(userData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// =====================================================
// FUNCIONES PARA SOCIOS
// =====================================================

export interface Socio {
  id: number
  nombre_socio: string
  razon_social: string
  nombre_fantasia: string | null
  domicilio_comercial: string
  nro_comercial: string | null
  telefono_comercial: string | null
  celular: string | null
  mail: string
  comercializa: boolean
  quiero_comercializar: boolean
  es_comercializador: boolean
  rubro: string | null
  fecha_alta: string
  fecha_baja: string | null
  tipo_socio: 'Activo' | 'Adherente' | 'Vitalicio'
  fecha_nacimiento: string | null
  documento: string
  estado_civil: string | null
  nacionalidad: string
  domicilio_personal: string | null
  nro_personal: string | null
  localidad: string | null
  codigo_postal: string | null
  telefono_fijo: string | null
  cuit: string
  habilitado: boolean
  status: string
  fk_id_usuario: number | null
  created_at: string
  updated_at: string
}

export async function getSocios(): Promise<Socio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('socios')
    .select('*')
    .order('nombre_socio')
  
  if (error) throw error
  return data || []
}

export async function crearSocio(socioData: Omit<Socio, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('socios')
    .insert(socioData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function actualizarSocio(id: number, socioData: Partial<Socio>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('socios')
    .update(socioData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}


// =====================================================
// FUNCIONES PARA PRODUCTOS
// =====================================================

export interface Producto {
  id: number
  codigo: string
  nombre: string
  categoria: string
  marca: string
  descripcion: string | null
  precio: number
  fk_id_lista_precio: number | null
  activo: boolean
  created_at: string
  updated_at: string
}

export async function getProductos(): Promise<Producto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre')
  
  if (error) throw error
  return data || []
}

export async function crearProducto(productoData: Omit<Producto, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  // Crear el producto
  const { data: producto, error } = await supabase
    .from('productos')
    .insert(productoData)
    .select()
    .single()
  
  if (error) throw error
  
  // Si el producto está asociado a una lista de precios, crear el registro en items_lista_precios
  if (producto.fk_id_lista_precio) {
    try {
      // Obtener la lista de precios para verificar que existe
      const { data: listaPrecio, error: errorLista } = await supabase
        .from('listas_precios')
        .select('id, nombre')
        .eq('id', producto.fk_id_lista_precio)
        .single()
      
      if (errorLista) {
        console.error('Error verificando lista de precios:', errorLista)
        // No lanzamos error aquí, solo registramos el problema
      } else {
        // Verificar si ya existe un registro para este producto en esta lista
        const { data: existingItem, error: errorCheck } = await supabase
          .from('items_lista_precios')
          .select('id')
          .eq('fk_id_lista_precio', producto.fk_id_lista_precio)
          .eq('fk_id_producto', producto.id)
          .single()
        
        if (errorCheck && errorCheck.code !== 'PGRST116') {
          console.error('Error verificando item existente:', errorCheck)
        }
        
                if (existingItem) {
          console.log(`Item ya existe para producto "${producto.nombre}" en lista "${listaPrecio?.nombre}"`)
        } else {
          // Crear el registro en items_lista_precios con precio y descuento por defecto
          const { data: itemData, error: errorItem } = await supabase
            .from('items_lista_precios')
            .insert({
              fk_id_lista_precio: producto.fk_id_lista_precio,
              fk_id_producto: producto.id,
              precio: producto.precio, // Usar el precio del producto
              descuento: 0.00 // Descuento por defecto
            })
            .select()
          
          if (errorItem) {
            console.error('Error creando item de lista de precios:', {
              message: errorItem.message,
              code: errorItem.code,
              details: errorItem.details,
              hint: errorItem.hint,
              producto_id: producto.id,
              lista_precio_id: producto.fk_id_lista_precio
            })
            // No lanzamos error aquí, solo registramos el problema
          } else {
            console.log(`Producto "${producto.nombre}" agregado a la lista de precios "${listaPrecio?.nombre}" con precio y descuento por defecto`)
          }
        }
      }
    } catch (err) {
      console.error('Error en proceso de creación de item de lista de precios:', err)
      // No lanzamos error aquí para no afectar la creación del producto
    }
  }
  
  return producto
}

export async function actualizarProducto(id: number, productoData: Partial<Producto>) {
  const supabase = createClient()
  
  // Obtener el producto actual para comparar
  const { data: productoActual, error: errorActual } = await supabase
    .from('productos')
    .select('fk_id_lista_precio')
    .eq('id', id)
    .single()
  
  if (errorActual) throw errorActual
  
  // Actualizar el producto
  const { data: producto, error } = await supabase
    .from('productos')
    .update(productoData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Si se cambió la lista de precios, manejar la actualización en items_lista_precios
  if (productoData.fk_id_lista_precio && productoData.fk_id_lista_precio !== productoActual?.fk_id_lista_precio) {
    try {
      // Eliminar registros existentes en items_lista_precios para este producto
      const { error: errorDelete } = await supabase
        .from('items_lista_precios')
        .delete()
        .eq('fk_id_producto', id)
      
      if (errorDelete) {
        console.error('Error eliminando items de lista de precios anteriores:', errorDelete)
      }
      
      // Verificar que la nueva lista de precios existe
      const { data: listaPrecio, error: errorLista } = await supabase
        .from('listas_precios')
        .select('id, nombre')
        .eq('id', productoData.fk_id_lista_precio)
        .single()
      
      if (errorLista) {
        console.error('Error verificando nueva lista de precios:', errorLista)
      } else {
        // Crear el nuevo registro en items_lista_precios
                  const { data: itemData, error: errorItem } = await supabase
            .from('items_lista_precios')
            .insert({
              fk_id_lista_precio: productoData.fk_id_lista_precio,
              fk_id_producto: id,
              precio: productoData.precio || producto.precio, // Usar el precio del producto
              descuento: 0.00 // Descuento por defecto
            })
          .select()
        
        if (errorItem) {
          console.error('Error creando nuevo item de lista de precios:', {
            message: errorItem.message,
            code: errorItem.code,
            details: errorItem.details,
            hint: errorItem.hint,
            producto_id: id,
            lista_precio_id: productoData.fk_id_lista_precio
          })
        } else {
          console.log(`Producto "${producto.nombre}" movido a la lista de precios "${listaPrecio?.nombre}"`)
        }
      }
    } catch (err) {
      console.error('Error en proceso de actualización de lista de precios:', err)
    }
  }
  
  return producto
}


export async function eliminarProducto(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// =====================================================
// FUNCIONES PARA LISTAS DE PRECIOS
// =====================================================

export interface ListaPrecio {
  id: number
  nombre: string
  fecha_carga: string
  status: 'Activa' | 'Inactiva' | 'Vencida'
  created_at: string
  updated_at: string
}

export async function getListasPrecios(): Promise<ListaPrecio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listas_precios')
    .select('*')
    .order('nombre')
  
  if (error) throw error
  return data || []
}

// Interfaz para items de lista de precios
export interface ItemListaPrecio {
  id: number
  fk_id_lista_precio: number
  fk_id_producto: number
  precio: number
  descuento: number
  created_at: string
}

// Función para obtener items de una lista de precios
export async function getItemsListaPrecio(listaPrecioId: number): Promise<ItemListaPrecio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('items_lista_precios')
    .select('*')
    .eq('fk_id_lista_precio', listaPrecioId)
  
  if (error) throw error
  return data || []
}

// Función para actualizar el precio y descuento de un producto en una lista de precios
export async function actualizarPrecioProducto(
  listaPrecioId: number, 
  productoId: number, 
  precio: number, 
  descuento: number
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('items_lista_precios')
    .update({ precio, descuento })
    .eq('fk_id_lista_precio', listaPrecioId)
    .eq('fk_id_producto', productoId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Función para obtener el precio y descuento de un producto en una lista de precios
export async function obtenerPrecioProducto(listaPrecioId: number, productoId: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('items_lista_precios')
    .select('precio, descuento')
    .eq('fk_id_lista_precio', listaPrecioId)
    .eq('fk_id_producto', productoId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return null
    }
    throw error
  }
  
  return data
}


export async function crearListaPrecio(listaData: Omit<ListaPrecio, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listas_precios')
    .insert(listaData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function actualizarListaPrecio(id: number, listaData: Partial<ListaPrecio>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listas_precios')
    .update(listaData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Función para verificar si una lista de precios tiene dependencias
export async function verificarDependenciasListaPrecio(id: number) {
  const supabase = createClient()
  
  // Verificar productos que usan esta lista de precios
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre')
    .eq('fk_id_lista_precio', id)
  
  if (error) throw error
  
  return {
    tieneProductos: (productos?.length || 0) > 0,
    productos: productos || []
  }
}

export async function eliminarListaPrecio(id: number) {
  const supabase = createClient()
  
  // Verificar dependencias antes de eliminar
  const dependencias = await verificarDependenciasListaPrecio(id)
  
  if (dependencias.tieneProductos) {
    throw new Error(`No se puede eliminar la lista de precios porque tiene productos asociados:
      - Productos asociados: ${dependencias.productos.length}`)
  }
  
  const { error } = await supabase
    .from('listas_precios')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// =====================================================
// FUNCIONES PARA CONDICIONES DE COMPRA
// =====================================================

export interface CondicionCompra {
  id: number
  nombre: string
  tipo: string
  descripcion: string
  descuento: number
  recargo: number
  dias_pago: number
  activo: boolean
  created_at: string
  updated_at: string
}

export async function getCondicionesCompra(): Promise<CondicionCompra[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('condiciones_compra')
    .select('*')
    .order('nombre')
  
  if (error) throw error
  return data || []
}

// Función específica para obtener condiciones de compra activas (sin permisos especiales)
export async function getCondicionesCompraActivas(): Promise<CondicionCompra[]> {
  const supabase = createClient()
  
  try {
    // Intentar consulta directa primero
    const { data, error } = await supabase
      .from('condiciones_compra')
      .select('*')
      .eq('activo', true)
      .order('nombre')
    
    if (error) {
      console.error('Error en consulta directa:', error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Error obteniendo condiciones de compra activas:', err)
    return []
  }
}

export async function crearCondicionCompra(condicionData: Omit<CondicionCompra, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('condiciones_compra')
    .insert(condicionData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function actualizarCondicionCompra(id: number, condicionData: Partial<CondicionCompra>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('condiciones_compra')
    .update(condicionData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}


export async function eliminarCondicionCompra(id: number) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('condiciones_compra')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// =====================================================
// FUNCIONES PARA CARGOS
// =====================================================

export interface Cargo {
  id: number
  nombre: string
  tipo: string
  monto: number | null
  descripcion: string
  frecuencia: string
  activo: boolean
  created_at: string
  updated_at: string
}

export async function getCargos(): Promise<Cargo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cargos')
    .select('*')
    .order('nombre')
  
  if (error) throw error
  return data || []
}

export async function crearCargo(cargoData: Omit<Cargo, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cargos')
    .insert(cargoData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function actualizarCargo(id: number, cargoData: Partial<Cargo>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cargos')
    .update(cargoData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function eliminarCargo(id: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('cargos')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// =====================================================
// FUNCIONES PARA MOVIMIENTOS DE SOCIOS
// =====================================================

export interface MovimientoSocio {
  id: number
  fk_id_socio: number
  fecha: string
  tipo: string
  concepto: string
  monto: number
  comprobante: string
  saldo: number
  estado: string
  metodo_pago: string | null
  referencia: string | null
  fecha_vencimiento: string | null
  fk_id_cargo: number | null
  created_at: string
  updated_at: string
}

export async function getMovimientosSocios(): Promise<MovimientoSocio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_socios')
    .select(`
      *,
      socios!inner(razon_social)
    `)
    .order('fecha', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function crearMovimientoSocio(movimientoData: Omit<MovimientoSocio, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimientos_socios')
    .insert(movimientoData)
    .select()
    .single()
  
  if (error) throw error
  return data
}


// Función para obtener el socio asociado al usuario logueado
export async function getSocioByUserEmail(email: string): Promise<Socio | null> {
  const supabase = createClient()
  
  // Primero obtener el usuario por email
  const { data: usuario, error: userError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single()
  
  if (userError) {
    if (userError.code === 'PGRST116') {
      // No se encontró el usuario
      return null
    }
    throw userError
  }
  
  // Luego obtener el socio asociado al usuario usando fk_id_usuario
  const { data: socio, error: socioError } = await supabase
    .from('socios')
    .select('*')
    .eq('fk_id_usuario', usuario.id)
    .single()
  
  if (socioError) {
    if (socioError.code === 'PGRST116') {
      // No se encontró el socio
      return null
    }
    throw socioError
  }
  
  return socio
}

// Función alternativa para obtener socio por ID de usuario directamente
export async function getSocioByUserId(userId: number): Promise<Socio | null> {
  const supabase = createClient()
  
  const { data: socio, error: socioError } = await supabase
    .from('socios')
    .select('*')
    .eq('fk_id_usuario', userId)
    .single()
  
  if (socioError) {
    if (socioError.code === 'PGRST116') {
      // No se encontró el socio
      return null
    }
    throw socioError
  }
  
  return socio
}

// Función para obtener el usuario actual
export async function getCurrentUser(): Promise<Usuario | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const { data: usuario, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('clerk_user_id', user.id)
    .single()
  
  if (userError) {
    if (userError.code === 'PGRST116') {
      return null
    }
    throw userError
  }
  
  return usuario
}


// =====================================================
// FUNCIONES PARA FACTURAS
// =====================================================

export interface Factura {
  id: string
  fk_id_socio: number
  fecha: string
  fecha_vencimiento: string
  total: number
  estado: string
  concepto: string
  created_at: string
  updated_at: string
}

export async function getFacturas(): Promise<Factura[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facturas')
    .select(`
      *,
      socios!inner(razon_social)
    `)
    .order('fecha', { ascending: false })
  
  if (error) throw error
  return data || []
}

// =====================================================
// FUNCIONES PARA PAGOS
// =====================================================

export interface CuentaTesoreria {
  id: number
  nombre: string
  tipo: 'Efectivo' | 'Banco' | 'Tarjeta' | 'Transferencia' | 'Cheque' | 'Digital' | 'Otro'
  descripcion: string | null
  numero_cuenta: string | null
  banco: string | null
  activa: boolean
  created_at: string
  updated_at: string
}

export interface Pago {
  id: string
  fk_id_socio: number
  fecha: string
  monto: number
  fk_id_movimiento: number | null
  fk_id_cuenta_tesoreria: number | null
  referencia: string | null
  created_at: string
}

// =====================================================
// FUNCIONES PARA CUENTAS DE TESORERÍA
// =====================================================

export async function getCuentasTesoreria(): Promise<CuentaTesoreria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas_tesoreria')
    .select('*')
    .eq('activa', true)
    .order('tipo, nombre')

  if (error) {
    console.error('Error fetching cuentas tesoreria:', error)
    throw error
  }

  return data || []
}

export async function getCuentaTesoreria(id: number): Promise<CuentaTesoreria | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas_tesoreria')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cuenta tesoreria:', error)
    throw error
  }

  return data
}

export async function crearCuentaTesoreria(cuenta: Omit<CuentaTesoreria, 'id' | 'created_at' | 'updated_at'>): Promise<CuentaTesoreria> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas_tesoreria')
    .insert(cuenta)
    .select()
    .single()

  if (error) {
    console.error('Error creating cuenta tesoreria:', error)
    throw error
  }

  return data
}

export async function actualizarCuentaTesoreria(id: number, updates: Partial<Omit<CuentaTesoreria, 'id' | 'created_at' | 'updated_at'>>): Promise<CuentaTesoreria> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuentas_tesoreria')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating cuenta tesoreria:', error)
    throw error
  }

  return data
}

export async function getPagos(): Promise<Pago[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pagos')
    .select(`
      *,
      socios!inner(razon_social),
      cuentas_tesoreria(nombre, tipo)
    `)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data || []
}

export async function crearPago(pagoData: Omit<Pago, 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pagos')
    .insert(pagoData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function crearFactura(facturaData: Omit<Factura, 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facturas')
    .insert(facturaData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Función para generar facturas automáticamente
export async function generarFacturasAutomaticas(cargosSeleccionados: { cargoId: number; sociosIncluidos: number[] }[]) {
  const supabase = createClient()
  const facturas: Factura[] = []
  const movimientos: MovimientoSocio[] = []
  
  try {
    // Obtener todos los socios activos
    const { data: socios, error: errorSocios } = await supabase
      .from('socios')
      .select('*')
      .eq('status', 'Activo')
    
    if (errorSocios) throw errorSocios
    
    // Obtener los cargos seleccionados
    const cargoIds = cargosSeleccionados.map(cs => cs.cargoId)
    const { data: cargos, error: errorCargos } = await supabase
      .from('cargos')
      .select('*')
      .in('id', cargoIds)
      .eq('activo', true)
    
    if (errorCargos) throw errorCargos
    
    // Procesar cada cargo seleccionado
    for (const cargoSeleccionado of cargosSeleccionados) {
      const cargo = cargos?.find(c => c.id === cargoSeleccionado.cargoId)
      if (!cargo) continue
      
      // Determinar qué socios incluir
      let sociosAFacturar: Socio[] = []
      
      if (cargo.frecuencia === 'Mensual' && cargo.tipo === 'Fijo') {
        // Para cargos mensuales fijos, incluir todos los socios activos automáticamente
        sociosAFacturar = socios || []
      } else {
        // Para cargos variables, solo incluir los socios seleccionados
        sociosAFacturar = (socios || []).filter(s => cargoSeleccionado.sociosIncluidos.includes(s.id))
      }
      
      // Generar una factura por cada socio
      for (const socio of sociosAFacturar) {
        const timestamp = Date.now().toString().slice(-8) // Últimos 8 dígitos del timestamp
        const randomSuffix = Math.random().toString(36).substr(2, 4) // 4 caracteres aleatorios
        const facturaId = `FAC-${timestamp}-${randomSuffix}` // Máximo 17 caracteres
        const fechaActual = new Date().toISOString().split('T')[0]
        const fechaVencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 días
        
        // Determinar el monto
        let monto = 0
        if (cargo.tipo === 'Fijo' && cargo.monto) {
          monto = cargo.monto
        } else {
          // Para cargos variables, se puede definir el monto manualmente
          // Por ahora usamos 0 y se debe especificar en la UI
          monto = cargoSeleccionado.sociosIncluidos.find(id => id === socio.id) ? 1000 : 0 // Valor por defecto
        }
        
        if (monto > 0) {
          // Crear la factura
          const nuevaFactura: Omit<Factura, 'created_at' | 'updated_at'> = {
            id: facturaId,
            fk_id_socio: socio.id,
            fecha: fechaActual,
            fecha_vencimiento: fechaVencimiento,
            total: monto,
            estado: 'Pendiente',
            concepto: `${cargo.nombre} - ${cargo.descripcion}`
          }
          
          facturas.push(nuevaFactura as Factura)
          
          // Obtener el saldo actual del socio
          const { data: ultimoMovimiento, error: errorSaldo } = await supabase
            .from('movimientos_socios')
            .select('saldo')
            .eq('fk_id_socio', socio.id)
            .order('fecha', { ascending: false })
            .limit(1)
          
          if (errorSaldo) throw errorSaldo
          
          const saldoAnterior = ultimoMovimiento && ultimoMovimiento.length > 0 ? ultimoMovimiento[0].saldo : 0
          const nuevoSaldo = saldoAnterior + monto
          
          // Crear el movimiento de socio correspondiente
          const nuevoMovimiento: Omit<MovimientoSocio, 'id' | 'created_at' | 'updated_at'> = {
            fk_id_socio: socio.id,
            fecha: fechaActual,
            tipo: 'Cargo',
            concepto: `${cargo.nombre} - ${cargo.descripcion}`,
            monto: monto,
            comprobante: facturaId, // El comprobante es el ID de la factura
            saldo: nuevoSaldo,
            estado: 'Pendiente',
            metodo_pago: null,
            referencia: null,
            fecha_vencimiento: fechaVencimiento,
            fk_id_cargo: cargo.id
          }
          
          movimientos.push(nuevoMovimiento as MovimientoSocio)
        }
      }
    }
    
    // Insertar todas las facturas
    if (facturas.length > 0) {
      const { data: facturasCreadas, error: errorFacturas } = await supabase
        .from('facturas')
        .insert(facturas)
        .select()
      
      if (errorFacturas) throw errorFacturas
      
      // Insertar todos los movimientos
      const { data: movimientosCreados, error: errorMovimientos } = await supabase
        .from('movimientos_socios')
        .insert(movimientos)
        .select()
      
      if (errorMovimientos) throw errorMovimientos
      
      return {
        facturasCreadas: facturasCreadas || [],
        movimientosCreados: movimientosCreados || [],
        resumen: {
          totalFacturas: facturas.length,
          totalMonto: facturas.reduce((sum, f) => sum + f.total, 0),
          sociosAfectados: [...new Set(facturas.map(f => f.fk_id_socio))].length
        }
      }
    }
    
    return {
      facturasCreadas: [],
      movimientosCreados: [],
      resumen: {
        totalFacturas: 0,
        totalMonto: 0,
        sociosAfectados: 0
      }
    }
    
  } catch (error) {
    console.error('Error generando facturas automáticas:', error)
    throw error
  }
}

// =====================================================
// FUNCIONES PARA MÓDULOS Y PERMISOS
// =====================================================

export interface Modulo {
  id: number
  nombre: string
  descripcion: string | null
  icono: string | null
  ruta: string | null
  activo: boolean
  orden: number
  creado_el: string
}

export interface PermisoUsuario {
  id: number
  fk_id_usuario: number
  fk_id_modulo: number
  puede_ver: boolean
  creado_el: string
  actualizado_el: string
}

export async function getModulos(): Promise<Modulo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .order('orden')
  
  if (error) throw error
  return data || []
}

export async function getPermisosUsuario(usuarioId: number): Promise<PermisoUsuario[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('permisos_usuarios')
    .select('*')
    .eq('fk_id_usuario', usuarioId)
  
  if (error) throw error
  return data || []
}

export async function actualizarPermisosUsuario(
  usuarioId: number, 
  permisos: { moduloId: number; puedeVer: boolean }[]
): Promise<void> {
  const supabase = createClient()
  
  // Primero eliminar permisos existentes
  await supabase
    .from('permisos_usuarios')
    .delete()
    .eq('fk_id_usuario', usuarioId)

  // Luego insertar los nuevos permisos
  const permisosData = permisos.map(p => ({
    fk_id_usuario: usuarioId,
    fk_id_modulo: p.moduloId,
    puede_ver: p.puedeVer
  }))

  const { error } = await supabase
    .from('permisos_usuarios')
    .insert(permisosData)

  if (error) throw error
}
