using HelpdeskAPI.DTOs;
using HelpdeskAPI.Models;
using HelpdeskAPI.Repositories.Interfaces;
using HelpdeskAPI.Services.Interfaces;

namespace HelpdeskAPI.Services;

// SERVICIO DE USUARIOS
// Solo el Administrador llega hasta aquí (el controlador lo valida)
public class UserService : IUserService
{
    private readonly IUserRepository _userRepo;

    public UserService(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await _userRepo.GetAllAsync();
        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> GetByIdAsync(int id)
    {
        var user = await _userRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado.");
        return MapToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        if (await _userRepo.EmailExistsAsync(dto.Email))
            throw new ArgumentException("Ya existe un usuario con ese email.");

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.ToLower().Trim(),
            // Hasheamos la contraseña con BCrypt antes de guardar
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            RoleId = dto.RoleId,
            IsActive = true
        };

        var created = await _userRepo.CreateAsync(user);
        var saved = await _userRepo.GetByIdAsync(created.Id);
        return MapToDto(saved!);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto)
    {
        var user = await _userRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado.");

        user.FullName = dto.FullName.Trim();
        user.RoleId = dto.RoleId;
        user.IsActive = dto.IsActive;

        await _userRepo.UpdateAsync(user);
        var saved = await _userRepo.GetByIdAsync(id);
        return MapToDto(saved!);
    }

    private static UserDto MapToDto(User u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        Email = u.Email,
        Role = u.Role?.Name ?? "",
        IsActive = u.IsActive,
        CreatedAt = u.CreatedAt
    };
}

// SERVICIO DE CATEGORÍAS

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepo;

    public CategoryService(ICategoryRepository categoryRepo)
    {
        _categoryRepo = categoryRepo;
    }

    public async Task<List<Category>> GetAllAsync()
    {
        return await _categoryRepo.GetAllAsync();
    }
}


// SERVICIO DE DASHBOARD
// Delega al repositorio y devuelve el DTO listo para el frontend
public class DashboardService : IDashboardService
{
    private readonly ITicketRepository _ticketRepo;

    public DashboardService(ITicketRepository ticketRepo)
    {
        _ticketRepo = ticketRepo;
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId, string role)
    {
        return await _ticketRepo.GetDashboardDataAsync(userId, role);
    }
}