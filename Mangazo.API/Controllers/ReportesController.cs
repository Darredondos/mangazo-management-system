using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;
using Microsoft.AspNetCore.Authorization;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportesController : ControllerBase
{
    private readonly MangazoDbContext _context;

    public ReportesController(MangazoDbContext context)
    {
        _context = context;
    }

    // GET /api/reportes
    // GET /api/reportes?desde=2026-08-01&hasta=2026-08-31
    [HttpGet]
    public async Task<IActionResult> GetReporte(
        DateTime? desde,
        DateTime? hasta)
    {
        var fechaDesde =
            desde?.Date ??
            new DateTime(
                DateTime.Today.Year,
                DateTime.Today.Month,
                1
            );

        // Sumamos un día para incluir completo el día "hasta".
        var fechaHastaExclusiva =
            hasta?.Date.AddDays(1) ??
            DateTime.Today.AddDays(1);

        // =====================================================
        // VENTAS COMPLETADAS
        // =====================================================

        var ventas = await _context.Ventas
            .AsNoTracking()
            .Where(v =>
                v.Estado == "COMPLETADA" &&
                v.FechaVenta >= fechaDesde &&
                v.FechaVenta < fechaHastaExclusiva
            )
            .ToListAsync();

        // =====================================================
        // DETALLE DE VENTAS
        // =====================================================

        var detalles = await _context.DetalleVenta
            .AsNoTracking()
            .Where(d =>
                d.IdVentaNavigation.Estado == "COMPLETADA" &&
                d.IdVentaNavigation.FechaVenta >= fechaDesde &&
                d.IdVentaNavigation.FechaVenta < fechaHastaExclusiva
            )
            .Select(d => new
            {
                d.IdProducto,

                Producto =
                    d.IdProductoNavigation.Nombre,

                d.Cantidad,

                d.Subtotal,

                d.CostoTotal,

                d.GananciaBruta
            })
            .ToListAsync();

        // =====================================================
        // GASTOS / SALIDAS
        // =====================================================

        var gastos = await _context.Gastos
            .AsNoTracking()
            .Where(g =>
                g.FechaGasto >= fechaDesde &&
                g.FechaGasto < fechaHastaExclusiva
            )
            .ToListAsync();

        // =====================================================
        // CLASIFICACIÓN DE GASTOS
        // =====================================================

        // Estas categorías representan compras que se convierten
        // en producto o inventario.
        //
        // No deben descontarse otra vez de la utilidad neta,
        // porque el costo de lo que ya se vendió está reflejado
        // en DetalleVenta.CostoTotal.
        var categoriasInventario = new[]
        {
            "PRODUCTOS",
            "EMPAQUE",
            "ETIQUETAS"
        };

        var comprasInventario =
            gastos
                .Where(g =>
                    categoriasInventario.Contains(
                        (g.Categoria ?? string.Empty)
                            .Trim()
                            .ToUpper()
                    )
                )
                .Sum(g => g.Monto);

        // Todo lo que NO sea inventario se considera gasto operativo.
        //
        // Actualmente aquí entraría PUBLICIDAD.
        // En el futuro también podrían entrar:
        // GASOLINA, SERVICIOS, COMISIONES, etc.
        var gastosOperativos =
            gastos
                .Where(g =>
                    !categoriasInventario.Contains(
                        (g.Categoria ?? string.Empty)
                            .Trim()
                            .ToUpper()
                    )
                )
                .Sum(g => g.Monto);

        // Total de dinero que salió del negocio durante el periodo.
        // Este dato sirve para flujo de efectivo,
        // NO para calcular directamente la utilidad.
        var totalSalidas =
            gastos.Sum(g => g.Monto);

        // =====================================================
        // RESUMEN FINANCIERO
        // =====================================================

        var ingresos =
            ventas.Sum(v => v.TotalVenta);

        // Costo únicamente de los productos YA vendidos.
        var costoProducto =
            detalles.Sum(d => d.CostoTotal);

        // Ingresos menos costo del producto vendido.
        var utilidadBruta =
            detalles.Sum(d => d.GananciaBruta);

        // Utilidad real del periodo.
        //
        // No volvemos a descontar compras de producto,
        // empaques ni etiquetas.
        var utilidadNeta =
            utilidadBruta - gastosOperativos;

        var bolsasVendidas =
            detalles.Sum(d => d.Cantidad);

        var ticketPromedio =
            ventas.Count > 0
                ? ingresos / ventas.Count
                : 0;

        var margenBruto =
            ingresos > 0
                ? (utilidadBruta / ingresos) * 100
                : 0;

        var margenNeto =
            ingresos > 0
                ? (utilidadNeta / ingresos) * 100
                : 0;

        // =====================================================
        // PRODUCTOS
        // =====================================================

        var productos =
            detalles
                .GroupBy(d => new
                {
                    d.IdProducto,
                    d.Producto
                })
                .Select(g => new
                {
                    idProducto =
                        g.Key.IdProducto,

                    producto =
                        g.Key.Producto,

                    cantidad =
                        g.Sum(x => x.Cantidad),

                    ventas =
                        g.Sum(x => x.Subtotal),

                    costo =
                        g.Sum(x => x.CostoTotal),

                    ganancia =
                        g.Sum(x => x.GananciaBruta)
                })
                .OrderByDescending(x => x.cantidad)
                .ToList();

        // =====================================================
        // MÉTODOS DE PAGO
        // =====================================================

        var metodosPago =
            ventas
                .GroupBy(v => v.MetodoPago)
                .Select(g => new
                {
                    metodo = g.Key,

                    ventas = g.Count(),

                    total =
                        g.Sum(x => x.TotalVenta)
                })
                .OrderByDescending(x => x.total)
                .ToList();

        // =====================================================
        // SALIDAS POR CATEGORÍA
        // =====================================================

        var gastosCategoria =
            gastos
                .GroupBy(g => g.Categoria)
                .Select(g => new
                {
                    categoria = g.Key,

                    total =
                        g.Sum(x => x.Monto),

                    tipo =
                        categoriasInventario.Contains(
                            (g.Key ?? string.Empty)
                                .Trim()
                                .ToUpper()
                        )
                            ? "INVENTARIO"
                            : "OPERATIVO"
                })
                .OrderByDescending(x => x.total)
                .ToList();

        // =====================================================
        // RESPUESTA
        // =====================================================

        return Ok(new
        {
            periodo = new
            {
                desde = fechaDesde,

                hasta =
                    fechaHastaExclusiva.AddDays(-1)
            },

            resumen = new
            {
                ventas =
                    ventas.Count,

                ingresos,

                costoProducto,

                utilidadBruta,

                margenBruto,

                // Gastos que sí afectan directamente
                // la utilidad neta.
                gastosOperativos,

                utilidadNeta,

                margenNeto,

                bolsasVendidas,

                ticketPromedio,

                // Información de flujo.
                comprasInventario,

                totalSalidas
            },

            productoEstrella =
                productos.FirstOrDefault(),

            productos,

            metodosPago,

            gastosCategoria
        });
    }
}