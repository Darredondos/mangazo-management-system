using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;
using Mangazo.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GastosController : ControllerBase
{
    private readonly MangazoDbContext _context;

    private static readonly string[] CategoriasInventario =
    {
        "PRODUCTOS",
        "EMPAQUE",
        "ETIQUETAS"
    };

    public GastosController(MangazoDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET /api/gastos
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetGastos()
    {
        var gastos = await _context.Gastos
            .AsNoTracking()
            .OrderByDescending(g => g.FechaGasto)
            .ThenByDescending(g => g.IdGasto)
            .Select(g => new
            {
                g.IdGasto,
                g.Concepto,
                g.Descripcion,
                g.Categoria,
                g.Monto,
                g.FechaGasto
            })
            .ToListAsync();

        return Ok(gastos);
    }

    // =========================================================
    // GET /api/gastos/{id}
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetGasto(int id)
    {
        var gasto = await _context.Gastos
            .AsNoTracking()
            .FirstOrDefaultAsync(g =>
                g.IdGasto == id);

        if (gasto == null)
        {
            return NotFound(new
            {
                mensaje =
                    $"No existe el gasto #{id}."
            });
        }

        return Ok(gasto);
    }

    // =========================================================
    // POST /api/gastos
    // CREAR GASTO
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CrearGasto(
        CrearGastoRequest request)
    {
        if (string.IsNullOrWhiteSpace(
            request.Concepto))
        {
            return BadRequest(new
            {
                mensaje =
                    "El concepto es obligatorio."
            });
        }

        if (string.IsNullOrWhiteSpace(
            request.Categoria))
        {
            return BadRequest(new
            {
                mensaje =
                    "La categoría es obligatoria."
            });
        }

        if (request.Monto <= 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "El monto debe ser mayor a cero."
            });
        }

        var categoria = request.Categoria
            .Trim()
            .ToUpperInvariant();

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            // =================================================
            // CREAR GASTO
            // =================================================

            var gasto = new Gasto
            {
                Concepto =
                    request.Concepto.Trim(),

                Descripcion =
                    string.IsNullOrWhiteSpace(
                        request.Descripcion
                    )
                        ? null
                        : request.Descripcion.Trim(),

                Categoria =
                    categoria,

                Monto =
                    request.Monto,

                FechaGasto =
                    request.FechaGasto ??
                    DateTime.Now
            };

            _context.Gastos.Add(gasto);

            // Necesitamos IdGasto para relacionarlo
            // con el movimiento financiero.
            await _context.SaveChangesAsync();

            // =================================================
            // MOVIMIENTO FINANCIERO
            // =================================================

            var tipoMovimiento =
                EsCategoriaInventario(categoria)
                    ? "COMPRA_INVENTARIO"
                    : "GASTO";

            var movimientoFinanciero =
                new MovimientoFinanciero
                {
                    Tipo =
                        tipoMovimiento,

                    Concepto =
                        gasto.Concepto,

                    Monto =
                        gasto.Monto,

                    FechaMovimiento =
                        gasto.FechaGasto,

                    IdVenta =
                        null,

                    IdGasto =
                        gasto.IdGasto,

                    Observaciones =
                        $"Gasto registrado en categoría {gasto.Categoria}"
                };

            _context.MovimientosFinancieros
                .Add(movimientoFinanciero);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    "Gasto registrado correctamente.",

                gasto.IdGasto,
                gasto.Concepto,
                gasto.Descripcion,
                gasto.Categoria,
                gasto.Monto,
                gasto.FechaGasto
            });
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    // =========================================================
    // PUT /api/gastos/{id}
    // MODIFICAR REGISTRO
    // =========================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> ModificarGasto(
        int id,
        CrearGastoRequest request)
    {
        if (string.IsNullOrWhiteSpace(
            request.Concepto))
        {
            return BadRequest(new
            {
                mensaje =
                    "El concepto es obligatorio."
            });
        }

        if (string.IsNullOrWhiteSpace(
            request.Categoria))
        {
            return BadRequest(new
            {
                mensaje =
                    "La categoría es obligatoria."
            });
        }

        if (request.Monto <= 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "El monto debe ser mayor a cero."
            });
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var gasto = await _context.Gastos
                .FirstOrDefaultAsync(g =>
                    g.IdGasto == id);

            if (gasto == null)
            {
                await transaction.RollbackAsync();

                return NotFound(new
                {
                    mensaje =
                        $"No existe el gasto #{id}."
                });
            }

            // =================================================
            // GUARDAR VALORES ANTERIORES
            // =================================================

            decimal montoAnterior =
                gasto.Monto;

            string categoriaAnterior =
                (gasto.Categoria ?? string.Empty)
                    .Trim()
                    .ToUpperInvariant();

            string categoriaNueva =
                request.Categoria
                    .Trim()
                    .ToUpperInvariant();

            // =================================================
            // ACTUALIZAR GASTO
            // =================================================

            gasto.Concepto =
                request.Concepto.Trim();

            gasto.Descripcion =
                string.IsNullOrWhiteSpace(
                    request.Descripcion
                )
                    ? null
                    : request.Descripcion.Trim();

            gasto.Categoria =
                categoriaNueva;

            gasto.Monto =
                request.Monto;

            if (request.FechaGasto.HasValue)
            {
                gasto.FechaGasto =
                    request.FechaGasto.Value;
            }

            // =================================================
            // AJUSTE FINANCIERO
            // =================================================

            decimal diferencia =
                request.Monto -
                montoAnterior;

            if (diferencia > 0)
            {
                // El gasto aumentó.
                // Hay una salida adicional de dinero.

                var tipoMovimiento =
                    EsCategoriaInventario(
                        categoriaNueva
                    )
                        ? "COMPRA_INVENTARIO"
                        : "GASTO";

                var movimiento =
                    new MovimientoFinanciero
                    {
                        Tipo =
                            tipoMovimiento,

                        Concepto =
                            $"Ajuste gasto #{gasto.IdGasto}",

                        Monto =
                            diferencia,

                        FechaMovimiento =
                            DateTime.Now,

                        IdVenta =
                            null,

                        IdGasto =
                            gasto.IdGasto,

                        Observaciones =
                            $"Monto aumentado de {montoAnterior:C2} " +
                            $"a {request.Monto:C2}."
                    };

                _context.MovimientosFinancieros
                    .Add(movimiento);
            }
            else if (diferencia < 0)
            {
                // El gasto disminuyó.
                // Regresamos la diferencia al saldo.

                var movimiento =
                    new MovimientoFinanciero
                    {
                        Tipo =
                            "AJUSTE_ENTRADA",

                        Concepto =
                            $"Ajuste gasto #{gasto.IdGasto}",

                        Monto =
                            Math.Abs(diferencia),

                        FechaMovimiento =
                            DateTime.Now,

                        IdVenta =
                            null,

                        IdGasto =
                            gasto.IdGasto,

                        Observaciones =
                            $"Monto reducido de {montoAnterior:C2} " +
                            $"a {request.Monto:C2}."
                    };

                _context.MovimientosFinancieros
                    .Add(movimiento);
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    $"Registro #{gasto.IdGasto} actualizado correctamente.",

                gasto.IdGasto,
                gasto.Concepto,
                gasto.Descripcion,
                gasto.Categoria,
                gasto.Monto,
                gasto.FechaGasto
            });
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    // =========================================================
    // DELETE /api/gastos/{id}
    // =========================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarGasto(
        int id)
    {
        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var gasto = await _context.Gastos
                .FirstOrDefaultAsync(g =>
                    g.IdGasto == id);

            if (gasto == null)
            {
                await transaction.RollbackAsync();

                return NotFound(new
                {
                    mensaje =
                        $"No existe el gasto #{id}."
                });
            }

            // =================================================
            // DESVINCULAR MOVIMIENTOS ANTERIORES
            //
            // Esto permite conservar el historial financiero
            // aunque eliminemos el registro de Gastos.
            // =================================================

            var movimientosRelacionados =
                await _context
                    .MovimientosFinancieros
                    .Where(m =>
                        m.IdGasto == id)
                    .ToListAsync();

            foreach (
                var movimiento in
                    movimientosRelacionados)
            {
                movimiento.IdGasto = null;
            }

            // =================================================
            // REVERSA FINANCIERA
            // =================================================

            var reversa =
                new MovimientoFinanciero
                {
                    Tipo =
                        "AJUSTE_ENTRADA",

                    Concepto =
                        $"Eliminación gasto #{gasto.IdGasto}",

                    Monto =
                        gasto.Monto,

                    FechaMovimiento =
                        DateTime.Now,

                    IdVenta =
                        null,

                    IdGasto =
                        null,

                    Observaciones =
                        $"Se eliminó el gasto '{gasto.Concepto}' " +
                        $"de categoría {gasto.Categoria}."
                };

            _context.MovimientosFinancieros
                .Add(reversa);

            // =================================================
            // ELIMINAR GASTO
            // =================================================

            _context.Gastos.Remove(gasto);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    $"Registro #{id} eliminado correctamente."
            });
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private static bool EsCategoriaInventario(
        string? categoria)
    {
        if (string.IsNullOrWhiteSpace(
            categoria))
        {
            return false;
        }

        return CategoriasInventario.Contains(
            categoria
                .Trim()
                .ToUpperInvariant()
        );
    }
}

public class CrearGastoRequest
{
    public string Concepto { get; set; }
        = string.Empty;

    public string? Descripcion { get; set; }

    public string Categoria { get; set; }
        = string.Empty;

    public decimal Monto { get; set; }

    public DateTime? FechaGasto { get; set; }
}