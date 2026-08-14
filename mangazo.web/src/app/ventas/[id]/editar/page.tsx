"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Producto = {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  stockActual: number;
  activo: boolean;
};

type ProductoVenta = {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

type Venta = {
  idVenta: number;
  metodoPago: string;
  estado: string;
  productos: ProductoVenta[];
};

type Cantidades = Record<number, number>;

export default function EditarVentaPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [venta, setVenta] = useState<Venta | null>(null);

  const [cantidades, setCantidades] = useState<Cantidades>({});
  const [metodoPago, setMetodoPago] = useState("TRANSFERENCIA");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const [ventaResponse, productosResponse] =
          await Promise.all([
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/ventas/${id}`
            ),
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/productos`
            ),
          ]);

        if (!ventaResponse.ok) {
          throw new Error(`No fue posible cargar la venta #${id}.`);
        }

        if (!productosResponse.ok) {
          throw new Error("No fue posible cargar los productos.");
        }

        const ventaData: Venta = await ventaResponse.json();
        const productosData: Producto[] =
          await productosResponse.json();

        if (ventaData.estado !== "COMPLETADA") {
          throw new Error(
            "Solo se pueden modificar ventas completadas."
          );
        }

        setVenta(ventaData);
        setProductos(
          productosData.filter((p) => p.activo)
        );

        setMetodoPago(ventaData.metodoPago);

        const cantidadesIniciales: Cantidades = {};

        ventaData.productos.forEach((producto) => {
          cantidadesIniciales[producto.idProducto] =
            producto.cantidad;
        });

        setCantidades(cantidadesIniciales);
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

    cargarDatos();
  }, [id]);

  const cantidadOriginal = (idProducto: number) => {
    return (
      venta?.productos.find(
        (producto) =>
          producto.idProducto === idProducto
      )?.cantidad ?? 0
    );
  };

  const stockDisponible = (producto: Producto) => {
    return (
      producto.stockActual +
      cantidadOriginal(producto.idProducto)
    );
  };

  const cambiarCantidad = (
    producto: Producto,
    cambio: number
  ) => {
    setCantidades((actuales) => {
      const cantidadActual =
        actuales[producto.idProducto] ?? 0;

      const nuevaCantidad = Math.max(
        0,
        Math.min(
          cantidadActual + cambio,
          stockDisponible(producto)
        )
      );

      return {
        ...actuales,
        [producto.idProducto]: nuevaCantidad,
      };
    });
  };

  const total = useMemo(() => {
    return productos.reduce((acumulado, producto) => {
      const cantidad =
        cantidades[producto.idProducto] ?? 0;

      return (
        acumulado +
        Number(producto.precioVenta) * cantidad
      );
    }, 0);
  }, [productos, cantidades]);

  const cantidadTotal = useMemo(() => {
    return Object.values(cantidades).reduce(
      (total, cantidad) =>
        total + cantidad,
      0
    );
  }, [cantidades]);

  const guardarCambios = async () => {
    if (!venta) return;

    setError("");

    const productosSeleccionados = productos
      .filter(
        (producto) =>
          (cantidades[producto.idProducto] ?? 0) > 0
      )
      .map((producto) => ({
        idProducto: producto.idProducto,
        cantidad:
          cantidades[producto.idProducto] ?? 0,
      }));

    if (productosSeleccionados.length === 0) {
      setError(
        "La venta debe contener al menos un producto."
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Guardar los cambios de la venta #${venta.idVenta}?`
    );

    if (!confirmar) return;

    try {
      setGuardando(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ventas/${venta.idVenta}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metodoPago,
            productos: productosSeleccionados,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ??
            "No fue posible modificar la venta."
        );
      }

      router.push(`/ventas/${venta.idVenta}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error modificando la venta."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#F5F0E6] p-10 text-[#29321F]">
        Cargando venta...
      </main>
    );
  }

  if (error && !venta) {
    return (
      <main className="min-h-screen bg-[#F5F0E6] p-10 text-[#29321F]">

        <div className="rounded-3xl bg-red-100 p-6 text-red-700">
          {error}
        </div>

        <Link
          href="/ventas"
          className="mt-6 inline-block font-bold text-[#CF7B32]"
        >
          ← Volver a ventas
        </Link>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">

      <div className="mx-auto max-w-7xl">

        <div className="mb-8">

          <Link
            href={`/ventas/${id}`}
            className="font-bold text-[#CF7B32]"
          >
            ← Volver al detalle
          </Link>

        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
              Corrección
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Editar Venta #{id} ✏️
            </h1>

            <p className="mt-2 text-[#68715C]">
              Corrige productos, cantidades o método de pago.
            </p>

          </div>

        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-100 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* PRODUCTOS */}

          <section>

            <div className="grid gap-5 md:grid-cols-2">

              {productos.map((producto) => {
                const cantidad =
                  cantidades[producto.idProducto] ?? 0;

                const original =
                  cantidadOriginal(producto.idProducto);

                return (
                  <article
                    key={producto.idProducto}
                    className={`rounded-3xl border bg-white p-6 shadow-sm ${
                      cantidad > 0
                        ? "border-[#CF7B32]"
                        : "border-transparent"
                    }`}
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#CF7B32]">
                          Producto
                        </p>

                        <h2 className="mt-1 text-xl font-bold">
                          {producto.nombre}
                        </h2>
                      </div>

                      <p className="text-2xl font-black">
                        ${Number(producto.precioVenta).toFixed(0)}
                      </p>

                    </div>

                    <p className="mt-3 text-sm text-[#737A68]">
                      {producto.descripcion}
                    </p>

                    <div className="mt-5 flex items-center justify-between">

                      <div>
                        <p className="text-xs uppercase text-[#8A907E]">
                          Disponible
                        </p>

                        <p className="font-bold">
                          {stockDisponible(producto)} bolsas
                        </p>

                        {original > 0 && (
                          <p className="mt-1 text-xs font-bold text-[#CF7B32]">
                            Actual en venta: {original}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">

                        <button
                          type="button"
                          onClick={() =>
                            cambiarCantidad(producto, -1)
                          }
                          disabled={cantidad === 0}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8D0BE] text-xl font-bold disabled:opacity-30"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-2xl font-black">
                          {cantidad}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            cambiarCantidad(producto, 1)
                          }
                          disabled={
                            cantidad >=
                            stockDisponible(producto)
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4E5A36] text-xl font-bold text-white disabled:opacity-30"
                        >
                          +
                        </button>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

          </section>

          {/* RESUMEN */}

          <aside>

            <div className="sticky top-8 rounded-3xl bg-[#29321F] p-7 text-white shadow-lg">

              <p className="text-sm font-bold uppercase tracking-widest text-[#E8A35C]">
                Nueva versión
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Venta #{id}
              </h2>

              <div className="my-7 border-t border-white/20" />

              <div className="space-y-4">

                {productos
                  .filter(
                    (producto) =>
                      (cantidades[producto.idProducto] ?? 0) > 0
                  )
                  .map((producto) => {
                    const cantidad =
                      cantidades[producto.idProducto] ?? 0;

                    return (
                      <div
                        key={producto.idProducto}
                        className="flex justify-between gap-4"
                      >

                        <div>
                          <p className="font-semibold">
                            {producto.nombre}
                          </p>

                          <p className="text-sm text-white/60">
                            {cantidad} × $
                            {Number(
                              producto.precioVenta
                            ).toFixed(0)}
                          </p>
                        </div>

                        <p className="font-bold">
                          $
                          {(
                            cantidad *
                            Number(producto.precioVenta)
                          ).toFixed(2)}
                        </p>

                      </div>
                    );
                  })}

              </div>

              <div className="my-7 border-t border-white/20" />

              <div className="flex items-end justify-between">

                <div>
                  <p className="text-sm text-white/60">
                    Nuevo total
                  </p>

                  <p className="text-xs text-white/40">
                    {cantidadTotal} bolsa(s)
                  </p>
                </div>

                <p className="text-4xl font-black">
                  ${total.toFixed(2)}
                </p>

              </div>

              {/* MÉTODO DE PAGO */}

              <div className="mt-8">

                <p className="mb-3 text-sm font-semibold">
                  Método de pago
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setMetodoPago("EFECTIVO")
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-bold ${
                      metodoPago === "EFECTIVO"
                        ? "bg-[#E78A32]"
                        : "bg-white/10"
                    }`}
                  >
                    💵 Efectivo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMetodoPago("TRANSFERENCIA")
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-bold ${
                      metodoPago === "TRANSFERENCIA"
                        ? "bg-[#E78A32]"
                        : "bg-white/10"
                    }`}
                  >
                    📲 Transferencia
                  </button>

                </div>

              </div>

              {/* GUARDAR */}

              <button
                type="button"
                onClick={guardarCambios}
                disabled={
                  guardando ||
                  cantidadTotal === 0
                }
                className="mt-7 w-full rounded-2xl bg-[#E78A32] px-5 py-4 text-lg font-black text-white transition hover:scale-[1.01] disabled:opacity-40"
              >
                {guardando
                  ? "GUARDANDO..."
                  : "GUARDAR CAMBIOS"}
              </button>

              <Link
                href={`/ventas/${id}`}
                className="mt-3 block w-full rounded-2xl bg-white/10 px-5 py-3 text-center font-bold text-white/70"
              >
                Cancelar edición
              </Link>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}