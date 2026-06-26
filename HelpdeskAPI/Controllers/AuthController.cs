using Microsoft.AspNetCore.Mvc;
using HelpdeskAPI.DTOs;
using HelpdeskAPI.Services.Interfaces;

namespace HelpdeskAPI.Controllers;

/// <summary>
/// Controlador delgado — solo recibe la petición y delega al servicio.
/// Principio SOLID: Single Responsibility (S)
/// El controlador NO tiene lógica de negocio. Solo:
/// 1. Recibe la petición HTTP
/// 2. Llama al servicio
/// 3. Devuelve la respuesta HTTP
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	private readonly IAuthService _authService;

	// Inyección de dependencias — recibimos la INTERFAZ, no la clase concreta
	public AuthController(IAuthService authService)
	{
		_authService = authService;
	}

	/// <summary>
	/// POST api/auth/login
	/// Recibe email y contraseña, devuelve un token JWT si son válidos.
	/// Este es el ÚNICO endpoint que no requiere autenticación.
	/// </summary>
	[HttpPost("login")]
	public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
	{
		// Validación básica
		if (string.IsNullOrWhiteSpace(request.Email) ||
			string.IsNullOrWhiteSpace(request.Password))
		{
			return BadRequest(new { success = false, message = "Email y contraseña son requeridos." });
		}

		// El servicio puede lanzar UnauthorizedAccessException si las
		// credenciales son inválidas — el middleware lo captura y devuelve 401
		var result = await _authService.LoginAsync(request);

		return Ok(new { success = true, data = result });
	}

	// SOLO PARA DESARROLLO — borra esto antes de entregar
	[HttpGet("generate-hash/{password}")]
	public IActionResult GenerateHash(string password)
	{
		var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
		return Ok(new { password, hash });
	}

}