-- Script de prueba para verificar datos del formulario de pedidos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar proveedores
SELECT id, nombre, status FROM proveedores WHERE status = 'Activo';

-- 2. Verificar listas de precios activas
SELECT id, nombre, fk_id_proveedor, status FROM listas_precios WHERE status = 'Activa';

-- 3. Verificar items de lista de precios
SELECT 
  ilp.id,
  ilp.fk_id_lista_precio,
  ilp.precio,
  ilp.descuento,
  p.nombre as producto_nombre,
  p.codigo as producto_codigo,
  p.activo as producto_activo
FROM items_lista_precios ilp
JOIN productos p ON ilp.fk_id_producto = p.id
WHERE p.activo = true;

-- 4. Verificar productos activos
SELECT id, codigo, nombre, categoria, activo, fk_id_lista_precio FROM productos WHERE activo = true;

-- 5. Consulta completa para un proveedor específico (reemplazar 1 con el ID del proveedor)
SELECT 
  lp.id as lista_id,
  lp.nombre as lista_nombre,
  ilp.precio,
  ilp.descuento,
  p.id as producto_id,
  p.codigo,
  p.nombre,
  p.categoria
FROM listas_precios lp
JOIN items_lista_precios ilp ON lp.id = ilp.fk_id_lista_precio
JOIN productos p ON ilp.fk_id_producto = p.id
WHERE lp.fk_id_proveedor = 1 
  AND lp.status = 'Activa'
  AND p.activo = true
ORDER BY p.nombre;



