using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly MangazoDbContext _context;

    public DashboardController(MangazoDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: /api/dashboard
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var hoy = DateTime.Today;

        var inicioMes = new DateTime(
            hoy.Year,
            hoy.Month,
            1
        );

        var inicioMesSiguiente =
            inicioMes.AddMonths(1);

        // =====================================================
        // VENTAS COMPLETADAS DEL MES
        // =====================================================

        var ventasMes = await _context.Ventas
            .AsNoTracking()
            .Where(v =>
                v.Estado == "COMPLETADA" &&
                v.FechaVenta >= inicioMes &&
                v.FechaVenta < inicioMesSiguiente
            )
            .ToListAsync();

        // =====================================================
        // VENTAS DE HOY
        // =====================================================

        var ventasHoy = ventasMes
            .Where(v =>
                v.FechaVenta.Date == hoy
            )
            .ToList();

        var ingresosMes = ventasMes.Sum(
            v => v.TotalVenta
        );

        var ingresosHoy = ventasHoy.Sum(
            v => v.TotalVenta
        );

        var numeroVentasMes =
            ventasMes.Count;

        var numeroVentasHoy =
            ventasHoy.Count;

        var ticketPromedio =
            numeroVentasMes > 0
                ? ingresosMes / numeroVentasMes
                : 0;

        // =====================================================
        // DETALLE DE VENTAS DEL MES
        // =====================================================

        var detallesMes = await _context.DetalleVenta
            .AsNoTracking()
            .Where(d =>
                d.IdVentaNavigation.Estado == "COMPLETADA" &&
                d.IdVentaNavigation.FechaVenta >= inicioMes &&
                d.IdVentaNavigation.FechaVenta < inicioMesSiguiente
            )
            .Select(d => new
            {
                d.IdProducto,

                Producto =
                    d.IdProductoNavigation.Nombre,

                d.Cantidad,
                d.CostoTotal,
                d.GananciaBruta,

                FechaVenta =
                    d.IdVentaNavigation.FechaVenta
            })
            .ToListAsync();

        // =====================================================
        // BOLSAS VENDIDAS
        // =====================================================

        var bolsasVendidas =
            detallesMes.Sum(
                d => d.Cantidad
            );

        // =====================================================
        // COSTO DE PRODUCTO VENDIDO
        // =====================================================

        var costoProductoVendido =
            detallesMes.Sum(
                d => d.CostoTotal
            );

        // =====================================================
        // UTILIDAD BRUTA
        // =====================================================

        var utilidadBruta =
            detallesMes.Sum(
                d => d.GananciaBruta
            );

        // =====================================================
        // GASTOS DEL MES
        // =====================================================

        var gastosMes = await _context.Gastos
            .AsNoTracking()
            .Where(g =>
                g.FechaGasto >= inicioMes &&
                g.FechaGasto < inicioMesSiguiente
            )
            .SumAsync(g =>
                (decimal?)g.Monto
            ) ?? 0;

        // =====================================================
        // UTILIDAD NETA
        // =====================================================

        var utilidadNeta =
            utilidadBruta - gastosMes;

        // =====================================================
        // MÁRGENES
        // =====================================================

        var margenBruto =
            ingresosMes > 0
                ? (utilidadBruta / ingresosMes) * 100
                : 0;

        var margenNeto =
            ingresosMes > 0
                ? (utilidadNeta / ingresosMes) * 100
                : 0;

        // =====================================================
        // PRODUCTO ESTRELLA
        // =====================================================

        var productoEstrella =
            detallesMes
                .GroupBy(d => new
                {
                    d.IdProducto,
                    d.Producto
                })
                .Select(g => new
                {
                    IdProducto =
                        g.Key.IdProducto,

                    Producto =
                        g.Key.Producto,

                    Cantidad =
                        g.Sum(x =>
                            x.Cantidad
                        )
                })
                .OrderByDescending(x =>
                    x.Cantidad
                )
                .FirstOrDefault();

        // =====================================================
        // INVENTARIO
        // =====================================================

        var productos = await _context.Productos
            .AsNoTracking()
            .Where(p => p.Activo)
            .Select(p => new
            {
                p.IdProducto,
                p.Nombre,
                p.StockActual,
                p.CostoActual
            })
            .ToListAsync();

        var stockTotal =
            productos.Sum(
                p => p.StockActual
            );

        // Por ahora consideramos stock bajo <= 5.
        var productosStockBajo =
            productos.Count(
                p => p.StockActual <= 5
            );

        var valorInventario =
            productos.Sum(
                p =>
                    p.StockActual *
                    p.CostoActual
            );

        // =====================================================
        // VENTAS DE LOS ÚLTIMOS 7 DÍAS
        // =====================================================

        var haceSieteDias =
            hoy.AddDays(-6);

        var inicioManana =
            hoy.AddDays(1);

        var ventasUltimosSieteDias =
            await _context.Ventas
                .AsNoTracking()
                .Where(v =>
                    v.Estado == "COMPLETADA" &&
                    v.FechaVenta >= haceSieteDias &&
                    v.FechaVenta < inicioManana
                )
                .Select(v => new
                {
                    v.FechaVenta,
                    v.TotalVenta
                })
                .ToListAsync();

        // Creamos siempre los 7 días,
        // aunque alguno tenga $0 en ventas.

        var ventasPorDia =
            Enumerable
                .Range(0, 7)
                .Select(i =>
                {
                    var fecha =
                        haceSieteDias.AddDays(i);

                    var fechaSiguiente =
                        fecha.AddDays(1);

                    var total =
                        ventasUltimosSieteDias
                            .Where(v =>
                                v.FechaVenta >= fecha &&
                                v.FechaVenta < fechaSiguiente
                            )
                            .Sum(v =>
                                v.TotalVenta
                            );

                    return new
                    {
                        Fecha = fecha,
                        Total = total
                    };
                })
                .ToList();

        // =====================================================
        // RESPUESTA
        // =====================================================

        return Ok(new
        {
            periodo = new
            {
                inicio = inicioMes,

                fin =
                    inicioMesSiguiente
                        .AddDays(-1)
            },

            hoy = new
            {
                ventas =
                    numeroVentasHoy,

                ingresos =
                    ingresosHoy
            },

            mes = new
            {
                ventas =
                    numeroVentasMes,

                ingresos =
                    ingresosMes,

                bolsasVendidas,

                costoProductoVendido,

                utilidadBruta,

                gastos =
                    gastosMes,

                utilidadNeta,

                margenBruto,

                margenNeto,

                ticketPromedio
            },

            inventario = new
            {
                stockTotal,

                productosStockBajo,

                valorInventario
            },

            productoEstrella,

            ventasUltimos7Dias =
                ventasPorDia
        });
    }
}