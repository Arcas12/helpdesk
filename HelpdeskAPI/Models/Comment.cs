namespace HelpdeskAPI.Models;

public class Comment
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Propiedades de navegación
    public Ticket Ticket { get; set; } = null!;
    public User User { get; set; } = null!;
}