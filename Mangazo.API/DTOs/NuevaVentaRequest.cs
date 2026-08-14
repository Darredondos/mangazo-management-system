using System.ComponentModel.DataAnnotations;

namespace Mangazo.API.DTOs;

public class NuevaVentaRequest
{
    [Required]
    public string MetodoPago { get; set; } = string.Empty;

    [MinLength(1)]
    public List<NuevaVentaItemRequest> Productos { get; set; } = [];
}

public class NuevaVentaItemRequest
{
    [Range(1, int.MaxValue)]
    public int IdProducto { get; set; }

    [Range(1, int.MaxValue)]
    public int Cantidad { get; set; }
}