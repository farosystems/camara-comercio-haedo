-- =====================================================
-- SCRIPT PARA INSERTAR DATOS DE EJEMPLO EN SUPABASE
-- Agrupaciones Mar & Sierras
-- =====================================================

-- Insertar socios de ejemplo
INSERT INTO socios (razon_social, cuit, tipo_sociedad, fecha_constitucion, registro_mercantil, direccion_fiscal, email, telefono, web, condicion_fiscal, datos_bancarios, criterio_facturacion, representante_legal, dni_representante, cargo_representante, actividad_economica, status, fecha_alta) VALUES
('Empresa ABC S.R.L.', '20-12345678-9', 'S.R.L.', '2020-01-15', 'RM-001-2020', 'Av. Corrientes 1234, CABA', 'info@empresaabc.com', '+54 11 1234-5678', 'www.empresaabc.com', 'Responsable Inscripto', 'Banco Nación - Cta. Cte. 123456789', '30 días', 'Juan Carlos Pérez', '12345678', 'Gerente General', 'Comercio mayorista', 'Activo', '2023-01-15'),
('Comercio XYZ S.A.', '20-98765432-1', 'S.A.', '2018-03-20', 'RM-002-2018', 'San Martín 567, CABA', 'ventas@comercioxyz.com', '+54 11 8765-4321', 'www.comercioxyz.com', 'Responsable Inscripto', 'Banco Galicia - Cta. Cte. 987654321', 'Contado', 'María García', '87654321', 'Directora', 'Comercio minorista', 'Activo', '2023-03-20'),
('Monotributista López', '20-11223344-5', 'Monotributista', '2022-11-10', NULL, 'Rivadavia 890, CABA', 'carlos.lopez@email.com', '+54 11 2233-4455', NULL, 'Monotributista', 'Banco Macro - Cta. Cte. 112233445', 'Anticipado', 'Carlos López', '11223344', 'Titular', 'Servicios profesionales', 'Activo', '2022-11-10'),
('Autónomo Rodríguez', '20-55667788-9', 'Autónomo', '2021-06-05', NULL, 'Belgrano 456, CABA', 'ana.rodriguez@email.com', '+54 11 5566-7788', NULL, 'Monotributista', 'Banco Santander - Cta. Cte. 556677889', 'Por entrega', 'Ana Rodríguez', '55667788', 'Titular', 'Consultoría', 'Activo', '2021-06-05');

-- Insertar proveedores de ejemplo
INSERT INTO proveedores (nombre, contacto, telefono, email, cuit, direccion, metodos_pago, status) VALUES
('Instrumentos SA', 'Juan Carlos', '+54 11 4567-8901', 'ventas@instrumentossa.com', '20-11111111-1', 'Av. Santa Fe 1000, CABA', '["Cuenta Corriente", "Efectivo 10%", "Cheques 30/60/90"]', 'Activo'),
('Audio Pro', 'María Fernández', '+54 11 2345-6789', 'info@audiopro.com', '20-22222222-2', 'Corrientes 2000, CABA', '["Cuenta Corriente", "Efectivo 15%"]', 'Activo'),
('Música Total', 'Roberto Silva', '+54 11 8765-4321', 'contacto@musicatotal.com', '20-33333333-3', 'Córdoba 1500, CABA', '["Cuenta Corriente", "Cheques 30/60"]', 'Inactivo'),
('Equipos Profesionales', 'Laura Martínez', '+54 11 3456-7890', 'ventas@equipospro.com', '20-44444444-4', 'Belgrano 800, CABA', '["Efectivo", "Transferencia", "Tarjeta"]', 'Activo');

-- Insertar listas de precios
INSERT INTO listas_precios (fk_id_proveedor, nombre, fecha_carga, status) VALUES
(1, 'Lista General - Enero 2024', '2024-01-15', 'Activa'),
(2, 'Equipos Audio - Diciembre 2023', '2023-12-20', 'Activa'),
(3, 'Instrumentos Musicales - Noviembre 2023', '2023-11-15', 'Vencida'),
(4, 'Equipos Profesionales - Enero 2024', '2024-01-10', 'Activa');

-- Insertar productos
INSERT INTO productos (codigo, nombre, categoria, marca, descripcion, fk_id_lista_precio, activo) VALUES
('GTR-001', 'Guitarra Acústica Yamaha FG800', 'Guitarras', 'Yamaha', 'Guitarra acústica con tapa de abeto sólido', 1, true),
('AMP-001', 'Amplificador Marshall MG15', 'Amplificadores', 'Marshall', 'Amplificador de guitarra 15W con efectos', 1, true),
('MIC-001', 'Micrófono Shure SM58', 'Micrófonos', 'Shure', 'Micrófono dinámico cardioide profesional', 2, true),
('CAB-001', 'Cable XLR 5m', 'Cables', 'Genérico', 'Cable balanceado XLR macho a hembra', 2, true),
('PIANO-001', 'Piano Digital Roland FP-30', 'Pianos', 'Roland', 'Piano digital con 88 teclas ponderadas', 3, true),
('DRUM-001', 'Batería Acústica Pearl Export', 'Baterías', 'Pearl', 'Batería acústica de 5 piezas', 4, true);

