using System;
using System.Collections.Generic;

namespace Mangazo.Recovery.Models;

public partial class DetalleVentum
{
    public int IdDetalleVenta { get; set; }

    public int IdVenta { get; set; }

    public int IdProducto { get; set; }

    public int Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal CostoUnitario { get; set; }

    public decimal? Subtotal { get; set; }

    public decimal? CostoTotal { get; set; }

    public decimal? GananciaBruta { get; set; }

    public virtual Producto IdProductoNavigation { get; set; } = null!;

    public virtual Venta IdVentaNavigation { get; set; } = null!;
}
