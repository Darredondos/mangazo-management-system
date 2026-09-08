namespace Mangazo.API.Models;

public partial class MovimientoFinanciero
{
    public int IdMovimientoFinanciero { get; set; }

    public string Tipo { get; set; } = null!;

    public string Concepto { get; set; } = null!;

    public decimal Monto { get; set; }

    public DateTime FechaMovimiento { get; set; }

    public int? IdVenta { get; set; }

    public int? IdGasto { get; set; }

    public string? Observaciones { get; set; }

    public virtual Venta? IdVentaNavigation { get; set; }

    public virtual Gasto? IdGastoNavigation { get; set; }
}