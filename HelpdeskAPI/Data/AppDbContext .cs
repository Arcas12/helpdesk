using Microsoft.EntityFrameworkCore;
using HelpdeskAPI.Models;

namespace HelpdeskAPI.Data;

/// <summary>
/// AppDbContext es el "intermediario" entre tu código C# y SQL Server.
/// Entity Framework lo usa para traducir consultas LINQ a SQL automáticamente.
/// Principio SOLID aplicado: Single Responsibility — esta clase solo maneja
/// el acceso a datos, nada más.
/// </summary>
public class AppDbContext : DbContext
{
    // El constructor recibe la configuración desde Program.cs
    // (Inyección de Dependencias — principio de inversión de dependencias)
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Cada DbSet representa una tabla en la base de datos
    public DbSet<Role> Roles { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<Comment> Comments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Configuración de User ──────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique(); // Email único en la BD
            entity.Property(u => u.Email).HasMaxLength(150);
            entity.Property(u => u.FullName).HasMaxLength(100);
            entity.Property(u => u.PasswordHash).HasMaxLength(255);

            // Un usuario tiene un rol
            entity.HasOne(u => u.Role)
                  .WithMany(r => r.Users)
                  .HasForeignKey(u => u.RoleId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Configuración de Ticket ────────────────────────────────────────
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.Property(t => t.Title).HasMaxLength(200);

            // Guardamos el enum como string ("Open", "High") en vez de número
            // Así la BD es legible sin necesitar el código
            entity.Property(t => t.Priority)
                  .HasConversion<string>()
                  .HasMaxLength(20);

            entity.Property(t => t.Status)
                  .HasConversion<string>()
                  .HasMaxLength(20);

            // Relación: ticket creado por un usuario
            entity.HasOne(t => t.CreatedBy)
                  .WithMany(u => u.CreatedTickets)
                  .HasForeignKey(t => t.CreatedById)
                  .OnDelete(DeleteBehavior.Restrict);

            // Relación: ticket asignado a un agente (puede ser null)
            entity.HasOne(t => t.AssignedTo)
                  .WithMany(u => u.AssignedTickets)
                  .HasForeignKey(t => t.AssignedToId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
        });

        // ── Configuración de Comment ───────────────────────────────────────
        modelBuilder.Entity<Comment>(entity =>
        {
            // Si se borra un ticket, se borran sus comentarios
            entity.HasOne(c => c.Ticket)
                  .WithMany(t => t.Comments)
                  .HasForeignKey(c => c.TicketId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.User)
                  .WithMany(u => u.Comments)
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}