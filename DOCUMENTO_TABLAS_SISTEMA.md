# 📋 DOCUMENTO COMPLETO DE TABLAS DEL SISTEMA DE GESTIÓN

## 🏢 Sistema de Gestión para Agrupaciones - Mar & Sierras

---

## 📊 TABLA 1: SOCIOS (MEMBERS)

### Descripción
Tabla maestra que almacena toda la información de los socios de la agrupación.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del socio | ✅ |
| `razon_social` | VARCHAR(255) | Nombre oficial de la empresa | ✅ |
| `cuit` | VARCHAR(15) | CUIT/NIF/ID fiscal | ✅ |
| `tipo_sociedad` | ENUM | S.R.L., S.A., Monotributista, Autónomo, Otro | ✅ |
| `fecha_constitucion` | DATE | Fecha de constitución legal | ❌ |
| `registro_mercantil` | VARCHAR(100) | Número de inscripción y fecha | ❌ |
| `direccion_fiscal` | VARCHAR(255) | Dirección oficial de la empresa | ✅ |
| `email` | VARCHAR(100) | Email de contacto | ✅ |
| `telefono` | VARCHAR(20) | Teléfono de contacto | ✅ |
| `web` | VARCHAR(255) | Página web (opcional) | ❌ |
| `condicion_fiscal` | ENUM | Responsable Inscripto, Monotributista, Exento, Consumidor Final | ✅ |
| `datos_bancarios` | TEXT | Información bancaria completa | ❌ |
| `criterio_facturacion` | ENUM | Anticipado, Por entrega, 30 días, 60 días, Contado | ✅ |
| `representante_legal` | VARCHAR(100) | Nombre del representante legal | ✅ |
| `dni_representante` | VARCHAR(15) | DNI/CUIT del representante | ✅ |
| `cargo_representante` | VARCHAR(100) | Cargo del representante | ✅ |
| `actividad_economica` | VARCHAR(255) | Principal rubro o sector | ❌ |
| `logo_path` | VARCHAR(255) | Ruta al archivo del logo | ❌ |
| `status` | ENUM | Activo, Inactivo, Suspendido | ✅ |
| `fecha_alta` | DATE | Fecha de alta en el sistema | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación del registro | ✅ |
| `updated_at` | TIMESTAMP | Fecha de última actualización | ✅ |

---

## 💰 TABLA 2: MOVIMIENTOS_SOCIOS (MEMBER_MOVEMENTS)

### Descripción
Tabla transaccional que registra todos los movimientos financieros de los socios (cargos y pagos).

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del movimiento | ✅ |
| `member_id` | INT | ID del socio (FK a members) | ✅ |
| `fecha` | DATE | Fecha del movimiento | ✅ |
| `tipo` | ENUM | Cargo, Pago | ✅ |
| `concepto` | VARCHAR(255) | Descripción del movimiento | ✅ |
| `monto` | DECIMAL(10,2) | Monto del movimiento (negativo para pagos) | ✅ |
| `comprobante` | VARCHAR(50) | Número de factura o recibo | ✅ |
| `saldo` | DECIMAL(10,2) | Saldo después del movimiento | ✅ |
| `estado` | ENUM | Pendiente, Pagado, Vencido, Anulado | ✅ |
| `metodo_pago` | ENUM | Efectivo, Transferencia, Cheque, Tarjeta, Otro | ❌ |
| `referencia` | VARCHAR(100) | Referencia del pago | ❌ |
| `fecha_vencimiento` | DATE | Fecha de vencimiento (para cargos) | ❌ |
| `charge_id` | INT | ID del cargo aplicado (FK a charges) | ❌ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 📋 TABLA 3: CARGOS (CHARGES)

### Descripción
Tabla que define los tipos de cargos que se pueden aplicar a los socios.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del cargo | ✅ |
| `nombre` | VARCHAR(100) | Nombre del cargo | ✅ |
| `tipo` | ENUM | Fijo, Variable | ✅ |
| `monto` | DECIMAL(10,2) | Monto fijo (si aplica) | ❌ |
| `descripcion` | TEXT | Descripción detallada | ✅ |
| `frecuencia` | ENUM | Mensual, Trimestral, Semestral, Anual | ✅ |
| `activo` | BOOLEAN | Si el cargo está activo | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 🏢 TABLA 4: PROVEEDORES (PROVIDERS)

