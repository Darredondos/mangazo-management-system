using System;
using System.Collections.Generic;

namespace Mangazo.Recovery.Models;

public partial class Venta
{
    public int IdVenta { get; set; }

    public DateTime FechaVenta { get; set; }

    public string MetodoPago { get; set; } = null!;

    public decimal TotalVenta { get; set; }

    public string Estado { get; set; } = null!;

    public virtual ICollection<DetalleVentum> DetalleVenta { get; set; } = new List<DetalleVentum>();

    public virtual ICollection<MovimientoInventario> MovimientoInventarios { get; set; } = new List<MovimientoInventario>();
}
