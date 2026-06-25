using HelpdeskAPI.Models;

namespace HelpdeskAPI.DTOs;

// ── Lo que DEVUELVE cuando pides un ticket ────────────────────
public class TicketDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int CommentCount { get; set; }
}

// ── Lo que LLEGA para crear un ticket ─────────────────────────
public class CreateTicketDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public int CategoryId { get; set; }
}

// ── Lo que LLEGA para actualizar un ticket (solo el agente/admin) ──
public class UpdateTicketDto
{
    public TicketStatus Status { get; set; }
    public TicketPriority Priority { get; set; }
    public int? AssignedToId { get; set; }
    public int CategoryId { get; set; }
}

// ── Filtros para el listado de tickets ────────────────────────
public class TicketFilterDto
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public int? CategoryId { get; set; }
    public int? AgentId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Search { get; set; }
    // Paginación
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

// ── Respuesta paginada genérica ───────────────────────────────
public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

// ── DTOs de comentarios ───────────────────────────────────────
public class CommentDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateCommentDto
{
    public string Content { get; set; } = string.Empty;
}

// ── DTO del Dashboard ─────────────────────────────────────────
public class DashboardDto
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int InProgressTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int ClosedTickets { get; set; }

    // Para los gráficos
    public List<ChartItemDto> ByPriority { get; set; } = new();
    public List<ChartItemDto> ByCategory { get; set; } = new();
    public List<ChartItemDto> ByAgent { get; set; } = new();
}

public class ChartItemDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}