### Descripción
Tabla maestra de proveedores con información de contacto y comercial.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del proveedor | ✅ |
| `nombre` | VARCHAR(255) | Nombre del proveedor | ✅ |
| `contacto` | VARCHAR(100) | Persona de contacto | ✅ |
| `telefono` | VARCHAR(20) | Teléfono de contacto | ✅ |
| `email` | VARCHAR(100) | Email de contacto | ✅ |
| `cuit` | VARCHAR(15) | CUIT del proveedor | ✅ |
| `direccion` | VARCHAR(255) | Dirección del proveedor | ❌ |
| `metodos_pago` | JSON | Array de métodos de pago disponibles | ❌ |
| `status` | ENUM | Activo, Inactivo | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 📦 TABLA 5: PRODUCTOS (PRODUCTS)

### Descripción
Catálogo de productos disponibles para incluir en listas de precios.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del producto | ✅ |
| `codigo` | VARCHAR(50) | Código del producto | ✅ |
| `nombre` | VARCHAR(255) | Nombre del producto | ✅ |
| `categoria` | VARCHAR(100) | Categoría del producto | ✅ |
| `marca` | VARCHAR(100) | Marca del producto | ✅ |
| `descripcion` | TEXT | Descripción detallada | ❌ |
| `price_list_id` | INT | ID de la lista de precios (FK) | ❌ |
| `activo` | BOOLEAN | Si el producto está activo | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 💵 TABLA 6: LISTAS_PRECIOS (PRICE_LISTS)

### Descripción
Listas de precios por proveedor con productos y precios específicos.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único de la lista | ✅ |
| `provider_id` | INT | ID del proveedor (FK a providers) | ✅ |
| `nombre` | VARCHAR(255) | Nombre de la lista | ✅ |
| `fecha_carga` | DATE | Fecha de carga de la lista | ✅ |
| `status` | ENUM | Activa, Inactiva, Vencida | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 📊 TABLA 7: ITEMS_LISTA_PRECIOS (PRICE_LIST_ITEMS)

### Descripción
Items individuales de cada lista de precios con precios y descuentos.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del item | ✅ |
| `price_list_id` | INT | ID de la lista de precios (FK) | ✅ |
| `product_id` | INT | ID del producto (FK a products) | ✅ |
| `precio` | DECIMAL(10,2) | Precio del producto | ✅ |
| `descuento` | DECIMAL(5,2) | Porcentaje de descuento | ❌ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |

---

## 💳 TABLA 8: CONDICIONES_COMPRA (PURCHASE_CONDITIONS)

### Descripción
Condiciones comerciales y métodos de pago para los proveedores.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único de la condición | ✅ |
| `nombre` | VARCHAR(100) | Nombre de la condición | ✅ |
| `tipo` | ENUM | Cuenta Corriente, Efectivo, Cheques, Transferencia | ✅ |
| `descripcion` | TEXT | Descripción detallada | ✅ |
| `descuento` | DECIMAL(5,2) | Porcentaje de descuento | ❌ |
| `recargo` | DECIMAL(5,2) | Porcentaje de recargo | ❌ |
| `dias_pago` | INT | Días de pago (0 = inmediato) | ✅ |
| `provider_id` | INT | ID del proveedor específico (FK) | ❌ |
| `activo` | BOOLEAN | Si la condición está activa | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 🛒 TABLA 9: PEDIDOS (ORDERS)

### Descripción
Pedidos realizados por los socios a los proveedores.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | VARCHAR(20) | ID del pedido (ej: ORD-001) | ✅ |
| `member_id` | INT | ID del socio (FK a members) | ✅ |
| `provider_id` | INT | ID del proveedor (FK a providers) | ✅ |
| `fecha` | DATE | Fecha del pedido | ✅ |
| `total` | DECIMAL(10,2) | Total del pedido | ✅ |
| `estado` | ENUM | Pendiente, Procesado, Entregado, Cancelado | ✅ |
| `metodo_pago` | VARCHAR(100) | Método de pago utilizado | ✅ |
| `observaciones` | TEXT | Observaciones del pedido | ❌ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 📦 TABLA 10: ITEMS_PEDIDO (ORDER_ITEMS)

