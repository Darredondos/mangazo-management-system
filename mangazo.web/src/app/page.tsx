"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Dashboard = {
  hoy: {
    ventas: number;
    ingresos: number;
  };

  mes: {
    ventas: number;
    ingresos: number;
    bolsasVendidas: number;
    costoProductoVendido: number;
    utilidadBruta: number;
    gastos: number;
    utilidadNeta: number;
    margenBruto: number;
    margenNeto: number;
    ticketPromedio: number;
  };

  inventario: {
    stockTotal: number;
    productosStockBajo: number;
    valorInventario: number;
  };

  productoEstrella: {
    idProducto: number;
    producto: string;
    cantidad: number;
  } | null;

  ventasUltimos7Dias: {
    fecha: string;
    total: number;
  }[];
};

export default function Home() {
  const [dashboard, setDashboard] =
    useState<Dashboard | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`
        );

        if (!response.ok) {
          throw new Error(
            "No fue posible cargar el dashboard."
          );
        }

        const data = await response.json();

        setDashboard(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

  const formatearDinero = (
    cantidad: number
  ) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(cantidad);

  const maxVentaDia = useMemo(() => {
    if (!dashboard) return 0;

    return Math.max(
      ...dashboard.ventasUltimos7Dias.map(
        (item) => Number(item.total)
      ),
      1
    );
  }, [dashboard]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#F5F0E6] p-10">
        Cargando Mangazo...
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="min-h-screen bg-[#F5F0E6] p-10">
        <div className="rounded-3xl bg-red-100 p-6 text-red-700">
          {error || "No hay información disponible."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
              Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Mangazo 🥭
            </h1>

            <p className="mt-2 text-[#68715C]">
              Así está el negocio en este momento.
            </p>
          </div>

          <Link
            href="/ventas/nueva"
            className="rounded-2xl bg-[#E78A32] px-6 py-4 text-center font-black text-white shadow-sm transition hover:scale-[1.02]"
          >
            + NUEVA VENTA
          </Link>

        </div>

        {/* HOY */}

        <section className="mt-8 grid gap-5 md:grid-cols-2">

          <div className="rounded-3xl bg-[#29321F] p-7 text-white shadow-sm">
            <p className="text-sm text-white/60">
              Ventas de hoy
            </p>

            <p className="mt-3 text-5xl font-black">
              {dashboard.hoy.ventas}
            </p>

            <p className="mt-2 text-sm text-white/50">
              operaciones completadas
            </p>
          </div>

          <div className="rounded-3xl bg-[#E78A32] p-7 text-white shadow-sm">
            <p className="text-sm text-white/70">
              Ingresos de hoy
            </p>

            <p className="mt-3 text-5xl font-black">
              {formatearDinero(
                dashboard.hoy.ingresos
              )}
            </p>
          </div>

        </section>

        {/* KPIs MES */}

        <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#737A68]">
              Ingresos del mes
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(
                dashboard.mes.ingresos
              )}
            </p>

            <p className="mt-2 text-xs text-[#8A907E]">
              {dashboard.mes.ventas} ventas
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#737A68]">
              Utilidad bruta
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(
                dashboard.mes.utilidadBruta
              )}
            </p>

            <p className="mt-2 text-xs text-[#8A907E]">
              {dashboard.mes.margenBruto.toFixed(
                1
              )}
              % margen
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#737A68]">
              Gastos del mes
            </p>

            <p className="mt-3 text-3xl font-black text-red-600">
              {formatearDinero(
                dashboard.mes.gastos
              )}
            </p>
          </div>

          <div
            className={`rounded-3xl p-6 text-white shadow-sm ${
              dashboard.mes.utilidadNeta >= 0
                ? "bg-[#4E5A36]"
                : "bg-red-600"
            }`}
          >
            <p className="text-sm text-white/70">
              Utilidad neta
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(
                dashboard.mes.utilidadNeta
              )}
            </p>

            <p className="mt-2 text-xs text-white/60">
              {dashboard.mes.margenNeto.toFixed(1)}%
              margen neto
            </p>
          </div>

        </section>

        {/* MÉTRICAS */}

        <section className="mt-5 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Bolsas vendidas
            </p>

            <p className="mt-3 text-4xl font-black">
              {dashboard.mes.bolsasVendidas}
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Ticket promedio
            </p>

            <p className="mt-3 text-4xl font-black">
              {formatearDinero(
                dashboard.mes.ticketPromedio
              )}
            </p>

          </div>

          <div className="rounded-3xl bg-[#29321F] p-6 text-white shadow-sm">

            <p className="text-sm text-white/60">
              Producto estrella
            </p>

            <p className="mt-3 text-xl font-black">
              {dashboard.productoEstrella
                ?.producto ?? "Sin datos"}
            </p>

            <p className="mt-2 text-sm text-[#E8A35C]">
              {dashboard.productoEstrella
                ? `${dashboard.productoEstrella.cantidad} bolsas`
                : ""}
            </p>

          </div>

        </section>

        {/* GRÁFICA */}

        <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm">

          <div>
            <h2 className="text-2xl font-black">
              Ventas últimos 7 días
            </h2>

            <p className="mt-1 text-sm text-[#737A68]">
              Ingresos diarios.
            </p>
          </div>

          <div className="mt-8 flex h-64 items-end gap-4">

            {dashboard.ventasUltimos7Dias.map(
              (item) => {

                const porcentaje =
                  (Number(item.total) /
                    maxVentaDia) *
                  100;

                return (
                  <div
                    key={item.fecha}
                    className="flex flex-1 flex-col items-center justify-end"
                  >

                    <p className="mb-2 text-xs font-bold">
                      {formatearDinero(
                        Number(item.total)
                      )}
                    </p>

                    <div className="flex h-44 w-full items-end rounded-2xl bg-[#F3EEE4]">

                      <div
                        className="w-full rounded-2xl bg-[#E78A32] transition-all"
                        style={{
                          height: `${Math.max(
                            porcentaje,
                            item.total > 0 ? 5 : 0
                          )}%`,
                        }}
                      />

                    </div>

                    <p className="mt-3 text-xs font-bold uppercase text-[#737A68]">
                      {new Intl.DateTimeFormat(
                        "es-MX",
                        {
                          weekday: "short",
                        }
                      ).format(
                        new Date(item.fecha)
                      )}
                    </p>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* INVENTARIO */}

        <section className="mt-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Stock total
            </p>

            <p className="mt-3 text-4xl font-black">
              {dashboard.inventario.stockTotal}
            </p>

            <p className="mt-1 text-xs text-[#8A907E]">
              bolsas
            </p>

          </div>

          <div
            className={`rounded-3xl p-6 shadow-sm ${
              dashboard.inventario
                .productosStockBajo > 0
                ? "bg-[#E78A32] text-white"
                : "bg-white"
            }`}
          >

            <p
              className={`text-sm ${
                dashboard.inventario
                  .productosStockBajo > 0
                  ? "text-white/70"
                  : "text-[#737A68]"
              }`}
            >
              Productos con stock bajo
            </p>

            <p className="mt-3 text-4xl font-black">
              {
                dashboard.inventario
                  .productosStockBajo
              }
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Valor del inventario
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(
                dashboard.inventario
                  .valorInventario
              )}
            </p>

            <p className="mt-1 text-xs text-[#8A907E]">
              A costo actual
            </p>

          </div>

        </section>

      </div>
    </main>
  );
}