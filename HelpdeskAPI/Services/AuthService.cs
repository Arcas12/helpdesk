using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HelpdeskAPI.Data;
using HelpdeskAPI.DTOs;
using HelpdeskAPI.Services.Interfaces;

namespace HelpdeskAPI.Services;

/// <summary>
/// Maneja el login y la generación de tokens JWT.
///
/// Flujo completo:
/// 1. Recibe email + contraseña en texto plano
/// 2. Busca el usuario en la BD por email
/// 3. Verifica la contraseña con BCrypt (compara texto plano vs hash)
/// 4. Si es válido, genera un JWT con los datos del usuario
/// 5. Devuelve el token al cliente (React)
/// </summary>
public class AuthService : IAuthService
{
	private readonly AppDbContext _context;
	private readonly IConfiguration _config;
	private readonly ILogger<AuthService> _logger;

	public AuthService(
		AppDbContext context,
		IConfiguration config,
		ILogger<AuthService> logger)
	{
		_context = context;
		_config = config;
		_logger = logger;
	}

	public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
	{
		// ── Paso 1: Buscar usuario por email ──────────────────────────────
		var user = await _context.Users
			.Include(u => u.Role)  // Traemos el rol para incluirlo en el token
			.FirstOrDefaultAsync(u =>
				u.Email == request.Email.ToLower().Trim() &&
				u.IsActive
			);

		// ── Paso 2: Verificar que existe y que la contraseña es correcta ──
		// IMPORTANTE: Verificamos el hash, NUNCA comparamos texto plano
		// BCrypt.Verify("Admin123!", "$2a$12$...") → true o false
		if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
		{
			// Mismo mensaje para ambos casos (usuario no existe o contraseña
			// incorrecta). Nunca digas cuál de los dos falló — es información
			// para un atacante.
			_logger.LogWarning("Intento de login fallido para email: {Email}", request.Email);
			throw new UnauthorizedAccessException("Credenciales inválidas.");
		}

		_logger.LogInformation("Login exitoso para usuario: {Email}", user.Email);

		// ── Paso 3: Generar el JWT ─────────────────────────────────────────
		var token = GenerateJwtToken(user.Id, user.Email, user.Role.Name, user.FullName);
		var expiresAt = DateTime.UtcNow.AddMinutes(
			int.Parse(_config["JwtSettings:ExpirationMinutes"]!)
		);

		return new LoginResponseDto
		{
			Token = token,
			FullName = user.FullName,
			Email = user.Email,
			Role = user.Role.Name,
			ExpiresAt = expiresAt
		};
	}

	/// <summary>
	/// Genera un JWT que contiene "claims" (datos del usuario).
	/// Estos claims viajan dentro del token y el backend los lee
	/// en cada petición SIN consultar la base de datos.
	/// </summary>
	private string GenerateJwtToken(int userId, string email, string role, string fullName)
	{
		var jwtSettings = _config.GetSection("JwtSettings");
		var key = new SymmetricSecurityKey(
							  Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)
						  );

		// Claims = datos que viajan dentro del token
		var claims = new[]
		{
			new Claim(JwtRegisteredClaimNames.Sub,   userId.ToString()),
			new Claim(JwtRegisteredClaimNames.Email, email),
			new Claim(ClaimTypes.Role,               role),      // Para [Authorize(Roles="Administrator")]
            new Claim("fullName",                    fullName),
			new Claim(JwtRegisteredClaimNames.Jti,  Guid.NewGuid().ToString()) // ID único del token
        };

		var token = new JwtSecurityToken(
			issuer: jwtSettings["Issuer"],
			audience: jwtSettings["Audience"],
			claims: claims,
			expires: DateTime.UtcNow.AddMinutes(
									int.Parse(jwtSettings["ExpirationMinutes"]!)
								),
			signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
		);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}