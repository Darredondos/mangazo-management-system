using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mangazo.API.Data;
using Mangazo.API.Models;

namespace Mangazo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GastosController : ControllerBase
{
    private readonly MangazoDbContext _context;

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
            .FirstOrDefaultAsync(g => g.IdGasto == id);

        if (gasto == null)
        {
            return NotFound(new
            {
                mensaje = $"No existe el gasto #{id}."
            });
        }

        return Ok(gasto);
    }

    // =========================================================
    // POST /api/gastos
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CrearGasto(
        CrearGastoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Concepto))
        {
            return BadRequest(new
            {
                mensaje = "El concepto es obligatorio."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Categoria))
        {
            return BadRequest(new
            {
                mensaje = "La categoría es obligatoria."
            });
        }

        if (request.Monto <= 0)
        {
            return BadRequest(new
            {
                mensaje = "El monto debe ser mayor a cero."
            });
        }

        var gasto = new Gasto
        {
            Concepto = request.Concepto.Trim(),

            Descripcion = string.IsNullOrWhiteSpace(
                request.Descripcion
            )
                ? null
                : request.Descripcion.Trim(),

            Categoria = request.Categoria
                .Trim()
                .ToUpperInvariant(),

            Monto = request.Monto,

            FechaGasto =
                request.FechaGasto ?? DateTime.Now
        };

        _context.Gastos.Add(gasto);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Gasto registrado correctamente.",
            gasto.IdGasto,
            gasto.Concepto,
            gasto.Descripcion,
            gasto.Categoria,
            gasto.Monto,
            gasto.FechaGasto
        });
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
        var gasto = await _context.Gastos
            .FirstOrDefaultAsync(g => g.IdGasto == id);

        if (gasto == null)
        {
            return NotFound(new
            {
                mensaje = $"No existe el gasto #{id}."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Concepto))
        {
            return BadRequest(new
            {
                mensaje = "El concepto es obligatorio."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Categoria))
        {
            return BadRequest(new
            {
                mensaje = "La categoría es obligatoria."
            });
        }

        if (request.Monto <= 0)
        {
            return BadRequest(new
            {
                mensaje = "El monto debe ser mayor a cero."
            });
        }

        gasto.Concepto =
            request.Concepto.Trim();

        gasto.Descripcion =
            string.IsNullOrWhiteSpace(request.Descripcion)
                ? null
                : request.Descripcion.Trim();

        gasto.Categoria =
            request.Categoria
                .Trim()
                .ToUpperInvariant();

        gasto.Monto =
            request.Monto;

        if (request.FechaGasto.HasValue)
        {
            gasto.FechaGasto =
                request.FechaGasto.Value;
        }

        await _context.SaveChangesAsync();

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

    // =========================================================
    // DELETE /api/gastos/{id}
    // =========================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarGasto(int id)
    {
        var gasto = await _context.Gastos
            .FirstOrDefaultAsync(g => g.IdGasto == id);

        if (gasto == null)
        {
            return NotFound(new
            {
                mensaje = $"No existe el gasto #{id}."
            });
        }

        _context.Gastos.Remove(gasto);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                $"Registro #{id} eliminado correctamente."
        });
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