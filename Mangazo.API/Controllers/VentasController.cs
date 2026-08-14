using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;
using Mangazo.API.DTOs;
using Mangazo.API.Models;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VentasController : ControllerBase
{
    private readonly MangazoDbContext _context;

    public VentasController(MangazoDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: /api/ventas
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetVentas()
    {
        var ventas = await _context.Ventas
            .AsNoTracking()
            .OrderByDescending(v => v.FechaVenta)
            .ThenByDescending(v => v.IdVenta)
            .Select(v => new
            {
                v.IdVenta,
                v.FechaVenta,
                v.MetodoPago,
                v.TotalVenta,
                v.Estado,

                Productos = v.DetalleVenta.Select(d => new
                {
                    d.IdProducto,
                    Nombre = d.IdProductoNavigation.Nombre,
                    d.Cantidad,
                    d.PrecioUnitario,
                    d.CostoUnitario,
                    d.Subtotal,
                    d.CostoTotal,
                    d.GananciaBruta
                }).ToList()
            })
            .ToListAsync();

        return Ok(ventas);
    }

    // =========================================================
    // GET: /api/ventas/{id}
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetVenta(int id)
    {
        var venta = await _context.Ventas
            .AsNoTracking()
            .Where(v => v.IdVenta == id)
            .Select(v => new
            {
                v.IdVenta,
                v.FechaVenta,
                v.MetodoPago,
                v.TotalVenta,
                v.Estado,

                Productos = v.DetalleVenta.Select(d => new
                {
                    d.IdProducto,
                    Nombre = d.IdProductoNavigation.Nombre,
                    d.Cantidad,
                    d.PrecioUnitario,
                    d.CostoUnitario,
                    d.Subtotal,
                    d.CostoTotal,
                    d.GananciaBruta
                }).ToList(),

                GananciaBruta =
                    v.DetalleVenta
                        .Sum(d => (decimal?)d.GananciaBruta) ?? 0
            })
            .FirstOrDefaultAsync();

        if (venta == null)
        {
            return NotFound(new
            {
                mensaje = $"No existe la venta #{id}."
            });
        }

        return Ok(venta);
    }

    // =========================================================
    // POST: /api/ventas
    // REGISTRAR NUEVA VENTA
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CrearVenta(
        NuevaVentaRequest request)
    {
        if (request.Productos == null ||
            request.Productos.Count == 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "La venta debe contener al menos un producto."
            });
        }

        if (string.IsNullOrWhiteSpace(request.MetodoPago))
        {
            return BadRequest(new
            {
                mensaje =
                    "El método de pago es obligatorio."
            });
        }

        var metodoPago = request.MetodoPago
            .Trim()
            .ToUpperInvariant();

        if (metodoPago != "EFECTIVO" &&
            metodoPago != "TRANSFERENCIA")
        {
            return BadRequest(new
            {
                mensaje =
                    "Método de pago inválido."
            });
        }

        // Agrupar si el mismo producto viene repetido.
        var items = request.Productos
            .GroupBy(x => x.IdProducto)
            .Select(g => new
            {
                IdProducto = g.Key,
                Cantidad = g.Sum(x => x.Cantidad)
            })
            .ToList();

        if (items.Any(x => x.Cantidad <= 0))
        {
            return BadRequest(new
            {
                mensaje =
                    "Las cantidades deben ser mayores a cero."
            });
        }

        var idsProductos = items
            .Select(x => x.IdProducto)
            .ToList();

        var productos = await _context.Productos
            .Where(p =>
                idsProductos.Contains(p.IdProducto))
            .ToListAsync();

        // =====================================================
        // VALIDAR PRODUCTOS
        // =====================================================

        if (productos.Count != idsProductos.Count)
        {
            var encontrados =
                productos.Select(p => p.IdProducto);

            var faltantes =
                idsProductos
                    .Except(encontrados)
                    .ToList();

            return BadRequest(new
            {
                mensaje =
                    "Uno o más productos no existen.",

                productos = faltantes
            });
        }

        // =====================================================
        // VALIDAR STOCK
        // =====================================================

        foreach (var item in items)
        {
            var producto = productos
                .Single(p =>
                    p.IdProducto == item.IdProducto);

            if (!producto.Activo)
            {
                return BadRequest(new
                {
                    mensaje =
                        $"El producto '{producto.Nombre}' no está activo."
                });
            }

            if (producto.StockActual < item.Cantidad)
            {
                return BadRequest(new
                {
                    mensaje =
                        $"Inventario insuficiente para '{producto.Nombre}'.",

                    solicitado = item.Cantidad,

                    disponible =
                        producto.StockActual
                });
            }
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            // =================================================
            // CALCULAR TOTAL DE LA VENTA
            // =================================================

            decimal totalVenta = 0;

            foreach (var item in items)
            {
                var producto = productos
                    .Single(p =>
                        p.IdProducto ==
                        item.IdProducto);

                totalVenta +=
                    producto.PrecioVenta *
                    item.Cantidad;
            }

            // =================================================
            // CREAR ENCABEZADO
            // =================================================

            var venta = new Venta
            {
                FechaVenta = DateTime.Now,

                MetodoPago =
                    metodoPago,

                TotalVenta =
                    totalVenta,

                Estado =
                    "COMPLETADA"
            };

            _context.Ventas.Add(venta);

            // Necesitamos el Identity IdVenta.
            await _context.SaveChangesAsync();

            // =================================================
            // DETALLE + INVENTARIO
            // =================================================

            foreach (var item in items)
            {
                var producto = productos
                    .Single(p =>
                        p.IdProducto ==
                        item.IdProducto);

                /*
                 * IMPORTANTE:
                 *
                 * Subtotal
                 * CostoTotal
                 * GananciaBruta
                 *
                 * NO SE ASIGNAN.
                 *
                 * SQL Server las calcula automáticamente.
                 */

                var detalle = new DetalleVentum
                {
                    IdVenta =
                        venta.IdVenta,

                    IdProducto =
                        producto.IdProducto,

                    Cantidad =
                        item.Cantidad,

                    PrecioUnitario =
                        producto.PrecioVenta,

                    CostoUnitario =
                        producto.CostoActual
                };

                _context.DetalleVenta
                    .Add(detalle);

                // =============================================
                // MOVIMIENTO DE INVENTARIO
                // =============================================

                var movimiento =
                    new MovimientoInventario
                    {
                        IdProducto =
                            producto.IdProducto,

                        IdVenta =
                            venta.IdVenta,

                        TipoMovimiento =
                            "SALIDA",

                        Cantidad =
                            item.Cantidad,

                        Motivo =
                            $"Venta #{venta.IdVenta}",

                        FechaMovimiento =
                            DateTime.Now
                    };

                _context.MovimientoInventarios
                    .Add(movimiento);

                // =============================================
                // DESCONTAR STOCK
                // =============================================

                producto.StockActual -=
                    item.Cantidad;
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    "Venta registrada correctamente.",

                idVenta =
                    venta.IdVenta,

                fechaVenta =
                    venta.FechaVenta,

                metodoPago =
                    venta.MetodoPago,

                totalVenta =
                    venta.TotalVenta,

                productos =
                    items
            });
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    // =========================================================
    // PUT: /api/ventas/{id}
    // MODIFICAR UNA VENTA
    // =========================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> ModificarVenta(
        int id,
        NuevaVentaRequest request)
    {
        if (request.Productos == null ||
            request.Productos.Count == 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "La venta debe contener al menos un producto."
            });
        }

        if (string.IsNullOrWhiteSpace(request.MetodoPago))
        {
            return BadRequest(new
            {
                mensaje =
                    "El método de pago es obligatorio."
            });
        }

        var metodoPago = request.MetodoPago
            .Trim()
            .ToUpperInvariant();

        if (metodoPago != "EFECTIVO" &&
            metodoPago != "TRANSFERENCIA")
        {
            return BadRequest(new
            {
                mensaje =
                    "Método de pago inválido."
            });
        }

        var nuevosItems = request.Productos
            .GroupBy(x => x.IdProducto)
            .Select(g => new
            {
                IdProducto = g.Key,

                Cantidad =
                    g.Sum(x => x.Cantidad)
            })
            .ToList();

        if (nuevosItems.Any(x => x.Cantidad <= 0))
        {
            return BadRequest(new
            {
                mensaje =
                    "Las cantidades deben ser mayores a cero."
            });
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            // =================================================
            // OBTENER VENTA ORIGINAL
            // =================================================

            var venta = await _context.Ventas
                .Include(v => v.DetalleVenta)
                .ThenInclude(d =>
                    d.IdProductoNavigation)
                .FirstOrDefaultAsync(v =>
                    v.IdVenta == id);

            if (venta == null)
            {
                await transaction.RollbackAsync();

                return NotFound(new
                {
                    mensaje =
                        $"No existe la venta #{id}."
                });
            }

            if (venta.Estado != "COMPLETADA")
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    mensaje =
                        "Solo se pueden modificar ventas COMPLETADAS."
                });
            }

            // =================================================
            // COPIA DEL DETALLE ANTERIOR
            // =================================================

            var detalleAnterior =
                venta.DetalleVenta
                    .Select(d => new
                    {
                        d.IdProducto,

                        d.Cantidad
                    })
                    .ToList();

            // =================================================
            // REGRESAR INVENTARIO ORIGINAL
            // =================================================

            foreach (
                var detalle in venta.DetalleVenta)
            {
                detalle
                    .IdProductoNavigation
                    .StockActual +=
                    detalle.Cantidad;
            }

            // =================================================
            // NUEVOS PRODUCTOS
            // =================================================

            var idsProductos =
                nuevosItems
                    .Select(x =>
                        x.IdProducto)
                    .ToList();

            var productos =
                await _context.Productos
                    .Where(p =>
                        idsProductos.Contains(
                            p.IdProducto
                        )
                    )
                    .ToListAsync();

            if (productos.Count !=
                idsProductos.Count)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    mensaje =
                        "Uno o más productos no existen."
                });
            }

            // =================================================
            // VALIDAR PRODUCTOS Y STOCK
            // =================================================

            foreach (var item in nuevosItems)
            {
                var producto =
                    productos.Single(p =>
                        p.IdProducto ==
                        item.IdProducto);

                if (!producto.Activo)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        mensaje =
                            $"El producto '{producto.Nombre}' no está activo."
                    });
                }

                if (producto.StockActual <
                    item.Cantidad)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        mensaje =
                            $"Inventario insuficiente para '{producto.Nombre}'.",

                        solicitado =
                            item.Cantidad,

                        disponible =
                            producto.StockActual
                    });
                }
            }

            // =================================================
            // REGISTRAR DEVOLUCIÓN DEL DETALLE ANTERIOR
            // =================================================

            foreach (
                var detalle in detalleAnterior)
            {
                var movimiento =
                    new MovimientoInventario
                    {
                        IdProducto =
                            detalle.IdProducto,

                        IdVenta =
                            venta.IdVenta,

                        TipoMovimiento =
                            "ENTRADA",

                        Cantidad =
                            detalle.Cantidad,

                        Motivo =
                            $"Corrección Venta #{venta.IdVenta} - devolución detalle anterior",

                        FechaMovimiento =
                            DateTime.Now
                    };

                _context.MovimientoInventarios
                    .Add(movimiento);
            }

            // =================================================
            // BORRAR DETALLE ANTERIOR
            // =================================================

            _context.DetalleVenta
                .RemoveRange(
                    venta.DetalleVenta
                );

            decimal totalVenta = 0;

            // =================================================
            // NUEVO DETALLE
            // =================================================

            foreach (var item in nuevosItems)
            {
                var producto =
                    productos.Single(p =>
                        p.IdProducto ==
                        item.IdProducto);

                decimal subtotal =
                    producto.PrecioVenta *
                    item.Cantidad;

                totalVenta += subtotal;

                /*
                 * Igual que al crear venta:
                 *
                 * NO mandamos:
                 * Subtotal
                 * CostoTotal
                 * GananciaBruta
                 *
                 * porque son columnas calculadas.
                 */

                var detalle =
                    new DetalleVentum
                    {
                        IdVenta =
                            venta.IdVenta,

                        IdProducto =
                            producto.IdProducto,

                        Cantidad =
                            item.Cantidad,

                        PrecioUnitario =
                            producto.PrecioVenta,

                        CostoUnitario =
                            producto.CostoActual
                    };

                _context.DetalleVenta
                    .Add(detalle);

                // =============================================
                // DESCONTAR NUEVO STOCK
                // =============================================

                producto.StockActual -=
                    item.Cantidad;

                // =============================================
                // NUEVO MOVIMIENTO
                // =============================================

                var movimiento =
                    new MovimientoInventario
                    {
                        IdProducto =
                            producto.IdProducto,

                        IdVenta =
                            venta.IdVenta,

                        TipoMovimiento =
                            "SALIDA",

                        Cantidad =
                            item.Cantidad,

                        Motivo =
                            $"Corrección Venta #{venta.IdVenta} - nuevo detalle",

                        FechaMovimiento =
                            DateTime.Now
                    };

                _context.MovimientoInventarios
                    .Add(movimiento);
            }

            // =================================================
            // ACTUALIZAR ENCABEZADO
            // =================================================

            venta.MetodoPago =
                metodoPago;

            venta.TotalVenta =
                totalVenta;

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    $"Venta #{venta.IdVenta} modificada correctamente.",

                idVenta =
                    venta.IdVenta,

                totalVenta =
                    venta.TotalVenta,

                metodoPago =
                    venta.MetodoPago
            });
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    // =========================================================
    // POST: /api/ventas/{id}/cancelar
    // =========================================================

    [HttpPost("{id:int}/cancelar")]
    public async Task<IActionResult> CancelarVenta(
        int id)
    {
        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var venta =
                await _context.Ventas
                    .Include(v =>
                        v.DetalleVenta)
                    .ThenInclude(d =>
                        d.IdProductoNavigation)
                    .FirstOrDefaultAsync(v =>
                        v.IdVenta == id);

            if (venta == null)
            {
                await transaction.RollbackAsync();

                return NotFound(new
                {
                    mensaje =
                        $"No existe la venta #{id}."
                });
            }

            if (venta.Estado == "CANCELADA")
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    mensaje =
                        $"La venta #{id} ya está cancelada."
                });
            }

            if (venta.Estado != "COMPLETADA")
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    mensaje =
                        $"La venta #{id} no puede cancelarse porque su estado es {venta.Estado}."
                });
            }

            // =================================================
            // DEVOLVER INVENTARIO
            // =================================================

            foreach (
                var detalle in venta.DetalleVenta)
            {
                var producto =
                    detalle.IdProductoNavigation;

                producto.StockActual +=
                    detalle.Cantidad;

                var movimiento =
                    new MovimientoInventario
                    {
                        IdProducto =
                            producto.IdProducto,

                        IdVenta =
                            venta.IdVenta,

                        TipoMovimiento =
                            "ENTRADA",

                        Cantidad =
                            detalle.Cantidad,

                        Motivo =
                            $"Cancelación Venta #{venta.IdVenta}",

                        FechaMovimiento =
                            DateTime.Now
                    };

                _context.MovimientoInventarios
                    .Add(movimiento);
            }

            venta.Estado =
                "CANCELADA";

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    $"Venta #{venta.IdVenta} cancelada correctamente.",

                idVenta =
                    venta.IdVenta,

                estado =
                    venta.Estado
            });
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }
}