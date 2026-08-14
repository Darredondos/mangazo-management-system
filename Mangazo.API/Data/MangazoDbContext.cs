using Mangazo.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

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
    // DBSETS
    // =========================================================

    public virtual DbSet<DetalleVentum> DetalleVenta { get; set; }

    public virtual DbSet<Gasto> Gastos { get; set; }

    public virtual DbSet<MovimientoInventario> MovimientoInventarios { get; set; }

    public virtual DbSet<Producto> Productos { get; set; }

    public virtual DbSet<Venta> Ventas { get; set; }

    // =========================================================
    // CONFIGURACIÓN DEL MODELO
    // =========================================================

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =====================================================
        // DETALLE VENTA
        // =====================================================

        modelBuilder.Entity<DetalleVentum>(entity =>
        {
            entity.HasKey(e => e.IdDetalleVenta)
                .HasName("PK__DetalleV__AAA5CEC2EB1E3C23");

            entity.ToTable("DetalleVenta");

            entity.Property(e => e.CostoUnitario)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(10, 2)");

            // =================================================
            // COLUMNAS CALCULADAS POR SQL SERVER
            //
            // Estas columnas NO se insertan ni actualizan
            // manualmente desde Entity Framework.
            // =================================================

            var subtotal = entity
                .Property(e => e.Subtotal)
                .HasComputedColumnSql(
                    "([Cantidad]*[PrecioUnitario])",
                    stored: false
                )
                .HasColumnType("decimal(21, 2)");

            subtotal.Metadata.SetBeforeSaveBehavior(
                PropertySaveBehavior.Ignore
            );

            subtotal.Metadata.SetAfterSaveBehavior(
                PropertySaveBehavior.Ignore
            );

            var costoTotal = entity
                .Property(e => e.CostoTotal)
                .HasComputedColumnSql(
                    "([Cantidad]*[CostoUnitario])",
                    stored: false
                )
                .HasColumnType("decimal(21, 2)");

            costoTotal.Metadata.SetBeforeSaveBehavior(
                PropertySaveBehavior.Ignore
            );

            costoTotal.Metadata.SetAfterSaveBehavior(
                PropertySaveBehavior.Ignore
            );

            var gananciaBruta = entity
                .Property(e => e.GananciaBruta)
                .HasComputedColumnSql(
                    "([Cantidad]*([PrecioUnitario]-[CostoUnitario]))",
                    stored: false
                )
                .HasColumnType("decimal(22, 2)");

            gananciaBruta.Metadata.SetBeforeSaveBehavior(
                PropertySaveBehavior.Ignore
            );

            gananciaBruta.Metadata.SetAfterSaveBehavior(
                PropertySaveBehavior.Ignore
            );

            // =================================================
            // RELACIÓN CON PRODUCTO
            // =================================================

            entity.HasOne(d => d.IdProductoNavigation)
                .WithMany(p => p.DetalleVenta)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DetalleVenta_Productos");

            // =================================================
            // RELACIÓN CON VENTA
            // =================================================

            entity.HasOne(d => d.IdVentaNavigation)
                .WithMany(p => p.DetalleVenta)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DetalleVenta_Ventas");
        });

        // =====================================================
        // GASTOS
        // =====================================================

        modelBuilder.Entity<Gasto>(entity =>
        {
            entity.HasKey(e => e.IdGasto)
                .HasName("PK__Gastos__C630244D4361185F");

            entity.ToTable("Gastos");

            entity.Property(e => e.Categoria)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.Property(e => e.Concepto)
                .HasMaxLength(150)
                .IsUnicode(false);

            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .IsUnicode(false);

            entity.Property(e => e.FechaGasto)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.Property(e => e.Monto)
                .HasColumnType("decimal(10, 2)");
        });

        // =====================================================
        // MOVIMIENTOS DE INVENTARIO
        // =====================================================

        modelBuilder.Entity<MovimientoInventario>(entity =>
        {
            entity.HasKey(e => e.IdMovimiento)
                .HasName("PK__Movimien__881A6AE04E1B5A03");

            entity.ToTable("MovimientoInventario");

            entity.Property(e => e.FechaMovimiento)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.Property(e => e.Motivo)
                .HasMaxLength(255)
                .IsUnicode(false);

            entity.Property(e => e.TipoMovimiento)
                .HasMaxLength(20)
                .IsUnicode(false);

            // =================================================
            // RELACIÓN CON PRODUCTO
            // =================================================

            entity.HasOne(d => d.IdProductoNavigation)
                .WithMany(p => p.MovimientoInventarios)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movimiento_Producto");

            // =================================================
            // RELACIÓN CON VENTA
            // =================================================

            entity.HasOne(d => d.IdVentaNavigation)
                .WithMany(p => p.MovimientoInventarios)
                .HasForeignKey(d => d.IdVenta)
                .HasConstraintName("FK_Movimiento_Venta");
        });

        // =====================================================
        // PRODUCTOS
        // =====================================================

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.IdProducto)
                .HasName("PK__Producto__09889210CD253EAA");

            entity.ToTable("Productos");

            entity.Property(e => e.Activo)
                .HasDefaultValue(true);

            entity.Property(e => e.CostoActual)
                .HasColumnType("decimal(10, 2)");

            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .IsUnicode(false);

            entity.Property(e => e.FechaRegistro)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.Property(e => e.PrecioVenta)
                .HasColumnType("decimal(10, 2)");
        });

        // =====================================================
        // VENTAS
        // =====================================================

        modelBuilder.Entity<Venta>(entity =>
        {
            entity.HasKey(e => e.IdVenta)
                .HasName("PK__Ventas__BC1240BDAF09A6F8");

            entity.ToTable("Ventas");

            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("COMPLETADA");

            entity.Property(e => e.FechaVenta)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.Property(e => e.MetodoPago)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.Property(e => e.TotalVenta)
                .HasColumnType("decimal(10, 2)");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(
        ModelBuilder modelBuilder
    );
}