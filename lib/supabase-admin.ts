import { createClient } from '@/lib/supabase'
import { Usuario } from '@/lib/supabase'

// =====================================================
// FUNCIONES PARA USUARIOS (ya existentes)
// =====================================================

export async function getUsuarios(): Promise<Usuario[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nombre')
  
  if (error) throw error
  return data || []
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
  razon_social: string
  cuit: string
  tipo_sociedad: string
  fecha_constitucion: string | null
  registro_mercantil: string | null
  direccion_fiscal: string
  email: string
  telefono: string
  web: string | null
  condicion_fiscal: string
  datos_bancarios: string | null
  criterio_facturacion: string
  representante_legal: string
  dni_representante: string
  cargo_representante: string
  actividad_economica: string | null
  logo_path: string | null
  status: string
  fecha_alta: string
  created_at: string
  updated_at: string
}

export async function getSocios(): Promise<Socio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('socios')
    .select('*')
    .order('razon_social')
  
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
// FUNCIONES PARA PROVEEDORES
// =====================================================

export interface Proveedor {
  id: number
  nombre: string
  contacto: string
  telefono: string
  email: string
  cuit: string
  direccion: string | null
  metodos_pago: any
  status: string
  created_at: string
  updated_at: string
}

export async function getProveedores(): Promise<Proveedor[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre')
  
  if (error) throw error
  return data || []
}