### Descripción
Items individuales de cada pedido con cantidades y precios.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del item | ✅ |
| `order_id` | VARCHAR(20) | ID del pedido (FK a orders) | ✅ |
| `product_id` | INT | ID del producto (FK a products) | ✅ |
| `cantidad` | INT | Cantidad solicitada | ✅ |
| `precio_unitario` | DECIMAL(10,2) | Precio unitario | ✅ |
| `descuento` | DECIMAL(5,2) | Descuento aplicado | ❌ |
| `subtotal` | DECIMAL(10,2) | Subtotal del item | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |

---

## 👥 TABLA 11: USUARIOS (USERS)

### Descripción
Usuarios del sistema con roles y permisos.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único del usuario | ✅ |
| `nombre` | VARCHAR(100) | Nombre completo del usuario | ✅ |
| `email` | VARCHAR(100) | Email del usuario | ✅ |
| `password_hash` | VARCHAR(255) | Hash de la contraseña | ✅ |
| `rol` | ENUM | Administrador, Socio | ✅ |
| `status` | ENUM | Activo, Inactivo, Bloqueado | ✅ |
| `ultimo_acceso` | TIMESTAMP | Último acceso al sistema | ❌ |
| `member_id` | INT | ID del socio (FK a members, si aplica) | ❌ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## ⚙️ TABLA 12: CONFIGURACION_SISTEMA (SYSTEM_CONFIG)

### Descripción
Configuración general del sistema y parámetros.

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | INT | Identificador único de la configuración | ✅ |
| `clave` | VARCHAR(100) | Clave de la configuración | ✅ |
| `valor` | TEXT | Valor de la configuración | ✅ |
| `descripcion` | VARCHAR(255) | Descripción de la configuración | ❌ |
| `tipo` | ENUM | String, Number, Boolean, JSON | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

### Configuraciones Principales:
- `organization_name` - Nombre de la agrupación
- `organization_cuit` - CUIT de la agrupación
- `organization_address` - Dirección de la agrupación
- `organization_phone` - Teléfono de la agrupación
- `organization_email` - Email de la agrupación
- `currency` - Moneda del sistema
- `timezone` - Zona horaria
- `invoice_prefix` - Prefijo de facturas
- `next_invoice_number` - Próximo número de factura
- `payment_terms_days` - Plazo de pago en días
- `tax_rate` - Tasa de IVA

---

## 📊 TABLA 13: FACTURAS (INVOICES)

### Descripción
Facturas emitidas a los socios (para el módulo de contabilidad).

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | VARCHAR(20) | Número de factura (ej: FAC-001) | ✅ |
| `member_id` | INT | ID del socio (FK a members) | ✅ |
| `fecha` | DATE | Fecha de emisión | ✅ |
| `monto` | DECIMAL(10,2) | Monto de la factura | ✅ |
| `estado` | ENUM | Pendiente, Pagada, Vencida, Anulada | ✅ |
| `fecha_vencimiento` | DATE | Fecha de vencimiento | ✅ |
| `concepto` | VARCHAR(255) | Concepto de la factura | ✅ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |
| `updated_at` | TIMESTAMP | Fecha de actualización | ✅ |

---

## 💳 TABLA 14: PAGOS (PAYMENTS)

### Descripción
Pagos registrados por los socios (para el módulo de contabilidad).

### Campos Principales
| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | VARCHAR(20) | ID del pago (ej: PAG-001) | ✅ |
| `member_id` | INT | ID del socio (FK a members) | ✅ |
| `fecha` | DATE | Fecha del pago | ✅ |
| `monto` | DECIMAL(10,2) | Monto del pago | ✅ |
| `metodo` | ENUM | Efectivo, Transferencia, Cheque, Tarjeta | ✅ |
| `invoice_id` | VARCHAR(20) | ID de la factura pagada (FK) | ❌ |
| `referencia` | VARCHAR(100) | Referencia del pago | ❌ |
| `created_at` | TIMESTAMP | Fecha de creación | ✅ |

---

