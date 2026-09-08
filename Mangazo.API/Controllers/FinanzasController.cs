using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinanzasController : ControllerBase
{
    private readonly MangazoDbContext _context;

    public FinanzasController(MangazoDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // RESUMEN FINANCIERO
    // =========================================================

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var movimientos = await _context.MovimientosFinancieros
            .AsNoTracking()
            .OrderByDescending(m => m.FechaMovimiento)
            .ToListAsync();

        var entradas = movimientos
            .Where(m =>
                m.Tipo == "VENTA" ||
                m.Tipo == "APORTACION" ||
                m.Tipo == "AJUSTE_ENTRADA"
            )
            .Sum(m => m.Monto);

        var salidas = movimientos
            .Where(m =>
                m.Tipo == "GASTO" ||
                m.Tipo == "COMPRA_INVENTARIO" ||
                m.Tipo == "RETIRO" ||
                m.Tipo == "AJUSTE_SALIDA"
            )
            .Sum(m => m.Monto);

        var saldoCalculado = entradas - salidas;

        var saldoReal = await _context.Finanzas
            .AsNoTracking()
            .OrderByDescending(f => f.FechaActualizacion)
            .FirstOrDefaultAsync();

        decimal? diferencia = null;

        if (saldoReal != null)
        {
            diferencia =
                saldoReal.SaldoCuenta -
                saldoCalculado;
        }

        var ultimosMovimientos = movimientos
            .Take(10)
            .Select(m => new
            {
                m.IdMovimientoFinanciero,
                m.Tipo,
                m.Concepto,
                m.Monto,
                m.FechaMovimiento,
                m.IdVenta,
                m.IdGasto,
                m.Observaciones
            })
            .ToList();

        return Ok(new
        {
            entradas,
            salidas,
            saldoCalculado,

            saldoReal = saldoReal?.SaldoCuenta,

            fechaSaldoReal =
                saldoReal?.FechaActualizacion,

            diferencia,

            ultimosMovimientos
        });
    }
}