export async function crearProveedor(proveedorData: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .insert(proveedorData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function actualizarProveedor(id: number, proveedorData: Partial<Proveedor>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .update(proveedorData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Función para verificar si un proveedor tiene dependencias
export async function verificarDependenciasProveedor(id: number) {
  const supabase = createClient()
  
  // Verificar listas de precios
  const { data: listasPrecios, error: errorListas } = await supabase
    .from('listas_precios')
    .select('id, nombre')
    .eq('fk_id_proveedor', id)
  
  if (errorListas) throw errorListas
  
  // Verificar productos (si tienen listas de precios asociadas)
  const { data: productos, error: errorProductos } = await supabase
    .from('productos')
    .select('id, nombre, fk_id_lista_precio')
    .not('fk_id_lista_precio', 'is', null)
  
  if (errorProductos) throw errorProductos
  
  // Filtrar productos que usan listas de precios de este proveedor
  const productosAsociados = productos?.filter(p => 
    listasPrecios?.some(lp => lp.id === p.fk_id_lista_precio)
  ) || []
  
  return {
    tieneListasPrecios: (listasPrecios?.length || 0) > 0,
    listasPrecios: listasPrecios || [],
    tieneProductosAsociados: productosAsociados.length > 0,
    productosAsociados: productosAsociados
  }
}

export async function eliminarProveedor(id: number) {
  const supabase = createClient()
  
  // Verificar dependencias antes de eliminar
  const dependencias = await verificarDependenciasProveedor(id)
  
  if (dependencias.tieneListasPrecios || dependencias.tieneProductosAsociados) {
    throw new Error(`No se puede eliminar el proveedor porque tiene dependencias:
      - Listas de precios: ${dependencias.listasPrecios.length}
      - Productos asociados: ${dependencias.productosAsociados.length}`)
  }
  
  const { error } = await supabase
    .from('proveedores')
    .delete()
    .eq('id', id)
  
  if (error) throw error
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

// Función para verificar si un producto tiene dependencias
export async function verificarDependenciasProducto(id: number) {
  const supabase = createClient()
  
  // Verificar si el producto está en pedidos
  const { data: pedidos, error } = await supabase
    .from('items_pedido')
    .select('id, fk_id_pedido')
    .eq('fk_id_producto', id)
  
  if (error) throw error
  
  return {
    tienePedidos: (pedidos?.length || 0) > 0,
    pedidos: pedidos || []
  }
}

export async function eliminarProducto(id: number) {
  const supabase = createClient()
  
  // Verificar dependencias antes de eliminar
  const dependencias = await verificarDependenciasProducto(id)
  
  if (dependencias.tienePedidos) {
    throw new Error(`No se puede eliminar el producto porque está en pedidos:
      - Pedidos asociados: ${dependencias.pedidos.length}`)
  }
  
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
  fk_id_proveedor: number
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

// Función para obtener productos con precios de un proveedor
export async function getProductosConPrecios(proveedorId: number): Promise<any[]> {
  const supabase = createClient()
  
  console.log('Buscando listas de precios para proveedor ID:', proveedorId)
  
  // Primero, verificar si existen listas de precios para este proveedor
  const { data: listas, error: errorListas } = await supabase
    .from('listas_precios')
    .select('id, nombre, status, fk_id_proveedor')
    .eq('fk_id_proveedor', proveedorId)
  
  if (errorListas) {
    console.error('Error consultando listas de precios:', errorListas)
    throw errorListas
  }
  
  console.log('Listas de precios encontradas:', listas)
  
  // Filtrar solo las listas activas
  const listasActivas = listas?.filter(lista => lista.status === 'Activa') || []
  console.log('Listas activas:', listasActivas)
  
  if (listasActivas.length === 0) {
    console.log('No se encontraron listas de precios activas para el proveedor:', proveedorId)
    return []
  }
  
  // Para cada lista activa, obtener sus productos
  const productosFormateados: any[] = []
  
  for (const lista of listasActivas) {
    console.log('Procesando lista:', lista.nombre)
    
    // Obtener items de la lista de precios
    const { data: items, error: errorItems } = await supabase
      .from('items_lista_precios')
      .select(`
        precio,
        descuento,
        fk_id_producto,
        productos (
          id,
          codigo,
          nombre,
          categoria,
          marca,
          descripcion,
          activo
        )
      `)
      .eq('fk_id_lista_precio', lista.id)
    
    if (errorItems) {
      console.error('Error consultando items de lista:', errorItems)
      continue
    }
    
    console.log('Items encontrados para lista', lista.nombre, ':', items?.length || 0)
    
    // Procesar cada item
    items?.forEach((item: any) => {
      if (item.productos && item.productos.activo === true) {
        productosFormateados.push({
          ...item.productos,
          precio: item.precio,
          descuento: item.descuento,
          lista_precio_id: lista.id,
          lista_precio_nombre: lista.nombre
        })
      }
    })
  }
  
  console.log('Total de productos formateados:', productosFormateados.length)
  return productosFormateados
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
  fk_id_proveedor: number | null
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

// Función para verificar si una condición de compra tiene dependencias
export async function verificarDependenciasCondicionCompra(id: number) {
  const supabase = createClient()
  
  // Verificar si la condición está en órdenes de compra
  const { data: ordenes, error } = await supabase
    .from('ordenes_compra')
    .select('id, numero_orden')
    .eq('fk_id_condicion_compra', id)
  
  if (error) throw error
  
  return {
    tieneOrdenes: (ordenes?.length || 0) > 0,
    ordenes: ordenes || []
  }
}

export async function eliminarCondicionCompra(id: number) {
  const supabase = createClient()
  
  // Verificar dependencias antes de eliminar
  const dependencias = await verificarDependenciasCondicionCompra(id)
  
  if (dependencias.tieneOrdenes) {
    throw new Error(`No se puede eliminar la condición de compra porque está en órdenes de compra:
      - Órdenes asociadas: ${dependencias.ordenes.length}`)
  }
  
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

// =====================================================
// FUNCIONES PARA PEDIDOS
// =====================================================

export interface Pedido {
  id: string
  fk_id_socio: number
  fk_id_proveedor: number
  fecha: string
  total: number
  estado: string
  fk_id_condicion_compra: number
  observaciones: string | null
  created_at: string
  updated_at: string
}

export async function getPedidos(): Promise<Pedido[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      socios!inner(razon_social),
      proveedores!inner(nombre)
    `)
    .order('fecha', { ascending: false })
  
  if (error) throw error
  return data || []
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

export async function crearPedido(pedidoData: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  
  // Generar ID único para el pedido (máximo 20 caracteres)
  const timestamp = Date.now().toString().slice(-8) // Últimos 8 dígitos del timestamp
  const randomSuffix = Math.random().toString(36).substr(2, 4) // 4 caracteres aleatorios
  const pedidoId = `PED-${timestamp}-${randomSuffix}` // Máximo 17 caracteres
  
  const { data, error } = await supabase
    .from('pedidos')
    .insert({
      ...pedidoData,
      id: pedidoId
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function actualizarPedido(id: string, pedidoData: Partial<Pedido>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .update(pedidoData)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
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

export interface Pago {
  id: string
  fk_id_socio: number
  fecha: string
  monto: number
  metodo: string
  fk_id_factura: string | null
  referencia: string | null
  created_at: string
}

export async function getPagos(): Promise<Pago[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pagos')
    .select(`
      *,
      socios!inner(razon_social)
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