## 🔗 RELACIONES ENTRE TABLAS

### Claves Foráneas Principales:

1. **MOVIMIENTOS_SOCIOS** → **SOCIOS** (`member_id`)
2. **MOVIMIENTOS_SOCIOS** → **CARGOS** (`charge_id`)
3. **PRODUCTOS** → **LISTAS_PRECIOS** (`price_list_id`)
4. **LISTAS_PRECIOS** → **PROVEEDORES** (`provider_id`)
5. **ITEMS_LISTA_PRECIOS** → **LISTAS_PRECIOS** (`price_list_id`)
6. **ITEMS_LISTA_PRECIOS** → **PRODUCTOS** (`product_id`)
7. **CONDICIONES_COMPRA** → **PROVEEDORES** (`provider_id`)
8. **PEDIDOS** → **SOCIOS** (`member_id`)
9. **PEDIDOS** → **PROVEEDORES** (`provider_id`)
10. **ITEMS_PEDIDO** → **PEDIDOS** (`order_id`)
11. **ITEMS_PEDIDO** → **PRODUCTOS** (`product_id`)
12. **USUARIOS** → **SOCIOS** (`member_id`)
13. **FACTURAS** → **SOCIOS** (`member_id`)
14. **PAGOS** → **SOCIOS** (`member_id`)
15. **PAGOS** → **FACTURAS** (`invoice_id`)

---

## 📈 ÍNDICES RECOMENDADOS

### Índices Primarios:
- Todas las tablas: `id` (PRIMARY KEY)

### Índices Secundarios:
- **SOCIOS**: `cuit`, `status`, `fecha_alta`
- **MOVIMIENTOS_SOCIOS**: `member_id`, `fecha`, `tipo`, `estado`
- **PROVEEDORES**: `cuit`, `status`
- **PRODUCTOS**: `codigo`, `categoria`, `activo`
- **LISTAS_PRECIOS**: `provider_id`, `status`, `fecha_carga`
- **PEDIDOS**: `member_id`, `provider_id`, `fecha`, `estado`
- **USUARIOS**: `email`, `rol`, `status`
- **FACTURAS**: `member_id`, `fecha`, `estado`
- **PAGOS**: `member_id`, `fecha`

---

## 🔒 RESTRICCIONES Y VALIDACIONES

### Restricciones de Integridad:
1. **CUIT único** en SOCIOS y PROVEEDORES
2. **Email único** en SOCIOS, PROVEEDORES y USUARIOS
3. **Código único** en PRODUCTOS
4. **Saldo no negativo** en MOVIMIENTOS_SOCIOS
5. **Precio positivo** en PRODUCTOS y ITEMS_LISTA_PRECIOS
6. **Cantidad positiva** en ITEMS_PEDIDO

### Validaciones de Negocio:
1. Un socio solo puede tener un usuario asociado
2. Los movimientos deben mantener el saldo actualizado
3. Las facturas vencidas deben marcarse automáticamente
4. Los productos inactivos no pueden incluirse en pedidos
5. Las listas de precios vencidas no pueden usarse

---

## 📊 ESTADÍSTICAS Y REPORTES

### Consultas Principales:
1. **Saldo actual por socio**
2. **Movimientos pendientes**
3. **Facturas vencidas**
4. **Productos más vendidos**
5. **Proveedores más utilizados**
6. **Estadísticas de pagos**
7. **Reporte de cobranzas**
8. **Análisis de pedidos**

---

## 🚀 CONSIDERACIONES DE IMPLEMENTACIÓN

### Base de Datos:
- **Motor**: PostgreSQL o MySQL
- **Encoding**: UTF-8
- **Collation**: utf8_unicode_ci
- **Backup**: Diario automático

### Seguridad:
- **Encriptación**: Contraseñas con bcrypt
- **Auditoría**: Log de cambios críticos
- **Acceso**: Control por roles y permisos

### Performance:
- **Particionamiento**: Movimientos por fecha
- **Archivado**: Datos históricos después de 2 años
- **Cache**: Configuraciones y datos frecuentes

---

*Documento generado el: 18 de Agosto de 2025*
*Sistema: Gestión de Agrupaciones - Mar & Sierras*
*Versión: 1.0*





