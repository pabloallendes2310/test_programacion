# Ejemplos de Uso - API con JWT

## 🔐 Flujo de Autenticación

### 1. Registrar Usuario

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Usuario Test"
  }'
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Usuario Test"
  }
}
```

### 2. Iniciar Sesión

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Guarda el token** de la respuesta para los siguientes requests.

### 3. Ver Perfil (Protegido)

```bash
TOKEN="tu_token_aqui"

curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 📋 Endpoints Protegidos

### Crear Record (Requiere Auth)

```bash
curl -X POST http://localhost:3000/api/v1/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "TEST-001",
    "date": "2025-01-05",
    "category": "Ventas",
    "amount": 1500.50,
    "status": "activo",
    "description": "Venta de prueba"
  }'
```

### Actualizar Record (Requiere Auth)

```bash
curl -X PATCH http://localhost:3000/api/v1/records/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completado",
    "amount": 2000.00
  }'
```

### Eliminar Record (Requiere Auth)

```bash
curl -X DELETE http://localhost:3000/api/v1/records/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Procesar PDF (Requiere Auth)

```bash
curl -X POST http://localhost:3000/api/v1/pdf/process \
  -H "Authorization: Bearer $TOKEN"
```

## 🔓 Endpoints Públicos

### Listar Records (Sin Auth)

```bash
# Sin filtros
curl http://localhost:3000/api/v1/records

# Con paginación
curl "http://localhost:3000/api/v1/records?page=1&limit=20"

# Con filtros
curl "http://localhost:3000/api/v1/records?status=activo&category=Ventas"

# Con rango de fechas
curl "http://localhost:3000/api/v1/records?startDate=2025-01-01&endDate=2025-01-31"
```

### Ver un Record (Sin Auth)

```bash
curl http://localhost:3000/api/v1/records/1
```

### Estadísticas (Sin Auth)

```bash
curl http://localhost:3000/api/v1/records/stats/summary
```

### Debug PDF (Sin Auth)

```bash
curl http://localhost:3000/api/v1/pdf/debug
```

## 🧪 Testing Completo con Variables

```bash
# 1. Registrar
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }')

# Extraer token (Linux/Mac con jq)
TOKEN=$(echo $RESPONSE | jq -r '.access_token')
echo "Token: $TOKEN"

# 2. Crear record
curl -X POST http://localhost:3000/api/v1/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "TEST-999",
    "date": "2025-01-05",
    "category": "Servicios",
    "amount": 500,
    "status": "pendiente",
    "description": "Servicio de prueba"
  }'

# 3. Ver perfil
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# 4. Listar records
curl http://localhost:3000/api/v1/records

# 5. Ver stats
curl http://localhost:3000/api/v1/records/stats/summary
```

## 🐛 Manejo de Errores

### Token Inválido o Expirado
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solución:** Hacer login nuevamente

### Email Ya Registrado
```json
{
  "statusCode": 409,
  "message": "El email ya esta registrado"
}
```

### Credenciales Inválidas
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas"
}
```

### Validación Fallida
```json
{
  "statusCode": 400,
  "message": [
    "Email inválido",
    "La contraseña debe tener al menos 6 caracteres"
  ],
  "error": "Bad Request"
}
```

## 📦 Usar con Postman

1. **Importar Collection** (crear archivo `api.postman_collection.json`)
2. **Crear Environment Variable:**
   - Key: `token`
   - Value: (dejar vacío, se llenará automáticamente)

3. **En Auth → Register/Login → Tests:**
```javascript
var response = pm.response.json();
pm.environment.set("token", response.access_token);
```

4. **En endpoints protegidos → Authorization:**
   - Type: Bearer Token
   - Token: `{{token}}`

## 🔒 Seguridad

- Los tokens JWT expiran en 7 días (configurable en `.env`)
- Las contraseñas se hashean con bcrypt (salt rounds: 10)
- Los endpoints de escritura requieren autenticación
- Los endpoints de lectura son públicos para facilitar consultas
- CORS habilitado (configurable en `.env`)
