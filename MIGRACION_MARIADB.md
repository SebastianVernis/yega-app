# Análisis de Migración de MongoDB a MariaDB/MySQL

## 1. Introducción

Este documento analiza la viabilidad y los pasos necesarios para migrar la base de datos de la aplicación de MongoDB a un sistema de gestión de bases de datos relacional como MariaDB o MySQL.

## 2. Mapeo del Modelo de Datos

La migración requiere traducir los esquemas de Mongoose (NoSQL) a un esquema relacional (SQL).

### 2.1. `Usuario`

El modelo `Usuario` en MongoDB es complejo y contiene subdocumentos. En SQL, esto se traduciría en varias tablas relacionadas.

**Tabla `usuarios`:**

```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'tienda', 'repartidor', 'administrador') DEFAULT 'cliente',
    estado_validacion ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Tabla `ubicaciones`:**

```sql
CREATE TABLE ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    direccion VARCHAR(255),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### 2.2. `Producto`

**Tabla `productos`:**

```sql
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    tienda_id INT NOT NULL,
    categoria ENUM('comida', 'bebida', 'postre', 'snack', 'otro') DEFAULT 'otro',
    imagen VARCHAR(255),
    disponible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES usuarios(id)
);
```

### 2.3. `Pedido`

**Tabla `pedidos`:**

```sql
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    cliente_id INT NOT NULL,
    tienda_id INT NOT NULL,
    repartidor_id INT,
    subtotal DECIMAL(10, 2) NOT NULL,
    costo_envio DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendiente', 'confirmado', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado') DEFAULT 'pendiente',
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia'),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (tienda_id) REFERENCES usuarios(id),
    FOREIGN KEY (repartidor_id) REFERENCES usuarios(id)
);
```

**Tabla `pedido_productos` (Tabla de unión):**

```sql
CREATE TABLE pedido_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

## 3. Cambios en el Código de la Aplicación

*   **ORM/Librería de Base de Datos:** Reemplazar `Mongoose` con un ORM para SQL como `Sequelize` o `Knex.js`.
*   **Conexión a la Base de Datos:** Actualizar `server.js` para conectar con MariaDB/MySQL.
*   **Modelos:** Recrear los modelos de Mongoose como modelos de Sequelize/Knex.
*   **Controladores y Servicios:** Reescribir toda la lógica de base de datos en los controladores y servicios para usar el nuevo ORM y SQL.

## 4. Estrategia de Migración de Datos

1.  **Exportar Datos de MongoDB:** Exportar los datos de cada colección de MongoDB a formato JSON o CSV.
2.  **Limpiar y Transformar Datos:** Escribir scripts para transformar los datos exportados para que coincidan con la nueva estructura relacional.
3.  **Importar Datos a MariaDB/MySQL:** Importar los datos transformados a las nuevas tablas de MariaDB/MySQL.

## 5. Pros y Contras

### Pros

*   **Transacciones ACID:** Soporte para transacciones complejas y confiables.
*   **Consistencia de Datos:** Los esquemas estrictos garantizan una mayor consistencia de los datos.
*   **Recursos de la Firma:** Aprovechar la infraestructura y el conocimiento existentes en MariaDB/MySQL.

### Contras

*   **Costo de Migración:** La migración requiere un esfuerzo significativo en términos de tiempo y recursos.
*   **Flexibilidad Reducida:** Menos flexibilidad en la estructura de datos en comparación con MongoDB.
*   **Rendimiento:** Para ciertos tipos de consultas (por ejemplo, en documentos grandes y anidados), MongoDB puede ser más rápido.

## 6. Conclusión

La migración es factible pero representa un proyecto de ingeniería significativo. Se recomienda un análisis más profundo y una planificación detallada antes de comenzar la migración.
