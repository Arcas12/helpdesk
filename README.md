#  HelpDesk — Sistema de Mesa de Ayuda

Aplicación web de gestión de tickets de soporte con control de acceso basado en roles (RBAC), dashboard con métricas en tiempo real y exportación de reportes.

---

##  Stack Tecnológico

| Capa        | Tecnología                          |
|-------------|-------------------------------------|
| Backend     | .NET 10 (ASP.NET Core Web API)      |
| Base de datos | SQL Server Express                |
| Frontend    | React 18 + TypeScript               |
| ORM         | Entity Framework Core 10            |
| Autenticación | JWT (JSON Web Tokens)             |
| Hashing     | BCrypt.Net-Next (cost factor 11)    |
| UI          | Material UI (MUI) v5                |
| Gráficos    | Recharts                            |
| Exportación | SheetJS (xlsx) + file-saver         |

---

##  Arquitectura y Decisiones Técnicas

### Estructura del Backend

```
HelpdeskAPI/
├── Controllers/     # Controladores delgados — solo reciben y responden HTTP
├── Services/        # Lógica de negocio
│   └── Interfaces/  # Contratos (interfaces) de los servicios
├── Repositories/    # Acceso a datos — única capa que toca la BD
│   └── Interfaces/  # Contratos de los repositorios
├── Models/          # Entidades que mapean las tablas de la BD
├── DTOs/            # Objetos de transferencia de datos (entrada/salida de la API)
├── Data/            # DbContext (configuración de EF Core)
└── Middleware/      # Manejo global de errores
```

### Principios SOLID aplicados

| Principio | Dónde se aplica |
|-----------|----------------|
| **S** — Single Responsibility | Cada clase tiene una sola responsabilidad: `UserRepository` solo accede a datos de usuarios, `UserService` solo contiene lógica de negocio de usuarios, `UsersController` solo maneja HTTP. |
| **O** — Open/Closed | El filtro de tickets por rol usa un `switch` expression que puede extenderse con nuevos roles sin modificar el código existente. |
| **L** — Liskov Substitution | Todas las implementaciones (`AuthService`, `TicketService`, etc.) cumplen completamente sus interfaces (`IAuthService`, `ITicketService`). |
| **I** — Interface Segregation | Cada repositorio tiene su propia interfaz pequeña (`IUserRepository`, `ITicketRepository`, `ICategoryRepository`) en vez de una interfaz gigante. |
| **D** — Dependency Inversion | Los controladores dependen de interfaces (`ITicketService`), no de clases concretas (`TicketService`). La inyección de dependencias se configura en `Program.cs`. |

### Decisiones de diseño

- **Filtro RBAC en el backend**: La visibilidad de tickets por rol se resuelve en `TicketRepository.GetPagedAsync()` con un filtro que se aplica a nivel de query SQL. Nunca se confía solo en el frontend.
- **DTOs**: Las entidades de la BD nunca se exponen directamente. Se usan DTOs de entrada y salida para desacoplar la capa de datos de la API.
- **Enums como strings**: Los enums `TicketStatus` y `TicketPriority` se almacenan como texto (`"Open"`, `"High"`) en vez de números, haciendo la BD legible sin necesitar el código.
- **Middleware de errores**: Un middleware centralizado captura todas las excepciones y devuelve respuestas JSON consistentes con el código HTTP correcto.

---

## 🚀 Cómo levantar el proyecto

### Requisitos previos
- .NET 10 SDK
- SQL Server Express (o cualquier instancia de SQL Server)
- Node.js 18+
- SQL Server Management Studio (SSMS) — opcional

### 1. Base de datos

Ejecutar el script SQL en SSMS o sqlcmd:

```bash
sqlcmd -S localhost\SQLEXPRESS -i helpdesk_database.sql
```

O abrir `helpdesk_database.sql` en SSMS y presionar F5.

Esto crea la base de datos `HelpDeskDB` con todas las tablas y datos semilla.

### 2. Backend

```bash
cd HelpdeskAPI

# Restaurar dependencias
dotnet restore

# Ejecutar
dotnet run
```

La API quedará disponible en: `http://localhost:5175`
Swagger UI en: `http://localhost:5175/swagger`

### 3. Frontend

```bash
cd helpdesk-ui

# Instalar dependencias
npm install

# Ejecutar
npm start
```

La aplicación quedará disponible en: `http://localhost:3000`

---

##  Configuración de la cadena de conexión

La cadena de conexión está en:

```
HelpdeskAPI/appsettings.json
```

Sección `ConnectionStrings`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=HelpDeskDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Para apuntar a otra instancia de SQL Server, cambiar `localhost\\SQLEXPRESS` por el nombre o IP del servidor deseado.

---

##  Credenciales de prueba

| Rol           | Email                    | Contraseña  |
|---------------|--------------------------|-------------|
| Administrador | admin@helpdesk.com       | Admin123!   |
| Agente        | agent@helpdesk.com       | Agent123!   |
| Solicitante   | user@helpdesk.com        | User123!    |

---

##  Seguridad implementada

- **JWT**: Tokens firmados con HMAC-SHA256, expiración de 60 minutos.
- **BCrypt**: Contraseñas hasheadas con cost factor 11. Nunca se almacenan en texto plano.
- **RBAC en backend**: Los endpoints validan el rol con `[Authorize(Roles = "...")]`. Un agente no puede ver tickets de otro agente aunque construya la petición manualmente con Postman.
- **401 vs 403**: Token ausente o inválido → 401. Token válido pero sin permiso → 403.
- **CORS**: Solo se permite el origen `http://localhost:3000`.
- **Sin SQL injection**: Se usa EF Core con consultas parametrizadas. Nunca se concatenan strings SQL.

---

## 📊 Roles y permisos

| Acción                    | Administrador | Agente | Solicitante |
|---------------------------|:---:|:---:|:---:|
| Ver todos los tickets     | ✅  | ❌  | ❌  |
| Ver tickets asignados     | ✅  | ✅  | ❌  |
| Ver mis tickets           | ✅  | ✅  | ✅  |
| Crear tickets             | ✅  | ✅  | ✅  |
| Actualizar tickets        | ✅  | ✅* | ❌  |
| Gestionar usuarios        | ✅  | ❌  | ❌  |
| Dashboard global          | ✅  | ❌  | ❌  |
| Dashboard propio          | ✅  | ✅  | ✅  |

*El agente solo puede actualizar tickets asignados a él.

---

##  Qué quedó fuera de alcance y por qué

| Funcionalidad | Razón |
|--------------|-------|
| Refresh tokens | Prioridad menor frente a completar RBAC y dashboard funcional |
| Pruebas unitarias | Tiempo limitado a 3 días; se priorizó funcionalidad completa |
| Pipeline CI/CD | No alcanzó el tiempo disponible |
| Exportación a PDF | Se implementó Excel; PDF requería librería adicional |


---

##  Uso de IA

**Herramientas utilizadas:** Claude (Anthropic) y Codex

**Para qué se usó:**
- Generación de estructura inicial de archivos y boilerplate
- Corrección de errores de compatibilidad de versiones (MUI v5, Swashbuckle 10)
- Generación de componentes de UI (tablas, modales, gráficos)

**Qué se decidió y escribió directamente:**
- La arquitectura de capas (Controllers → Services → Repositories)
- La lógica de seguridad RBAC: el filtro por rol en `TicketRepository.GetPagedAsync()` y la validación en `TicketService.ValidateTicketAccess()`
- La configuración de JWT en `Program.cs` y `AuthService`
- El flujo de autenticación completo
- Las decisiones de diseño documentadas en este README

