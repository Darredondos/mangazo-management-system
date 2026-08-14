using Microsoft.EntityFrameworkCore;
using Mangazo.API.Models;

namespace Mangazo.API.Data;

public partial class MangazoDbContext : DbContext
{
    public MangazoDbContext()
    {
    }

    public MangazoDbContext(
        DbContextOptions<MangazoDbContext> options)
        : base(options)
    {
    }

    // =========================================================
    // TABLAS
    // =========================================================

    public virtual DbSet<Producto> Productos { get; set; }

    public virtual DbSet<Venta> Ventas { get; set; }

    public virtual DbSet<DetalleVentum> DetalleVenta { get; set; }

    public virtual DbSet<MovimientoInventario> MovimientoInventarios { get; set; }

    public virtual DbSet<Gasto> Gastos { get; set; }

    // =========================================================
    // CONFIGURACIÓN
    // =========================================================

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =====================================================
        // PRODUCTOS
        // =====================================================

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.IdProducto);

            entity.ToTable("Productos");

            entity.Property(e => e.Nombre)
                .IsRequired();

            entity.Property(e => e.PrecioVenta)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.CostoActual)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.FechaRegistro)
                .HasDefaultValueSql("(getdate())");
        });

        // =====================================================
        // VENTAS
        // =====================================================

        modelBuilder.Entity<Venta>(entity =>
        {
            entity.HasKey(e => e.IdVenta);

            entity.ToTable("Ventas");

            entity.Property(e => e.FechaVenta)
                .HasDefaultValueSql("(getdate())");

            entity.Property(e => e.TotalVenta)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.Estado)
                .IsRequired();

            entity.Property(e => e.MetodoPago)
                .IsRequired();
        });

        // =====================================================
        // DETALLE VENTA
        // =====================================================

        modelBuilder.Entity<DetalleVentum>(entity =>
        {
            entity.HasKey(e => e.IdDetalleVenta);

            entity.ToTable("DetalleVenta");

            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.CostoUnitario)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.CostoTotal)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.GananciaBruta)
                .HasColumnType("decimal(10, 2)");

            // DetalleVenta -> Producto
            entity.HasOne(d => d.IdProductoNavigation)
                .WithMany(p => p.DetalleVenta)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull);

            // DetalleVenta -> Venta
            entity.HasOne(d => d.IdVentaNavigation)
                .WithMany(v => v.DetalleVenta)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // =====================================================
        // MOVIMIENTO INVENTARIO
        // =====================================================

        modelBuilder.Entity<MovimientoInventario>(entity =>
        {
            entity.HasKey(e => e.IdMovimiento);

            entity.ToTable("MovimientoInventario");

            entity.Property(e => e.FechaMovimiento)
                .HasDefaultValueSql("(getdate())");

            // Movimiento -> Producto
            entity.HasOne(d => d.IdProductoNavigation)
                .WithMany(p => p.MovimientoInventarios)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull);

            // Movimiento -> Venta
            entity.HasOne(d => d.IdVentaNavigation)
                .WithMany(v => v.MovimientoInventarios)
                .HasForeignKey(d => d.IdVenta);
        });

        // =====================================================
        // GASTOS
        // =====================================================

        modelBuilder.Entity<Gasto>(entity =>
        {
            entity.HasKey(e => e.IdGasto);

            entity.ToTable("Gastos");

            entity.Property(e => e.Concepto)
                .IsRequired();

            entity.Property(e => e.Categoria)
                .IsRequired();

            entity.Property(e => e.Monto)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.FechaGasto)
                .HasDefaultValueSql("(getdate())");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(
        ModelBuilder modelBuilder);
}