using System.Net;
using System.Text.Json;

namespace HelpdeskAPI.Middleware;

/// <summary>
/// Captura TODAS las excepciones no manejadas de la aplicación
/// y las convierte en respuestas JSON consistentes.
///
/// Sin esto, .NET devuelve páginas HTML de error que React no puede procesar.
///
/// Principio SOLID: Single Responsibility — este middleware SOLO
/// maneja errores, nada más.
/// </summary>
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(
        RequestDelegate next,
        ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Pasa la petición al siguiente middleware/controlador
            await _next(context);
        }
        catch (Exception ex)
        {
            // Si algo falla, lo capturamos aquí
            _logger.LogError(ex, "Error no manejado: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        // Dependiendo del tipo de error, devolvemos el código HTTP correcto
        var (statusCode, message) = ex switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Forbidden, "No tienes permiso para esta acción."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "El recurso solicitado no existe."),
            ArgumentException => (HttpStatusCode.BadRequest, ex.Message),
            InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
            _ => (HttpStatusCode.InternalServerError, "Ocurrió un error interno. Intenta más tarde.")
        };

        context.Response.StatusCode = (int)statusCode;

        // Respuesta JSON uniforme — siempre el mismo formato
        var response = new
        {
            success = false,
            status = (int)statusCode,
            message,
            // En desarrollo mostramos el detalle; en producción no
            detail = context.RequestServices
                            .GetRequiredService<IWebHostEnvironment>()
                            .IsDevelopment() ? ex.StackTrace : null
        };

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            })
        );
    }
}