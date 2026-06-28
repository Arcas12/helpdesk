using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HelpdeskAPI.DTOs;
using HelpdeskAPI.Services.Interfaces;

namespace HelpdeskAPI.Controllers;


// HELPER: Extensión para leer los claims del token JWT

public static class ClaimsExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
        => int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Token inválido."));

    public static string GetRole(this ClaimsPrincipal user)
        => user.FindFirstValue(ClaimTypes.Role)
            ?? throw new UnauthorizedAccessException("Token sin rol.");
}

// CONTROLADOR DE TICKETS
// [Authorize] = requiere token JWT válido en TODOS los endpoints
[ApiController]
[Route("api/[controller]")]
[Authorize] // 401 si no hay token
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    /// GET api/tickets?page=1&pageSize=10&status=Open
    /// Cada rol ve solo LOS SUYOS — el servicio/repositorio lo garantiza
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TicketFilterDto filter)
    {
        var userId = User.GetUserId();
        var role = User.GetRole();
        var result = await _ticketService.GetTicketsAsync(filter, userId, role);
        return Ok(new { success = true, data = result });
    }

    /// GET api/tickets/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = User.GetUserId();
        var role = User.GetRole();
        var result = await _ticketService.GetByIdAsync(id, userId, role);
        return Ok(new { success = true, data = result });
    }

    /// POST api/tickets
    /// Cualquier usuario autenticado puede crear un ticket
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
    {
        var userId = User.GetUserId();
        var result = await _ticketService.CreateAsync(dto, userId);
        // 201 Created con la URL del nuevo recurso
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            new { success = true, data = result });
    }

    /// PUT api/tickets/5
    /// Solo Admin y Agente asignado pueden actualizar
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Agent")] // 403 si es Solicitante
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTicketDto dto)
    {
        var userId = User.GetUserId();
        var role = User.GetRole();
        var result = await _ticketService.UpdateAsync(id, dto, userId, role);
        return Ok(new { success = true, data = result });
    }

    /// GET api/tickets/5/comments
    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        var userId = User.GetUserId();
        var role = User.GetRole();
        var result = await _ticketService.GetCommentsAsync(id, userId, role);
        return Ok(new { success = true, data = result });
    }

    /// POST api/tickets/5/comments
    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
    {
        var userId = User.GetUserId();
        var role = User.GetRole();
        var result = await _ticketService.AddCommentAsync(id, dto, userId, role);
        return Ok(new { success = true, data = result });
    }
}

// CONTROLADOR DE USUARIOS
// Solo el Administrador puede acceder
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")] // 403 para todos los demás roles
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _userService.GetAllAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _userService.GetByIdAsync(id);
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var result = await _userService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            new { success = true, data = result });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var result = await _userService.UpdateAsync(id, dto);
        return Ok(new { success = true, data = result });
    }
}

// CONTROLADOR DE CATEGORÍAS
// Cualquier usuario autenticado puede ver las categorías
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _categoryService.GetAllAsync();
        return Ok(new { success = true, data = result });
    }
}

// CONTROLADOR DE DASHBOARD
// Cada rol ve sus propias métricas
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = User.GetUserId();
        var role = User.GetRole();
        var result = await _dashboardService.GetDashboardAsync(userId, role);
        return Ok(new { success = true, data = result });
    }
}