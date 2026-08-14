using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;
using Mangazo.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventarioController : ControllerBase
{
    private readonly MangazoDbContext _context;

    public InventarioController(MangazoDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET /api/inventario
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetInventario()
    {
        var productos = await _context.Productos
            .AsNoTracking()
            .Where(p => p.Activo)
            .OrderBy(p => p.IdProducto)
            .Select(p => new
            {
                p.IdProducto,
                p.Nombre,
                p.StockActual,
                p.PrecioVenta,
                p.CostoActual,

                StockBajo =
                    p.StockActual <= 5
            })
            .ToListAsync();

        return Ok(productos);
    }

    // =========================================================
    // GET /api/inventario/movimientos
    // MÁS NUEVO → MÁS ANTIGUO
    // =========================================================

    [HttpGet("movimientos")]
    public async Task<IActionResult> GetMovimientos()
    {
        var movimientos = await _context.MovimientoInventarios
            .AsNoTracking()
            .OrderByDescending(m => m.FechaMovimiento)
            .ThenByDescending(m => m.IdMovimiento)
            .Select(m => new
            {
                m.IdMovimiento,
                m.IdProducto,

                Producto =
                    m.IdProductoNavigation.Nombre,

                m.IdVenta,
                m.TipoMovimiento,
                m.Cantidad,
                m.Motivo,
                m.FechaMovimiento
            })
            .ToListAsync();

        return Ok(movimientos);
    }

    // =========================================================
    // POST /api/inventario/entrada
    // ENTRADA INDIVIDUAL
    // =========================================================

    [HttpPost("entrada")]
    public async Task<IActionResult> RegistrarEntrada(
        RegistrarMovimientoRequest request)
    {
        if (request.Cantidad <= 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "La cantidad debe ser mayor a cero."
            });
        }

        var producto = await _context.Productos
            .FirstOrDefaultAsync(
                p => p.IdProducto == request.IdProducto
            );

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Producto no encontrado."
            });
        }

        if (!producto.Activo)
        {
            return BadRequest(new
            {
                mensaje =
                    $"El producto '{producto.Nombre}' no está activo."
            });
        }

        producto.StockActual +=
            request.Cantidad;

        var movimiento =
            new MovimientoInventario
            {
                IdProducto =
                    producto.IdProducto,

                IdVenta =
                    null,

                TipoMovimiento =
                    "ENTRADA",

                Cantidad =
                    request.Cantidad,

                Motivo =
                    string.IsNullOrWhiteSpace(
                        request.Motivo
                    )
                        ? "Entrada de inventario"
                        : request.Motivo.Trim(),

                FechaMovimiento =
                    DateTime.Now
            };

        _context.MovimientoInventarios
            .Add(movimiento);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Entrada registrada correctamente.",

            producto =
                producto.Nombre,

            cantidad =
                request.Cantidad,

            stockActual =
                producto.StockActual
        });
    }

    // =========================================================
    // POST /api/inventario/entrada-multiple
    // NUEVA ENTRADA MÚLTIPLE
    // =========================================================

    [HttpPost("entrada-multiple")]
    public async Task<IActionResult> RegistrarEntradaMultiple(
        RegistrarEntradaMultipleRequest request)
    {
        if (request.Productos == null ||
            request.Productos.Count == 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "Debes agregar al menos un producto."
            });
        }

        // =====================================================
        // VALIDAR CANTIDADES
        // =====================================================

        if (request.Productos.Any(
            p => p.Cantidad <= 0))
        {
            return BadRequest(new
            {
                mensaje =
                    "Todas las cantidades deben ser mayores a cero."
            });
        }

        // =====================================================
        // VALIDAR PRODUCTOS REPETIDOS
        // =====================================================

        var productosRepetidos =
            request.Productos
                .GroupBy(p => p.IdProducto)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();

        if (productosRepetidos.Count > 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "No puedes agregar el mismo producto más de una vez.",

                productos =
                    productosRepetidos
            });
        }

        var idsProductos =
            request.Productos
                .Select(p => p.IdProducto)
                .ToList();

        // =====================================================
        // OBTENER PRODUCTOS
        // =====================================================

        var productos = await _context.Productos
            .Where(p =>
                idsProductos.Contains(
                    p.IdProducto
                )
            )
            .ToListAsync();

        if (productos.Count !=
            idsProductos.Count)
        {
            var encontrados =
                productos
                    .Select(p => p.IdProducto);

            var faltantes =
                idsProductos
                    .Except(encontrados)
                    .ToList();

            return BadRequest(new
            {
                mensaje =
                    "Uno o más productos no existen.",

                productos =
                    faltantes
            });
        }

        foreach (var producto in productos)
        {
            if (!producto.Activo)
            {
                return BadRequest(new
                {
                    mensaje =
                        $"El producto '{producto.Nombre}' no está activo."
                });
            }
        }

        var motivo =
            string.IsNullOrWhiteSpace(
                request.Motivo
            )
                ? "Producción nueva"
                : request.Motivo.Trim();

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var resultado =
                new List<object>();

            foreach (var item in request.Productos)
            {
                var producto =
                    productos.Single(
                        p =>
                            p.IdProducto ==
                            item.IdProducto
                    );

                var stockAnterior =
                    producto.StockActual;

                producto.StockActual +=
                    item.Cantidad;

                var movimiento =
                    new MovimientoInventario
                    {
                        IdProducto =
                            producto.IdProducto,

                        IdVenta =
                            null,

                        TipoMovimiento =
                            "ENTRADA",

                        Cantidad =
                            item.Cantidad,

                        Motivo =
                            motivo,

                        FechaMovimiento =
                            DateTime.Now
                    };

                _context.MovimientoInventarios
                    .Add(movimiento);

                resultado.Add(new
                {
                    idProducto =
                        producto.IdProducto,

                    producto =
                        producto.Nombre,

                    cantidad =
                        item.Cantidad,

                    stockAnterior,

                    stockActual =
                        producto.StockActual
                });
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    "Entrada múltiple registrada correctamente.",

                totalProductos =
                    request.Productos.Count,

                totalBolsas =
                    request.Productos.Sum(
                        p => p.Cantidad
                    ),

                motivo,

                productos =
                    resultado
            });
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    // =========================================================
    // POST /api/inventario/ajuste
    // =========================================================

    [HttpPost("ajuste")]
    public async Task<IActionResult> RegistrarAjuste(
        RegistrarAjusteRequest request)
    {
        if (request.Cantidad <= 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "La cantidad debe ser mayor a cero."
            });
        }

        var tipo =
            request.Tipo
                .Trim()
                .ToUpperInvariant();

        if (tipo != "SUMAR" &&
            tipo != "RESTAR")
        {
            return BadRequest(new
            {
                mensaje =
                    "El tipo debe ser SUMAR o RESTAR."
            });
        }

        var producto = await _context.Productos
            .FirstOrDefaultAsync(
                p =>
                    p.IdProducto ==
                    request.IdProducto
            );

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Producto no encontrado."
            });
        }

        if (tipo == "RESTAR" &&
            producto.StockActual <
            request.Cantidad)
        {
            return BadRequest(new
            {
                mensaje =
                    "No hay suficiente inventario para realizar el ajuste."
            });
        }

        if (tipo == "SUMAR")
        {
            producto.StockActual +=
                request.Cantidad;
        }
        else
        {
            producto.StockActual -=
                request.Cantidad;
        }

        var movimiento =
            new MovimientoInventario
            {
                IdProducto =
                    producto.IdProducto,

                IdVenta =
                    null,

                TipoMovimiento =
                    "AJUSTE",

                Cantidad =
                    request.Cantidad,

                Motivo =
                    $"{tipo}: {request.Motivo}",

                FechaMovimiento =
                    DateTime.Now
            };

        _context.MovimientoInventarios
            .Add(movimiento);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Ajuste registrado correctamente.",

            producto =
                producto.Nombre,

            stockActual =
                producto.StockActual
        });
    }
}

// =============================================================
// REQUESTS
// =============================================================

public class RegistrarMovimientoRequest
{
    public int IdProducto { get; set; }

    public int Cantidad { get; set; }

    public string? Motivo { get; set; }
}

public class RegistrarEntradaMultipleRequest
{
    public List<EntradaInventarioItemRequest>
        Productos { get; set; } = [];

    public string? Motivo { get; set; }
}

public class EntradaInventarioItemRequest
{
    public int IdProducto { get; set; }

    public int Cantidad { get; set; }
}

public class RegistrarAjusteRequest
{
    public int IdProducto { get; set; }

    public int Cantidad { get; set; }

    public string Tipo { get; set; }
        = string.Empty;

    public string Motivo { get; set; }
        = string.Empty;
}