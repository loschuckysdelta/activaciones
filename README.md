# API Telegram + MongoDB + Vercel

Proyecto simple para manejar dos saldos independientes por usuario:

- `credits`: créditos.
- `days`: días.

## Variables de entorno en Vercel

Configura:

- `MONGODB_URI`
- `MONGODB_DB`

Ejemplo:

```env
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=telegram_bot
```

## Endpoints

### Registrar usuario

`POST /api/register`

Body:

```json
{
  "telegramId": "123456789",
  "username": "usuario"
}
```

### Consultar usuario

`GET /api/user?id=123456789`

### Sumar créditos

`POST /api/increment`

```json
{
  "telegramId": "123456789",
  "type": "credits",
  "amount": 50
}
```

### Sumar días

```json
{
  "telegramId": "123456789",
  "type": "days",
  "amount": 200
}
```

### Fijar cantidad exacta

`POST /api/set`

```json
{
  "telegramId": "123456789",
  "type": "credits",
  "amount": 100
}
```

o:

```json
{
  "telegramId": "123456789",
  "type": "days",
  "amount": 30
}
```

### Listar usuarios

`GET /api/users`

## Panel web

Después de desplegar en Vercel, abre la URL principal del proyecto.

El panel permite:

- Registrar usuarios.
- Buscar por ID de Telegram.
- Ver créditos.
- Ver días.
- Sumar créditos.
- Sumar días.
- Establecer créditos exactos.
- Establecer días exactos.
- Ver los últimos 200 usuarios.

## Panel sin pantalla ADMIN_KEY

Esta versión elimina el cuadro de acceso ADMIN_KEY solicitado.

## Panel mejorado

Incluye menú lateral para Dashboard, Usuarios, APIs y Herramientas, estadísticas, acciones rápidas y vista responsive.


## APIs adicionales

### Agregar registro completo

`POST /api/add_user`

```json
{
  "telegramId": "123456789",
  "username": "usuario",
  "credits": 50,
  "days": 30
}
```

### Agregar créditos

`POST /api/add_credits`

```json
{
  "telegramId": "123456789",
  "amount": 50
}
```


### Descontar créditos

`POST /api/deduct_credits`

```json
{
  "telegramId": "123456789",
  "amount": 25
}
```

La API solo realiza el descuento cuando el usuario tiene créditos suficientes. Si el saldo es menor que `amount`, responde con `409` y no modifica los créditos.

Ejemplo exitoso:

```json
{
  "success": true,
  "message": "Se descontaron 25 créditos",
  "deducted": 25,
  "user": {
    "telegramId": "123456789",
    "username": "usuario",
    "credits": 75,
    "days": 30
  }
}
```

### Agregar días

`POST /api/add_days`

```json
{
  "telegramId": "123456789",
  "amount": 30
}
```

## Probador de API

El menú **APIs → Probar APIs** permite ejecutar solicitudes de prueba contra los endpoints del mismo despliegue de Vercel y ver la respuesta JSON.
