namespace HelpdeskAPI.DTOs;

// ══════════════════════════════════════════════════════════════
// ¿QUÉ ES UN DTO?
// Data Transfer Object — es un objeto "limpio" que solo tiene
// los campos que necesitas exponer. Nunca expongas el Model
// directamente porque puede tener el PasswordHash u otros
// campos internos que no deben salir de la API.
// ══════════════════════════════════════════════════════════════

// ── Lo que LLEGA al endpoint de login ─────────────────────────
public class LoginRequestDto
{
	public string Email { get; set; } = string.Empty;
	public string Password { get; set; } = string.Empty;
}

// ── Lo que DEVUELVE el endpoint de login ──────────────────────
public class LoginResponseDto
{
	public string Token { get; set; } = string.Empty; // JWT
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string Role { get; set; } = string.Empty;
	public DateTime ExpiresAt { get; set; }
}

// ── Lo que DEVUELVE cuando pides un usuario ───────────────────
// Nota: NO tiene PasswordHash — eso nunca sale de la API
public class UserDto
{
	public int Id { get; set; }
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string Role { get; set; } = string.Empty;
	public bool IsActive { get; set; }
	public DateTime CreatedAt { get; set; }
}

// ── Lo que LLEGA para crear un usuario nuevo ──────────────────
public class CreateUserDto
{
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string Password { get; set; } = string.Empty;
	public int RoleId { get; set; }
}

// ── Lo que LLEGA para editar un usuario ───────────────────────
public class UpdateUserDto
{
	public string FullName { get; set; } = string.Empty;
	public int RoleId { get; set; }
	public bool IsActive { get; set; }
}