-- =====================================================
-- MIGRACIÓN DE TABLA PEDIDOS
-- Cambiar campo metodo_pago por fk_id_condicion_compra
-- =====================================================

-- 1. Agregar la nueva columna
ALTER TABLE pedidos ADD COLUMN fk_id_condicion_compra BIGINT REFERENCES condiciones_compra(id);

-- 2. Actualizar los pedidos existentes con condiciones de compra por defecto
-- Asumiendo que queremos usar la condición "Cuenta Corriente Estándar" (ID 1) como valor por defecto
UPDATE pedidos 
SET fk_id_condicion_compra = 1 
WHERE fk_id_condicion_compra IS NULL;

-- 3. Hacer la columna NOT NULL
ALTER TABLE pedidos ALTER COLUMN fk_id_condicion_compra SET NOT NULL;

-- 4. Eliminar la columna antigua
ALTER TABLE pedidos DROP COLUMN metodo_pago;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================


