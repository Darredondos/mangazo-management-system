"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Producto = {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  stockActual: number;
  activo: boolean;
};

type Cantidades = Record<number, number>;

export default function NuevaVentaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Cantidades>({});
  const [metodoPago, setMetodoPago] = useState("TRANSFERENCIA");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/productos`
      );

      if (!response.ok) {
        throw new Error("No fue posible cargar los productos.");
      }

      const data: Producto[] = await response.json();

      setProductos(data.filter((producto) => producto.activo));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cargando los productos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

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
          producto.stockActual
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
        producto.precioVenta * cantidad
      );
    }, 0);
  }, [productos, cantidades]);

  const cantidadTotal = useMemo(() => {
    return Object.values(cantidades).reduce(
      (total, cantidad) => total + cantidad,
      0
    );
  }, [cantidades]);

  const registrarVenta = async () => {
    setError("");
    setMensaje("");

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
        "Selecciona al menos un producto para registrar la venta."
      );
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ventas`,
        {
          method: "POST",
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
            "No fue posible registrar la venta."
        );
      }

      setMensaje(
        `Venta #${data.idVenta} registrada correctamente por $${Number(
          data.totalVenta
        ).toFixed(2)}`
      );

      setCantidades({});

      await cargarProductos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error registrando la venta."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#29321F]">


      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#CF7B32]">
            Ventas
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Nueva venta 🥭
          </h1>

          <p className="mt-2 text-[#68715C]">
            Selecciona los productos que se llevará el cliente.
          </p>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-2xl bg-green-100 p-5 font-semibold text-green-800">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-100 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* PRODUCTOS */}

          <section>
            {cargando ? (
              <p>Cargando productos...</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">

                {productos.map((producto) => {
                  const cantidad =
                    cantidades[producto.idProducto] ?? 0;

                  return (
                    <article
                      key={producto.idProducto}
                      className={`rounded-3xl border bg-white p-6 shadow-sm transition ${
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
                          ${producto.precioVenta}
                        </p>

                      </div>

                      <p className="mt-3 text-sm text-[#737A68]">
                        {producto.descripcion}
                      </p>

                      <div className="mt-6 flex items-center justify-between">

                        <div>
                          <p className="text-xs uppercase text-[#8A907E]">
                            Disponible
                          </p>

                          <p className="font-bold">
                            {producto.stockActual} bolsas
                          </p>
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
                              cantidad >= producto.stockActual
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
            )}
          </section>

          {/* RESUMEN */}

          <aside>
            <div className="sticky top-8 rounded-3xl bg-[#29321F] p-7 text-white shadow-lg">

              <p className="text-sm font-bold uppercase tracking-widest text-[#E8A35C]">
                Resumen
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Tu venta
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
                            {cantidad} × ${producto.precioVenta}
                          </p>
                        </div>

                        <p className="font-bold">
                          $
                          {(
                            cantidad *
                            producto.precioVenta
                          ).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}

                {cantidadTotal === 0 && (
                  <p className="text-sm text-white/50">
                    Todavía no has seleccionado productos.
                  </p>
                )}

              </div>

              <div className="my-7 border-t border-white/20" />

              <div className="flex items-end justify-between">

                <div>
                  <p className="text-sm text-white/60">
                    Total
                  </p>

                  <p className="text-xs text-white/40">
                    {cantidadTotal} producto(s)
                  </p>
                </div>

                <p className="text-4xl font-black">
                  ${total.toFixed(2)}
                </p>

              </div>

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
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                      metodoPago === "EFECTIVO"
                        ? "bg-[#E78A32] text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    💵 Efectivo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMetodoPago("TRANSFERENCIA")
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                      metodoPago === "TRANSFERENCIA"
                        ? "bg-[#E78A32] text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    📲 Transferencia
                  </button>

                </div>

              </div>

              <button
                type="button"
                onClick={registrarVenta}
                disabled={
                  guardando ||
                  cantidadTotal === 0
                }
                className="mt-7 w-full rounded-2xl bg-[#E78A32] px-5 py-4 text-lg font-black text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guardando
                  ? "REGISTRANDO..."
                  : "REGISTRAR VENTA"}
              </button>

            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}