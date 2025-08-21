-- Verificar la estructura actual de la tabla pedidos
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    is_identity
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
ORDER BY ordinal_position;

-- Si la columna id no está configurada como auto-increment, ejecutar esto:
-- ALTER TABLE pedidos ALTER COLUMN id SET DEFAULT nextval('pedidos_id_seq');

-- O si no existe la secuencia, crear la tabla correctamente:
-- DROP TABLE IF EXISTS pedidos CASCADE;
-- CREATE TABLE pedidos (
--     id SERIAL PRIMARY KEY,
--     fk_id_socio INTEGER NOT NULL REFERENCES socios(id),
--     fk_id_proveedor INTEGER NOT NULL REFERENCES proveedores(id),
--     fecha DATE NOT NULL,
--     total DECIMAL(10,2) NOT NULL,
--     estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
--     fk_id_condicion_compra INTEGER NOT NULL REFERENCES condiciones_compra(id),
--     observaciones TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

