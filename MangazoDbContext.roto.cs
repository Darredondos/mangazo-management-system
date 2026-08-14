using System;
using System.Collections.Generic;
using Mangazo.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Mangazo.API.Data;

public partial class MangazoDbContext : DbContext
{
    public MangazoDbContext(DbContextOptions<MangazoDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cortesia> Cortesias { get; set; }

    public virtual DbSet<DetalleCortesium> DetalleCortesia { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cortesia>(entity =>
        {
            entity.HasKey(e => e.IdCortesia).HasName("PK__Cortesia__22D72D805C839A01");

            entity.Property(e => e.Destinatario)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("ACTIVA");
            entity.Property(e => e.FechaCortesia)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Motivo)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.Observaciones)
                .HasMaxLength(255)
                .IsUnicode(false);
        });

        modelBuilder.Entity<DetalleCortesium>(entity =>
        {
            entity.HasKey(e => e.IdDetalleCortesia).HasName("PK__DetalleC__9DEE357D9BF7CE0B");

            entity.Property(e => e.CostoTotal).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.CostoUnitario).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.IdCortesiaNavigation).WithMany(p => p.DetalleCortesia)
                .HasForeignKey(d => d.IdCortesia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DetalleCortesia_Cortesia");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
