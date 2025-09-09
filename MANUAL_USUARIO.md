# 🌐 YEGA API – Manual de Usuario

<p align="center">
  <img src="https://img.shields.io/badge/YEGA%20API-%F0%9F%93%9D%20Manual-blue?style=for-the-badge" alt="Banner"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-green?logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-4.x-black?logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-5.x-brightgreen?logo=mongodb" alt="MongoDB"/>
</p>

## 🚀 Introducción
Bienvenido a la API de YEGA. Este manual describe paso a paso cómo interactuar con los endpoints principales usando ejemplos con `curl`.

## 🔐 Autenticación

1. **Registro**
   ```bash
   curl -X POST https://api.yega.com/auth/register \
     -H "Content-Type: application/json" \
     -d '{"nombre":"Ana","email":"ana@correo.com","password":"Secreto123"}'
   ```

2. **Verificación de OTP**
   ```bash
   curl -X POST https://api.yega.com/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"ana@correo.com","otp":"123456"}'
   ```

3. **Inicio de sesión**
   ```bash
   curl -X POST https://api.yega.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"ana@correo.com","password":"Secreto123"}'
   ```

   La respuesta incluirá un token JWT:

   ```json
   {"success":true,"token":"<JWT>"}
   ```

## 📦 Uso de endpoints protegidos

Incluye el token en el encabezado `Authorization`:

```bash
curl -H "Authorization: Bearer <JWT>" https://api.yega.com/products
```

## 📘 Ejemplos adicionales

- **Obtener producto por ID**
```bash
curl https://api.yega.com/products/123
```

- **Crear producto (requiere rol tienda o administrador)**
```bash
curl -X POST https://api.yega.com/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"nombre":"Nuevo","precio":1000}'
```

## ❗ Manejo de errores

La API responde con un formato consistente:

```json
{ "success": false, "message": "Descripción del error" }
```

- `400` – Datos inválidos.
- `401` – No autorizado o token vencido.
- `404` – Recurso no encontrado.
- `500` – Error interno.

## 🛎️ Buenas prácticas

- Renovar el token periódicamente.
- Usar HTTPS en todos los entornos.
- Validar respuestas y errores antes de procesarlas.

---

Sebastian Vernis | Soluciones Digitales
