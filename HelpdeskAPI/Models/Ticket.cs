namespace HelpdeskAPI.Models;

/// <summary>
/// Prioridades posibles de un ticket.
/// Usar enum evita errores de tipeo como "Hight" en vez de "High".
/// </summary>
public enum TicketPriority
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Estados del ciclo de vida de un ticket.
/// El flujo es: Open → InProgress → Resolved → Closed
/// </summary>
public enum TicketStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}

public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Open;

    public int CategoryId { get; set; }
    public int CreatedById { get; set; }
    public int? AssignedToId { get; set; } // Nullable: puede no tener agente asignado

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Propiedades de navegación
    public Category Category { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? AssignedTo { get; set; }
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}