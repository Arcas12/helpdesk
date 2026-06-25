using HelpdeskAPI.DTOs;

namespace HelpdeskAPI.Services.Interfaces;

/// <summary>
/// Principio SOLID: Dependency Inversion (D)
/// Los controladores dependen de esta INTERFAZ, no de la clase concreta.
/// Esto permite cambiar la implementación sin tocar el controlador.
/// </summary>
public interface IAuthService
{
	Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
}
