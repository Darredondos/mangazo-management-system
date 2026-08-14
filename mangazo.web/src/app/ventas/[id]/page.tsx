"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ProductoVenta = {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
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
  gananciaBruta: number;
};

export default function VentaDetallePage() {
  const params = useParams();
  const id = params.id as string;

  const [venta, setVenta] = useState<Venta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarVenta = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ventas/${id}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No existe la venta #${id}.`);
        }

        throw new Error("No fue posible cargar la venta.");
      }

      const data: Venta = await response.json();

      setVenta(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cargando la venta."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVenta();
  }, [id]);

  const cancelarVenta = async () => {
    if (!venta) return;

    const confirmar = window.confirm(
      `¿Seguro que quieres cancelar la venta #${venta.idVenta}? El inventario será devuelto automáticamente.`
    );

    if (!confirmar) return;

    try {
      setCancelando(true);
      setError("");
      setMensaje("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ventas/${venta.idVenta}/cancelar`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ?? "No fue posible cancelar la venta."
        );
      }

      setMensaje(
        data.mensaje ?? "Venta cancelada correctamente."
      );

      await cargarVenta();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cancelando la venta."
      );
    } finally {
      setCancelando(false);
    }
  };

  const costoTotal =
    venta?.productos.reduce(
      (total, producto) =>
        total + Number(producto.costoTotal ?? 0),
      0
    ) ?? 0;

  const gananciaTotal =
    venta?.productos.reduce(
      (total, producto) =>
        total + Number(producto.gananciaBruta ?? 0),
      0
    ) ?? 0;

  const cantidadTotal =
    venta?.productos.reduce(
      (total, producto) =>
        total + producto.cantidad,
      0
    ) ?? 0;

  const formatearDinero = (cantidad: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cantidad);

  const formatearFecha = (fecha: string) =>
    new Intl.DateTimeFormat("es-MX", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(fecha));

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#F5F0E6] p-10 text-[#29321F]">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          Cargando venta...
        </div>
      </main>
    );
  }

  if (!venta) {
    return (
      <main className="min-h-screen bg-[#F5F0E6] p-10 text-[#29321F]">
        <div className="rounded-3xl bg-white p-10 shadow-sm">

          <p className="text-xl font-black">
            Venta no encontrada.
          </p>

          {error && (
            <p className="mt-3 text-red-600">
              {error}
            </p>
          )}

          <Link
            href="/ventas"
            className="mt-6 inline-block font-bold text-[#CF7B32]"
          >
            ← Volver a ventas
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">

      <div className="mx-auto max-w-6xl">

        {/* VOLVER */}

        <div className="mb-8">

          <Link
            href="/ventas"
            className="font-bold text-[#CF7B32] transition hover:text-[#A85E21]"
          >
            ← Volver a ventas
          </Link>

        </div>

        {/* MENSAJES */}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-100 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 rounded-2xl bg-green-100 p-5 font-semibold text-green-800">
            ✓ {mensaje}
          </div>
        )}

        {/* ENCABEZADO */}

        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
              Detalle de operación
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Venta #{venta.idVenta}
            </h1>

            <p className="mt-2 text-[#68715C]">
              {formatearFecha(venta.fechaVenta)}
            </p>

          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
              venta.estado === "COMPLETADA"
                ? "bg-green-100 text-green-700"
                : venta.estado === "CANCELADA"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {venta.estado}
          </span>

        </section>

        {/* KPIs */}

        <section className="mt-8 grid gap-5 md:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Total de venta
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(
                Number(venta.totalVenta)
              )}
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Costo
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(costoTotal)}
            </p>

          </div>

          <div className="rounded-3xl bg-[#4E5A36] p-6 text-white shadow-sm">

            <p className="text-sm text-white/60">
              Ganancia bruta
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(gananciaTotal)}
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Bolsas vendidas
            </p>

            <p className="mt-3 text-3xl font-black">
              {cantidadTotal}
            </p>

          </div>

        </section>

        {/* PRODUCTOS */}

        <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">

          <div className="border-b border-[#EEE8DC] p-6">

            <h2 className="text-2xl font-black">
              Productos
            </h2>

            <p className="mt-1 text-sm text-[#737A68]">
              Artículos incluidos en esta operación.
            </p>

          </div>

          {venta.productos.length === 0 ? (

            <div className="p-8 text-[#737A68]">
              Esta venta no tiene detalle de productos registrado.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-[#29321F] text-left text-sm text-white">

                  <tr>
                    <th className="px-6 py-4">
                      Producto
                    </th>

                    <th className="px-6 py-4">
                      Cantidad
                    </th>

                    <th className="px-6 py-4">
                      Precio
                    </th>

                    <th className="px-6 py-4">
                      Costo
                    </th>

                    <th className="px-6 py-4">
                      Subtotal
                    </th>

                    <th className="px-6 py-4">
                      Ganancia
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {venta.productos.map(
                    (producto) => (

                      <tr
                        key={producto.idProducto}
                        className="border-b border-[#EEE8DC] last:border-none"
                      >

                        <td className="px-6 py-5 font-bold">
                          {producto.nombre}
                        </td>

                        <td className="px-6 py-5">
                          {producto.cantidad}
                        </td>

                        <td className="px-6 py-5">
                          {formatearDinero(
                            Number(
                              producto.precioUnitario
                            )
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {formatearDinero(
                            Number(
                              producto.costoUnitario
                            )
                          )}
                        </td>

                        <td className="px-6 py-5 font-bold">
                          {formatearDinero(
                            Number(
                              producto.subtotal
                            )
                          )}
                        </td>

                        <td className="px-6 py-5 font-bold text-green-700">
                          {formatearDinero(
                            Number(
                              producto.gananciaBruta
                            )
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* INFO + ACCIONES */}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* INFORMACIÓN */}

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm font-black uppercase tracking-widest text-[#CF7B32]">
              Información
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">

              <div>

                <p className="text-xs uppercase text-[#8A907E]">
                  Método de pago
                </p>

                <p className="mt-1 text-lg font-black">
                  {venta.metodoPago}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-[#8A907E]">
                  Estado
                </p>

                <p className="mt-1 text-lg font-black">
                  {venta.estado}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-[#8A907E]">
                  Venta
                </p>

                <p className="mt-1 text-lg font-black">
                  #{venta.idVenta}
                </p>

              </div>

            </div>

          </div>

          {/* ACCIONES */}

          <div className="rounded-3xl bg-[#29321F] p-6 text-white shadow-sm">

            <p className="text-sm font-black uppercase tracking-widest text-[#E8A35C]">
              Acciones
            </p>

            {venta.estado === "COMPLETADA" ? (
              <>

                <p className="mt-4 text-sm leading-6 text-white/60">
                  Puedes corregir productos,
                  cantidades o método de pago sin
                  perder el historial de la operación.
                </p>

                {/* MODIFICAR */}

                <Link
                  href={`/ventas/${venta.idVenta}/editar`}
                  className="mt-6 block w-full rounded-2xl bg-[#E78A32] px-5 py-4 text-center font-black text-white transition hover:bg-[#CF7B32]"
                >
                  ✏️ MODIFICAR VENTA
                </Link>

                <div className="my-5 border-t border-white/10" />

                <p className="text-sm leading-6 text-white/50">
                  Al cancelar esta venta, las unidades
                  serán devueltas automáticamente al
                  inventario.
                </p>

                {/* CANCELAR */}

                <button
                  type="button"
                  onClick={cancelarVenta}
                  disabled={cancelando}
                  className="mt-4 w-full rounded-2xl bg-red-500 px-5 py-4 font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelando
                    ? "CANCELANDO..."
                    : "CANCELAR VENTA"}
                </button>

              </>
            ) : (

              <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-white/70">
                Esta venta ya no admite modificaciones ni cancelación.
              </div>

            )}

          </div>

        </section>

      </div>

    </main>
  );
}