namespace Mangazo.API.Models;

public partial class Finanza
{
    public int IdFinanza { get; set; }

    public decimal SaldoCuenta { get; set; }

    public DateTime FechaActualizacion { get; set; }
}