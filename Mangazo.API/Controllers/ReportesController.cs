using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        // GASTOS
        // =====================================================

        var gastos = await _context.Gastos
            .AsNoTracking()
            .Where(g =>
                g.FechaGasto >= fechaDesde &&
                g.FechaGasto < fechaHastaExclusiva
            )
            .ToListAsync();

        // =====================================================
        // RESUMEN FINANCIERO
        // =====================================================

        var ingresos =
            ventas.Sum(v => v.TotalVenta);

        var costoProducto =
            detalles.Sum(d => d.CostoTotal);

        var utilidadBruta =
            detalles.Sum(d => d.GananciaBruta);

        var totalGastos =
            gastos.Sum(g => g.Monto);

        var utilidadNeta =
            utilidadBruta - totalGastos;

        var bolsasVendidas =
            detalles.Sum(d => d.Cantidad);

        var ticketPromedio =
            ventas.Count > 0
                ? ingresos / ventas.Count
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
        // GASTOS POR CATEGORÍA
        // =====================================================

        var gastosCategoria =
            gastos
                .GroupBy(g => g.Categoria)
                .Select(g => new
                {
                    categoria = g.Key,

                    total =
                        g.Sum(x => x.Monto)
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

                gastos =
                    totalGastos,

                utilidadNeta,

                margenNeto,

                bolsasVendidas,

                ticketPromedio
            },

            productoEstrella =
                productos.FirstOrDefault(),

            productos,

            metodosPago,

            gastosCategoria
        });
    }
}