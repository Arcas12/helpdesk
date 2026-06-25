using Microsoft.EntityFrameworkCore;
using HelpdeskAPI.Data;
using HelpdeskAPI.Models;
using HelpdeskAPI.Repositories.Interfaces;

namespace HelpdeskAPI.Repositories;

/// <summary>
/// Solo acceso a datos de usuarios. Sin lógica de negocio.
/// Principio SOLID: Single Responsibility (S)
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users
            .Include(u => u.Role)
            .OrderBy(u => u.FullName)
            .ToListAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users
            .AnyAsync(u => u.Email == email.ToLower().Trim());
    }
}