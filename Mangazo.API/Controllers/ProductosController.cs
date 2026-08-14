using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;
using Microsoft.AspNetCore.Authorization;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly MangazoDbContext _context;

    public ProductosController(MangazoDbContext context)
    {
        _context = context;
    }

    // GET /api/productos
    [HttpGet]
    public async Task<IActionResult> GetProductos()
    {
        var productos = await _context.Productos
            .AsNoTracking()
            .OrderBy(p => p.IdProducto)
            .Select(p => new
            {
                p.IdProducto,
                p.Nombre,
                p.Descripcion,
                p.PrecioVenta,
                p.CostoActual,
                p.StockActual,
                p.Activo,
                p.FechaRegistro
            })
            .ToListAsync();

        return Ok(productos);
    }

    // GET /api/productos/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProducto(int id)
    {
        var producto = await _context.Productos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdProducto == id);

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje = $"No existe el producto #{id}."
            });
        }

        return Ok(producto);
    }

    // PUT /api/productos/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ModificarProducto(
        int id,
        ModificarProductoRequest request)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.IdProducto == id);

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje = $"No existe el producto #{id}."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Nombre))
        {
            return BadRequest(new
            {
                mensaje = "El nombre es obligatorio."
            });
        }

        if (request.PrecioVenta <= 0)
        {
            return BadRequest(new
            {
                mensaje = "El precio debe ser mayor a cero."
            });
        }

        if (request.CostoActual < 0)
        {
            return BadRequest(new
            {
                mensaje = "El costo no puede ser negativo."
            });
        }

        producto.Nombre = request.Nombre.Trim();
        producto.Descripcion = request.Descripcion?.Trim();
        producto.PrecioVenta = request.PrecioVenta;
        producto.CostoActual = request.CostoActual;
        producto.Activo = request.Activo;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = $"Producto #{producto.IdProducto} actualizado correctamente.",
            producto.IdProducto,
            producto.Nombre,
            producto.PrecioVenta,
            producto.CostoActual,
            producto.StockActual,
            producto.Activo
        });
    }
}

public class ModificarProductoRequest
{
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public decimal PrecioVenta { get; set; }

    public decimal CostoActual { get; set; }

    public bool Activo { get; set; }
}