-- Insertar condiciones de compra
INSERT INTO condiciones_compra (nombre, tipo, descripcion, descuento, recargo, dias_pago, fk_id_proveedor, activo) VALUES
('Cuenta Corriente Estándar', 'Cuenta Corriente', 'Pago a 30 días sin descuentos ni recargos', 0, 0, 30, NULL, true),
('Efectivo 10%', 'Efectivo', 'Descuento por pago inmediato en efectivo', 10, 0, 0, 1, true),
('Cheques 30/60/90', 'Cheques', 'Pago diferido con cheques a 30, 60 y 90 días', 0, 5, 90, 1, true),
('Efectivo 15%', 'Efectivo', 'Descuento por pago inmediato en efectivo', 15, 0, 0, 2, true),
('Transferencia Inmediata', 'Transferencia', 'Pago por transferencia bancaria', 5, 0, 0, 4, true);

-- Insertar cargos
INSERT INTO cargos (nombre, tipo, monto, descripcion, frecuencia, activo) VALUES
('Cuota Social Mensual', 'Fijo', 5000.00, 'Cuota mensual obligatoria para todos los socios', 'Mensual', true),
('Servicios de Agua', 'Variable', NULL, 'Consumo de agua según medidor', 'Mensual', true),
('Servicios de Electricidad', 'Variable', NULL, 'Consumo de electricidad según medidor', 'Mensual', true),
('Mantenimiento de Instalaciones', 'Fijo', 2500.00, 'Cargo por mantenimiento de instalaciones comunes', 'Mensual', true),
('Cuota Extraordinaria', 'Fijo', 10000.00, 'Cuota extraordinaria para mejoras', 'Anual', true);

-- Insertar movimientos de socios
INSERT INTO movimientos_socios (fk_id_socio, fecha, tipo, concepto, monto, comprobante, saldo, estado, metodo_pago, referencia, fecha_vencimiento, fk_id_cargo) VALUES
(1, '2025-01-15', 'Cargo', 'Cuota Social - Enero 2025', 5000.00, 'FAC-001-2025', 5000.00, 'Pendiente', NULL, NULL, '2025-02-15', 1),
(1, '2025-01-20', 'Pago', 'Pago Factura FAC-001-2025', 5000.00, 'PAG-001-2025', 0.00, 'Cobrada', 'Transferencia', 'TRF-001', NULL, NULL),
(2, '2025-01-15', 'Cargo', 'Cuota Social - Enero 2025', 5000.00, 'FAC-002-2025', 5000.00, 'Pendiente', NULL, NULL, '2025-02-15', 1),
(3, '2025-01-15', 'Cargo', 'Cuota Social - Enero 2025', 5000.00, 'FAC-003-2025', 5000.00, 'Vencida', NULL, NULL, '2025-02-15', 1),
(4, '2025-01-15', 'Cargo', 'Cuota Social - Enero 2025', 5000.00, 'FAC-004-2025', 5000.00, 'Pendiente', NULL, NULL, '2025-02-15', 1),
(2, '2025-01-25', 'Pago', 'Pago parcial FAC-002-2025', 2500.00, 'PAG-002-2025', 2500.00, 'Cobrada', 'Efectivo', NULL, NULL, NULL);

-- Insertar pedidos
INSERT INTO pedidos (id, fk_id_socio, fk_id_proveedor, fecha, total, estado, metodo_pago, observaciones) VALUES
('PED-001-2025', 1, 1, '2025-01-10', 45000.00, 'Entregado', 'Cuenta Corriente', 'Entrega urgente'),
('PED-002-2025', 2, 2, '2025-01-12', 35000.00, 'Procesado', 'Efectivo', 'Incluir factura'),
('PED-003-2025', 3, 4, '2025-01-15', 25000.00, 'Pendiente', 'Transferencia', 'Envío a domicilio');

-- Insertar facturas
INSERT INTO facturas (id, fk_id_socio, fecha, fecha_vencimiento, total, estado, concepto) VALUES
('FAC-001-2025', 1, '2025-01-15', '2025-02-15', 5000.00, 'Pagada', 'Cuota Social - Enero 2025'),
('FAC-002-2025', 2, '2025-01-15', '2025-02-15', 5000.00, 'Pendiente', 'Cuota Social - Enero 2025'),
('FAC-003-2025', 3, '2025-01-15', '2025-02-15', 5000.00, 'Vencida', 'Cuota Social - Enero 2025'),
('FAC-004-2025', 4, '2025-01-15', '2025-02-15', 5000.00, 'Pendiente', 'Cuota Social - Enero 2025');

-- Insertar pagos
INSERT INTO pagos (id, fk_id_socio, fecha, monto, metodo, fk_id_factura, referencia) VALUES
('PAG-001-2025', 1, '2025-01-20', 5000.00, 'Transferencia', 'FAC-001-2025', 'TRF-001'),
('PAG-002-2025', 2, '2025-01-25', 2500.00, 'Efectivo', 'FAC-002-2025', NULL);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================








