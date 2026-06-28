using HelpdeskAPI.DTOs;
using HelpdeskAPI.Models;
using HelpdeskAPI.Repositories.Interfaces;
using HelpdeskAPI.Services.Interfaces;

namespace HelpdeskAPI.Services;

/// <summary>
/// Lógica de negocio de tickets.
/// Aquí viven las reglas: quién puede ver qué, quién puede cambiar qué.
/// Los controladores son delgados — toda la inteligencia está aquí.
/// </summary>
public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepo;
    private readonly ICategoryRepository _categoryRepo;
    private readonly ILogger<TicketService> _logger;

    public TicketService(
        ITicketRepository ticketRepo,
        ICategoryRepository categoryRepo,
        ILogger<TicketService> logger)
    {
        _ticketRepo = ticketRepo;
        _categoryRepo = categoryRepo;
        _logger = logger;
    }

    public async Task<PagedResultDto<TicketDto>> GetTicketsAsync(
        TicketFilterDto filter, int userId, string role)
    {
        var paged = await _ticketRepo.GetPagedAsync(filter, userId, role);

        return new PagedResultDto<TicketDto>
        {
            Items = paged.Items.Select(MapToDto).ToList(),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        };
    }

    public async Task<TicketDto> GetByIdAsync(int ticketId, int userId, string role)
    {
        var ticket = await _ticketRepo.GetByIdAsync(ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} no encontrado.");

        // Validar que el usuario puede ver este ticket
        ValidateTicketAccess(ticket, userId, role);

        return MapToDto(ticket);
    }

    public async Task<TicketDto> CreateAsync(CreateTicketDto dto, int userId)
    {
        var category = await _categoryRepo.GetByIdAsync(dto.CategoryId)
            ?? throw new ArgumentException("Categoría no válida.");

        var ticket = new Ticket
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            Priority = dto.Priority,
            Status = TicketStatus.Open,
            CategoryId = dto.CategoryId,
            CreatedById = userId
        };

        var created = await _ticketRepo.CreateAsync(ticket);
        _logger.LogInformation("Ticket {Id} creado por usuario {UserId}", created.Id, userId);

        // Recargamos para tener todas las navegaciones
        var saved = await _ticketRepo.GetByIdAsync(created.Id);
        return MapToDto(saved!);
    }

    public async Task<TicketDto> UpdateAsync(
        int ticketId, UpdateTicketDto dto, int userId, string role)
    {
        var ticket = await _ticketRepo.GetByIdAsync(ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} no encontrado.");

        // Solo Admin o el Agente asignado pueden actualizar
        if (role == "Requester")
            throw new UnauthorizedAccessException("Los solicitantes no pueden modificar tickets.");

        if (role == "Agent" && ticket.AssignedToId != userId)
            throw new UnauthorizedAccessException("Solo puedes modificar tickets asignados a ti.");

        ticket.Status = dto.Status;
        ticket.Priority = dto.Priority;
        ticket.CategoryId = dto.CategoryId;
        ticket.AssignedToId = dto.AssignedToId;

        var updated = await _ticketRepo.UpdateAsync(ticket);
        _logger.LogInformation("Ticket {Id} actualizado por usuario {UserId}", ticketId, userId);

        var saved = await _ticketRepo.GetByIdAsync(updated.Id);
        return MapToDto(saved!);
    }

    public async Task<List<CommentDto>> GetCommentsAsync(
        int ticketId, int userId, string role)
    {
        var ticket = await _ticketRepo.GetByIdAsync(ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} no encontrado.");

        ValidateTicketAccess(ticket, userId, role);

        var comments = await _ticketRepo.GetCommentsByTicketIdAsync(ticketId);

        return comments.Select(c => new CommentDto
        {
            Id = c.Id,
            Content = c.Content,
            CreatedBy = c.User.FullName,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<CommentDto> AddCommentAsync(
        int ticketId, CreateCommentDto dto, int userId, string role)
    {
        var ticket = await _ticketRepo.GetByIdAsync(ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} no encontrado.");

        ValidateTicketAccess(ticket, userId, role);

        if (string.IsNullOrWhiteSpace(dto.Content))
            throw new ArgumentException("El comentario no puede estar vacío.");

        var comment = new Comment
        {
            TicketId = ticketId,
            UserId = userId,
            Content = dto.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _ticketRepo.AddCommentAsync(comment);

        return new CommentDto
        {
            Id = created.Id,
            Content = created.Content,
            CreatedBy = "Tú",
            CreatedAt = created.CreatedAt
        };
    }

    // ── Helpers privados ──────────────────────────────────────────────────

    /// <summary>
    /// Valida que el usuario autenticado tiene acceso a este ticket.
    /// </summary>
    private static void ValidateTicketAccess(Ticket ticket, int userId, string role)
    {
        var hasAccess = role switch
        {
            "Administrator" => true,
            "Agent" => ticket.AssignedToId == userId,
            "Requester" => ticket.CreatedById == userId,
            _ => false
        };

        if (!hasAccess)
            throw new UnauthorizedAccessException("No tienes acceso a este ticket.");
    }

    /// <summary>
    /// Convierte un Ticket (Model) a TicketDto para exponer en la API.
    /// Nunca exponemos el Model directamente.
    /// </summary>
    private static TicketDto MapToDto(Ticket t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,
        Priority = t.Priority.ToString(),
        Status = t.Status.ToString(),
        Category = t.Category?.Name ?? "",
        CreatedBy = t.CreatedBy?.FullName ?? "",
        AssignedTo = t.AssignedTo?.FullName,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
        CommentCount = t.Comments?.Count ?? 0
    };
}