-- Script para insertar items faltantes en items_lista_precios
-- Este script conecta los productos existentes con sus listas de precios

-- Primero, verificar qué productos existen y a qué lista de precios están asociados
SELECT 
    p.id as producto_id,
    p.nombre as producto_nombre,
    p.fk_id_lista_precio,
    lp.nombre as lista_precio_nombre
FROM productos p
LEFT JOIN listas_precios lp ON p.fk_id_lista_precio = lp.id
WHERE p.activo = true;

-- Verificar si ya existen items en items_lista_precios
SELECT 
    ilp.id,
    ilp.fk_id_lista_precio,
    ilp.fk_id_producto,
    ilp.precio,
    ilp.descuento,
    p.nombre as producto_nombre,
    lp.nombre as lista_precio_nombre
FROM items_lista_precios ilp
JOIN productos p ON ilp.fk_id_producto = p.id
JOIN listas_precios lp ON ilp.fk_id_lista_precio = lp.id;

-- Insertar items faltantes para el producto existente
-- Producto: Heladera Philips (ID: 1) en Lista enero 2025 (ID: 4)
-- Primero actualizar el precio en la tabla productos
UPDATE productos SET precio = 150000.00 WHERE id = 1;

-- Luego insertar en items_lista_precios usando el precio del producto
INSERT INTO items_lista_precios (fk_id_lista_precio, fk_id_producto, precio, descuento)
VALUES 
    (4, 1, 150000.00, 10.00)  -- Heladera Philips con precio $150,000 y 10% descuento
ON CONFLICT (fk_id_lista_precio, fk_id_producto) 
DO NOTHING;

-- Verificar que se insertó correctamente
SELECT 
    ilp.id,
    ilp.fk_id_lista_precio,
    ilp.fk_id_producto,
    ilp.precio,
    ilp.descuento,
    p.nombre as producto_nombre,
    lp.nombre as lista_precio_nombre
FROM items_lista_precios ilp
JOIN productos p ON ilp.fk_id_producto = p.id
JOIN listas_precios lp ON ilp.fk_id_lista_precio = lp.id
WHERE lp.fk_id_proveedor = 2;  -- Para el proveedor ID 2

-- Si necesitas agregar más productos, puedes usar este formato:
-- INSERT INTO items_lista_precios (fk_id_lista_precio, fk_id_producto, precio, descuento)
-- VALUES 
--     (4, [producto_id], [precio], [descuento])
-- ON CONFLICT (fk_id_lista_precio, fk_id_producto) 
-- DO NOTHING;
