using HelpdeskAPI.Models;
using HelpdeskAPI.DTOs;

namespace HelpdeskAPI.Repositories.Interfaces;

// ══════════════════════════════════════════════════════════════
// PRINCIPIO SOLID: Interface Segregation (I)
// Cada repositorio tiene su propia interfaz con solo los métodos
// que necesita. No hay una interfaz gigante para todo.
// ══════════════════════════════════════════════════════════════

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetAllAsync();
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task<bool> EmailExistsAsync(string email);
}

public interface ITicketRepository
{
    Task<Ticket?> GetByIdAsync(int id);
    Task<PagedResultDto<Ticket>> GetPagedAsync(TicketFilterDto filter, int? userId, string role);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task<Ticket> UpdateAsync(Ticket ticket);
    Task<List<Comment>> GetCommentsByTicketIdAsync(int ticketId);
    Task<Comment> AddCommentAsync(Comment comment);
    Task<DashboardDto> GetDashboardDataAsync(int? userId, string role);
}

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
    Task<Category> CreateAsync(Category category);
}