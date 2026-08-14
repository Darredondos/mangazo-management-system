"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Producto = {
  idProducto: number;
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  costoActual: number;
  stockActual: number;
  activo: boolean;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoEditando, setProductoEditando] =
    useState<Producto | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await apiFetch(
        "/api/productos"
      );

      if (!response.ok) {
        throw new Error(
          "No fue posible cargar los productos."
        );
      }

      const data: Producto[] =
        await response.json();

      setProductos(data);
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

  useEffect(() => {
    cargarProductos();
  }, []);

  const guardarProducto = async () => {
    if (!productoEditando) return;

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const response = await apiFetch(
        `/api/productos/${productoEditando.idProducto}`,
        {
          method: "PUT",

          body: JSON.stringify({
            nombre:
              productoEditando.nombre,

            descripcion:
              productoEditando.descripcion,

            precioVenta:
              Number(
                productoEditando.precioVenta
              ),

            costoActual:
              Number(
                productoEditando.costoActual
              ),

            activo:
              productoEditando.activo,
          }),
        }
      );

      let data;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.mensaje ??
            "No fue posible actualizar el producto."
        );
      }

      setMensaje(
        data?.mensaje ??
          "Producto actualizado correctamente."
      );

      setProductoEditando(null);

      await cargarProductos();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error actualizando el producto."
      );
    } finally {
      setGuardando(false);
    }
  };

  const formatearDinero = (
    cantidad: number
  ) =>
    new Intl.NumberFormat(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
      }
    ).format(cantidad);

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">

      <div className="mx-auto max-w-7xl">

        <div>

          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
            Catálogo
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Productos 🥭
          </h1>

          <p className="mt-2 text-[#68715C]">
            Administra precios, costos y disponibilidad.
          </p>

        </div>

        {mensaje && (
          <div className="mt-6 rounded-2xl bg-green-100 p-5 font-semibold text-green-800">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-100 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        {cargando ? (

          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
            Cargando productos...
          </div>

        ) : (

          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            {productos.map(
              (producto) => (

                <article
                  key={
                    producto.idProducto
                  }
                  className="rounded-3xl bg-white p-6 shadow-sm"
                >

                  <div className="flex items-center justify-between">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        producto.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {producto.activo
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                    <span className="text-sm font-bold text-[#8A907E]">
                      #{producto.idProducto}
                    </span>

                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    {producto.nombre}
                  </h2>

                  <p className="mt-2 min-h-12 text-sm text-[#737A68]">
                    {producto.descripcion}
                  </p>

                  <div className="mt-6 space-y-3 border-t border-[#EEE8DC] pt-5">

                    <div className="flex justify-between">

                      <span className="text-sm text-[#737A68]">
                        Precio
                      </span>

                      <span className="font-black">
                        {formatearDinero(
                          Number(
                            producto.precioVenta
                          )
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-sm text-[#737A68]">
                        Costo
                      </span>

                      <span className="font-black">
                        {formatearDinero(
                          Number(
                            producto.costoActual
                          )
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-sm text-[#737A68]">
                        Stock
                      </span>

                      <span className="font-black">
                        {producto.stockActual}
                      </span>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setProductoEditando({
                        ...producto,
                      })
                    }
                    className="mt-6 w-full rounded-2xl bg-[#29321F] px-4 py-3 font-black text-white"
                  >
                    ✏️ EDITAR
                  </button>

                </article>
              )
            )}

          </section>

        )}

        {productoEditando && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">

            <div className="w-full max-w-xl rounded-3xl bg-[#29321F] p-7 text-white shadow-2xl">

              <div className="flex justify-between">

                <div>

                  <p className="text-sm font-black uppercase tracking-widest text-[#E8A35C]">
                    Producto
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Editar #
                    {
                      productoEditando.idProducto
                    }
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProductoEditando(
                      null
                    )
                  }
                  className="text-3xl text-white/50"
                >
                  ×
                </button>

              </div>

              <div className="mt-7 space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-bold">
                    Nombre
                  </label>

                  <input
                    value={
                      productoEditando.nombre
                    }
                    onChange={(e) =>
                      setProductoEditando({
                        ...productoEditando,

                        nombre:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold">
                    Descripción
                  </label>

                  <textarea
                    value={
                      productoEditando.descripcion ??
                      ""
                    }
                    onChange={(e) =>
                      setProductoEditando({
                        ...productoEditando,

                        descripcion:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                  />

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-bold">
                      Precio de venta
                    </label>

                    <input
                      type="number"
                      value={
                        productoEditando.precioVenta
                      }
                      onChange={(e) =>
                        setProductoEditando({
                          ...productoEditando,

                          precioVenta:
                            Number(
                              e.target.value
                            ),
                        })
                      }
                      className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-bold">
                      Costo actual
                    </label>

                    <input
                      type="number"
                      value={
                        productoEditando.costoActual
                      }
                      onChange={(e) =>
                        setProductoEditando({
                          ...productoEditando,

                          costoActual:
                            Number(
                              e.target.value
                            ),
                        })
                      }
                      className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                    />

                  </div>

                </div>

                <label className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">

                  <input
                    type="checkbox"
                    checked={
                      productoEditando.activo
                    }
                    onChange={(e) =>
                      setProductoEditando({
                        ...productoEditando,

                        activo:
                          e.target.checked,
                      })
                    }
                  />

                  <span className="font-bold">
                    Producto activo
                  </span>

                </label>

              </div>

              <button
                type="button"
                onClick={
                  guardarProducto
                }
                disabled={
                  guardando
                }
                className="mt-7 w-full rounded-2xl bg-[#E78A32] px-5 py-4 font-black disabled:opacity-50"
              >
                {guardando
                  ? "GUARDANDO..."
                  : "GUARDAR CAMBIOS"}
              </button>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}