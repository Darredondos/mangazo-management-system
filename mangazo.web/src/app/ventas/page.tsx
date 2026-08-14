"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type ProductoVenta = {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  costoTotal: number;
  gananciaBruta: number;
};

type Venta = {
  idVenta: number;
  fechaVenta: string;
  metodoPago: string;
  totalVenta: number;
  estado: string;
  productos: ProductoVenta[];
};

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarVentas = async () => {
      try {
        setCargando(true);
        setError("");

        const response = await apiFetch(
          "/api/ventas"
        );

        if (!response.ok) {
          throw new Error(
            "No fue posible cargar las ventas."
          );
        }

        const data: Venta[] =
          await response.json();

        setVentas(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error cargando las ventas."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarVentas();
  }, []);

  const ventasCompletadas = useMemo(
    () =>
      ventas.filter(
        (venta) =>
          venta.estado === "COMPLETADA"
      ),
    [ventas]
  );

  const ingresos = useMemo(
    () =>
      ventasCompletadas.reduce(
        (total, venta) =>
          total +
          Number(venta.totalVenta),
        0
      ),
    [ventasCompletadas]
  );

  const ganancia = useMemo(
    () =>
      ventasCompletadas.reduce(
        (total, venta) =>
          total +
          venta.productos.reduce(
            (subtotal, producto) =>
              subtotal +
              Number(
                producto.gananciaBruta ?? 0
              ),
            0
          ),
        0
      ),
    [ventasCompletadas]
  );

  const formatearDinero = (
    cantidad: number
  ) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cantidad);

  const formatearFecha = (
    fecha: string
  ) =>
    new Intl.DateTimeFormat(
      "es-MX",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(fecha));

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">

      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
              Operación
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Historial de ventas
            </h1>

            <p className="mt-2 text-[#68715C]">
              Consulta todas las operaciones registradas en Mangazo.
            </p>
          </div>

          <Link
            href="/ventas/nueva"
            className="inline-flex items-center justify-center rounded-2xl bg-[#E78A32] px-6 py-4 font-black text-white shadow-sm transition hover:scale-[1.02]"
          >
            + NUEVA VENTA
          </Link>

        </div>

        {/* KPIs */}

        <section className="mt-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#737A68]">
              Ventas completadas
            </p>

            <p className="mt-3 text-4xl font-black">
              {ventasCompletadas.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-[#737A68]">
              Ingresos registrados
            </p>

            <p className="mt-3 text-4xl font-black">
              {formatearDinero(ingresos)}
            </p>
          </div>

          <div className="rounded-3xl bg-[#4E5A36] p-6 text-white shadow-sm">
            <p className="text-sm text-white/60">
              Ganancia bruta
            </p>

            <p className="mt-3 text-4xl font-black">
              {formatearDinero(ganancia)}
            </p>
          </div>

        </section>

        {/* CONTENIDO */}

        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-2xl font-black">
              Operaciones
            </h2>

            <p className="text-sm text-[#737A68]">
              {ventas.length} venta(s) registrada(s)
            </p>
          </div>

          {cargando && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              Cargando ventas...
            </div>
          )}

          {error && (
            <div className="rounded-3xl bg-red-100 p-6 font-semibold text-red-700">
              {error}
            </div>
          )}

          {!cargando &&
            !error &&
            ventas.length === 0 && (
              <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

                <p className="text-xl font-bold">
                  Todavía no hay ventas.
                </p>

                <Link
                  href="/ventas/nueva"
                  className="mt-5 inline-block font-bold text-[#CF7B32]"
                >
                  Registrar primera venta →
                </Link>

              </div>
            )}

          {!cargando &&
            !error &&
            ventas.length > 0 && (

              <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-[#29321F] text-left text-sm text-white">

                      <tr>
                        <th className="px-6 py-4">
                          Venta
                        </th>

                        <th className="px-6 py-4">
                          Fecha
                        </th>

                        <th className="px-6 py-4">
                          Productos
                        </th>

                        <th className="px-6 py-4">
                          Método
                        </th>

                        <th className="px-6 py-4">
                          Total
                        </th>

                        <th className="px-6 py-4">
                          Estado
                        </th>

                        <th className="px-6 py-4" />
                      </tr>

                    </thead>

                    <tbody>

                      {ventas.map(
                        (venta) => {

                          const cantidadProductos =
                            venta.productos.reduce(
                              (
                                total,
                                producto
                              ) =>
                                total +
                                producto.cantidad,
                              0
                            );

                          return (
                            <tr
                              key={venta.idVenta}
                              className="border-b border-[#EEE8DC] transition last:border-none hover:bg-[#FAF7F0]"
                            >

                              <td className="px-6 py-5">
                                <span className="font-black">
                                  #{venta.idVenta}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-6 py-5 text-sm text-[#68715C]">
                                {formatearFecha(
                                  venta.fechaVenta
                                )}
                              </td>

                              <td className="px-6 py-5">

                                <span className="font-semibold">
                                  {
                                    cantidadProductos
                                  }
                                </span>

                                <span className="ml-1 text-sm text-[#8A907E]">
                                  bolsa(s)
                                </span>

                              </td>

                              <td className="px-6 py-5">

                                <span className="rounded-full bg-[#F4E7D1] px-3 py-1 text-xs font-bold text-[#A85E21]">
                                  {
                                    venta.metodoPago
                                  }
                                </span>

                              </td>

                              <td className="px-6 py-5 text-lg font-black">
                                {formatearDinero(
                                  Number(
                                    venta.totalVenta
                                  )
                                )}
                              </td>

                              <td className="px-6 py-5">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    venta.estado ===
                                    "COMPLETADA"
                                      ? "bg-green-100 text-green-700"
                                      : venta.estado ===
                                        "CANCELADA"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {venta.estado}
                                </span>

                              </td>

                              <td className="px-6 py-5 text-right">

                                <Link
                                  href={`/ventas/${venta.idVenta}`}
                                  className="font-bold text-[#CF7B32] transition hover:text-[#A85E21]"
                                >
                                  Ver →
                                </Link>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

        </section>

      </div>

    </main>
  );
}