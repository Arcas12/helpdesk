namespace HelpdeskAPI.Models;

/// <summary>
/// Representa la tabla Roles en la base de datos.
/// Un rol define qué puede hacer un usuario en el sistema.
/// </summary>
public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Propiedad de navegación: un Rol tiene muchos Usuarios
    // Entity Framework usa esto para hacer los JOINs automáticamente
    public ICollection<User> Users { get; set; } = new List<User>();
}