using System;
using System.Collections.Generic;

namespace Mangazo.API.Models;

public partial class Gasto
{
    public int IdGasto { get; set; }

    public string Concepto { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string Categoria { get; set; } = null!;

    public decimal Monto { get; set; }

    public DateTime FechaGasto { get; set; }
}
