namespace HelpdeskAPI.Models;

/// <summary>
/// Representa la tabla Users.
/// Nunca expongas esta clase directamente en la API — usa DTOs.
/// </summary>
public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // IMPORTANTE: aquí NUNCA va la contraseña en texto plano.
    // Solo el hash generado por BCrypt.
    public string PasswordHash { get; set; } = string.Empty;

    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Propiedades de navegación
    public Role Role { get; set; } = null!;
    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}