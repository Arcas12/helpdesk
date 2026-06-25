using Microsoft.EntityFrameworkCore;
using HelpdeskAPI.Data;
using HelpdeskAPI.DTOs;
using HelpdeskAPI.Models;
using HelpdeskAPI.Repositories.Interfaces;

namespace HelpdeskAPI.Repositories;

/// <summary>
/// Repositorio de tickets.
/// 
/// Punto clave de seguridad: GetPagedAsync filtra los tickets
/// según el ROL del usuario que hace la petición.
/// Esto garantiza que la restricción es del BACKEND, no del frontend.
/// </summary>
public class TicketRepository : ITicketRepository
{
	private readonly AppDbContext _context;

	public TicketRepository(AppDbContext context)
	{
		_context = context;
	}

	public async Task<Ticket?> GetByIdAsync(int id)
	{
		return await _context.Tickets
			.Include(t => t.Category)
			.Include(t => t.CreatedBy)
			.Include(t => t.AssignedTo)
			.Include(t => t.Comments)
				.ThenInclude(c => c.User)
			.FirstOrDefaultAsync(t => t.Id == id);
	}

	public async Task<PagedResultDto<Ticket>> GetPagedAsync(
		TicketFilterDto filter,
		int? userId,
		string role)
	{
		// ── Punto crítico de seguridad RBAC ───────────────────────────────
		// Construimos la query base filtrando por ROL.
		// Esto ocurre en el backend — no importa qué mande el frontend.
		var query = _context.Tickets
			.Include(t => t.Category)
			.Include(t => t.CreatedBy)
			.Include(t => t.AssignedTo)
			.AsQueryable();

		// Filtro por rol — NUNCA se salta esta regla
		query = role switch
		{
			// Solicitante: solo ve SUS tickets
			"Requester" => query.Where(t => t.CreatedById == userId),
			// Agente: solo ve los tickets asignados a él
			"Agent" => query.Where(t => t.AssignedToId == userId),
			// Administrador: ve todos los tickets
			"Administrator" => query,
			_ => query.Where(t => t.CreatedById == userId)
		};

		// ── Filtros adicionales combinables ───────────────────────────────
		if (!string.IsNullOrWhiteSpace(filter.Status) &&
			Enum.TryParse<TicketStatus>(filter.Status, out var status))
			query = query.Where(t => t.Status == status);

		if (!string.IsNullOrWhiteSpace(filter.Priority) &&
			Enum.TryParse<TicketPriority>(filter.Priority, out var priority))
			query = query.Where(t => t.Priority == priority);

		if (filter.CategoryId.HasValue)
			query = query.Where(t => t.CategoryId == filter.CategoryId);

		if (filter.AgentId.HasValue)
			query = query.Where(t => t.AssignedToId == filter.AgentId);

		if (filter.DateFrom.HasValue)
			query = query.Where(t => t.CreatedAt >= filter.DateFrom);

		if (filter.DateTo.HasValue)
			query = query.Where(t => t.CreatedAt <= filter.DateTo);

		if (!string.IsNullOrWhiteSpace(filter.Search))
			query = query.Where(t =>
				t.Title.Contains(filter.Search) ||
				t.Description.Contains(filter.Search)
			);

		// ── Paginación del lado del servidor ──────────────────────────────
		// Contamos ANTES de paginar para saber el total
		var totalCount = await query.CountAsync();

		var items = await query
			.OrderByDescending(t => t.CreatedAt)
			.Skip((filter.Page - 1) * filter.PageSize)
			.Take(filter.PageSize)
			.ToListAsync();

		return new PagedResultDto<Ticket>
		{
			Items = items,
			TotalCount = totalCount,
			Page = filter.Page,
			PageSize = filter.PageSize
		};
	}

	public async Task<Ticket> CreateAsync(Ticket ticket)
	{
		_context.Tickets.Add(ticket);
		await _context.SaveChangesAsync();
		return ticket;
	}

	public async Task<Ticket> UpdateAsync(Ticket ticket)
	{
		ticket.UpdatedAt = DateTime.UtcNow;
		_context.Tickets.Update(ticket);
		await _context.SaveChangesAsync();
		return ticket;
	}

	public async Task<List<Comment>> GetCommentsByTicketIdAsync(int ticketId)
	{
		return await _context.Comments
			.Include(c => c.User)
			.Where(c => c.TicketId == ticketId)
			.OrderBy(c => c.CreatedAt)
			.ToListAsync();
	}

	public async Task<Comment> AddCommentAsync(Comment comment)
	{
		_context.Comments.Add(comment);
		await _context.SaveChangesAsync();
		return comment;
	}

	/// <summary>
	/// Calcula los KPIs del dashboard según el rol.
	/// El administrador ve todo, el agente ve sus tickets,
	/// el solicitante ve los suyos.
	/// </summary>
	public async Task<DashboardDto> GetDashboardDataAsync(int? userId, string role)
	{
		var query = _context.Tickets.AsQueryable();

		// Mismo filtro de seguridad por rol
		query = role switch
		{
			"Requester" => query.Where(t => t.CreatedById == userId),
			"Agent" => query.Where(t => t.AssignedToId == userId),
			"Administrator" => query,
			_ => query.Where(t => t.CreatedById == userId)
		};

		var tickets = await query
			.Include(t => t.Category)
			.Include(t => t.AssignedTo)
			.ToListAsync();

		return new DashboardDto
		{
			TotalTickets = tickets.Count,
			OpenTickets = tickets.Count(t => t.Status == TicketStatus.Open),
			InProgressTickets = tickets.Count(t => t.Status == TicketStatus.InProgress),
			ResolvedTickets = tickets.Count(t => t.Status == TicketStatus.Resolved),
			ClosedTickets = tickets.Count(t => t.Status == TicketStatus.Closed),

			// Agrupaciones para los gráficos
			ByPriority = tickets
				.GroupBy(t => t.Priority.ToString())
				.Select(g => new ChartItemDto { Label = g.Key, Value = g.Count() })
				.ToList(),

			ByCategory = tickets
				.GroupBy(t => t.Category.Name)
				.Select(g => new ChartItemDto { Label = g.Key, Value = g.Count() })
				.ToList(),

			ByAgent = tickets
				.Where(t => t.AssignedTo != null)
				.GroupBy(t => t.AssignedTo!.FullName)
				.Select(g => new ChartItemDto { Label = g.Key, Value = g.Count() })
				.ToList()
		};
	}
}