using HelpdeskAPI.DTOs;
using HelpdeskAPI.Models;

namespace HelpdeskAPI.Services.Interfaces;

public interface ITicketService
{
    Task<PagedResultDto<TicketDto>> GetTicketsAsync(TicketFilterDto filter, int userId, string role);
    Task<TicketDto> GetByIdAsync(int ticketId, int userId, string role);
    Task<TicketDto> CreateAsync(CreateTicketDto dto, int userId);
    Task<TicketDto> UpdateAsync(int ticketId, UpdateTicketDto dto, int userId, string role);
    Task<List<CommentDto>> GetCommentsAsync(int ticketId, int userId, string role);
    Task<CommentDto> AddCommentAsync(int ticketId, CreateCommentDto dto, int userId, string role);
}

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync();
    Task<UserDto> GetByIdAsync(int id);
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto> UpdateAsync(int id, UpdateUserDto dto);
}

public interface ICategoryService
{
    Task<List<Category>> GetAllAsync();
}

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int userId, string role);
}