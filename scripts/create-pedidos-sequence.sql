-- Crear la secuencia para la tabla pedidos
CREATE SEQUENCE IF NOT EXISTS pedidos_id_seq;

-- Configurar la columna id para usar la secuencia
ALTER TABLE pedidos ALTER COLUMN id SET DEFAULT nextval('pedidos_id_seq');

-- Asignar la secuencia a la columna id
ALTER SEQUENCE pedidos_id_seq OWNED BY pedidos.id;

-- Verificar que se configuró correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    is_identity
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND column_name = 'id';

