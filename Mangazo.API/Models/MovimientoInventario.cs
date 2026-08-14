using System;
using System.Collections.Generic;

namespace Mangazo.API.Models;

public partial class MovimientoInventario
{
    public int IdMovimiento { get; set; }

    public int IdProducto { get; set; }

    public int? IdVenta { get; set; }

    public string TipoMovimiento { get; set; } = null!;

    public int Cantidad { get; set; }

    public string? Motivo { get; set; }

    public DateTime FechaMovimiento { get; set; }

    public virtual Producto IdProductoNavigation { get; set; } = null!;

    public virtual Venta? IdVentaNavigation { get; set; }
}
