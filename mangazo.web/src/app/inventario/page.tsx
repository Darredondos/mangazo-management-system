"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Producto = {
  idProducto: number;
  nombre: string;
  stockActual: number;
  precioVenta: number;
  costoActual: number;
  stockBajo: boolean;
};

type Movimiento = {
  idMovimiento: number;
  producto: string;
  idVenta: number | null;
  tipoMovimiento: string;
  cantidad: number;
  motivo: string | null;
  fechaMovimiento: string;
};

type LineaEntrada = {
  id: number;
  idProducto: string;
  cantidad: string;
};

export default function InventarioPage() {
  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [movimientos, setMovimientos] =
    useState<Movimiento[]>([]);

  const [mostrarEntrada, setMostrarEntrada] =
    useState(false);

  const [lineas, setLineas] =
    useState<LineaEntrada[]>([
      {
        id: 1,
        idProducto: "",
        cantidad: "",
      },
    ]);

  const [motivo, setMotivo] =
    useState("Producción nueva");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  // =========================================================
  // CARGAR INVENTARIO
  // =========================================================

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        productosResponse,
        movimientosResponse,
      ] = await Promise.all([
        apiFetch("/api/inventario"),
        apiFetch("/api/inventario/movimientos"),
      ]);

      if (
        !productosResponse.ok ||
        !movimientosResponse.ok
      ) {
        throw new Error(
          "No fue posible cargar el inventario."
        );
      }

      const productosData =
        await productosResponse.json();

      const movimientosData =
        await movimientosResponse.json();

      setProductos(productosData);
      setMovimientos(movimientosData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cargando el inventario."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // =========================================================
  // AGREGAR FILA
  // =========================================================

  const agregarLinea = () => {
    setLineas((actuales) => [
      ...actuales,
      {
        id:
          Date.now() +
          Math.floor(
            Math.random() * 1000
          ),

        idProducto: "",
        cantidad: "",
      },
    ]);
  };

  // =========================================================
  // QUITAR FILA
  // =========================================================

  const quitarLinea = (id: number) => {
    setLineas((actuales) => {
      if (actuales.length === 1) {
        return actuales;
      }

      return actuales.filter(
        (linea) =>
          linea.id !== id
      );
    });
  };

  // =========================================================
  // MODIFICAR FILA
  // =========================================================

  const actualizarLinea = (
    id: number,
    campo:
      | "idProducto"
      | "cantidad",
    valor: string
  ) => {
    setLineas((actuales) =>
      actuales.map((linea) =>
        linea.id === id
          ? {
              ...linea,
              [campo]: valor,
            }
          : linea
      )
    );
  };

  // =========================================================
  // PRODUCTOS YA UTILIZADOS
  // =========================================================

  const idsSeleccionados =
    lineas
      .filter(
        (linea) =>
          linea.idProducto !== ""
      )
      .map(
        (linea) =>
          Number(linea.idProducto)
      );

  // =========================================================
  // TOTAL BOLSAS
  // =========================================================

  const totalEntrada =
    useMemo(() => {
      return lineas.reduce(
        (total, linea) =>
          total +
          (
            Number(
              linea.cantidad
            ) || 0
          ),
        0
      );
    }, [lineas]);

  // =========================================================
  // REGISTRAR ENTRADA
  // =========================================================

  const registrarEntrada = async () => {
    setError("");
    setMensaje("");

    const lineasValidas =
      lineas.filter(
        (linea) =>
          linea.idProducto &&
          Number(
            linea.cantidad
          ) > 0
      );

    if (
      lineasValidas.length === 0
    ) {
      setError(
        "Agrega al menos un producto con una cantidad válida."
      );

      return;
    }

    if (
      lineasValidas.length !==
      lineas.length
    ) {
      setError(
        "Completa todos los productos y cantidades antes de registrar."
      );

      return;
    }

    const productosSeleccionados =
      lineasValidas.map(
        (linea) => ({
          idProducto:
            Number(
              linea.idProducto
            ),

          cantidad:
            Number(
              linea.cantidad
            ),
        })
      );

    const ids =
      productosSeleccionados.map(
        (producto) =>
          producto.idProducto
      );

    const idsUnicos =
      new Set(ids);

    if (
      idsUnicos.size !==
      ids.length
    ) {
      setError(
        "No puedes seleccionar el mismo producto más de una vez."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Registrar entrada de ${totalEntrada} bolsa(s) al inventario?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setGuardando(true);

      const response = await apiFetch(
        "/api/inventario/entrada-multiple",
        {
          method: "POST",

          body: JSON.stringify({
            productos:
              productosSeleccionados,

            motivo:
              motivo.trim() ||
              "Producción nueva",
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.mensaje ??
            "No fue posible registrar la entrada."
        );
      }

      setMensaje(
        `Entrada registrada: ${data.totalBolsas} bolsa(s) en ${data.totalProductos} producto(s).`
      );

      setLineas([
        {
          id: Date.now(),
          idProducto: "",
          cantidad: "",
        },
      ]);

      setMotivo(
        "Producción nueva"
      );

      setMostrarEntrada(false);

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error registrando la entrada."
      );
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // MÉTRICAS
  // =========================================================

  const stockTotal =
    productos.reduce(
      (total, producto) =>
        total +
        producto.stockActual,
      0
    );

  const productosStockBajo =
    productos.filter(
      (producto) =>
        producto.stockBajo
    ).length;

  const valorInventario =
    productos.reduce(
      (total, producto) =>
        total +
        Number(
          producto.costoActual
        ) *
          producto.stockActual,
      0
    );

  // =========================================================
  // FORMATOS
  // =========================================================

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

  const formatearFecha = (
    fecha: string
  ) =>
    new Intl.DateTimeFormat(
      "es-MX",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(
      new Date(fecha)
    );

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">

      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
              Operación
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Inventario 📦
            </h1>

            <p className="mt-2 text-[#68715C]">
              Control de existencias y movimientos de Mangazo.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarEntrada(
                !mostrarEntrada
              )
            }
            className="rounded-2xl bg-[#E78A32] px-6 py-4 font-black text-white shadow-sm transition hover:scale-[1.02]"
          >
            + REGISTRAR ENTRADA
          </button>

        </div>

        {/* MENSAJES */}

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

        {/* =====================================================
            ENTRADA MÚLTIPLE
        ===================================================== */}

        {mostrarEntrada && (

          <section className="mt-8 rounded-3xl bg-[#29321F] p-7 text-white shadow-lg">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-widest text-[#E8A35C]">
                  Inventario
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Nueva entrada
                </h2>

                <p className="mt-2 text-sm text-white/60">
                  Agrega varios productos en una sola operación.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarEntrada(
                    false
                  )
                }
                className="text-3xl text-white/50 hover:text-white"
              >
                ×
              </button>

            </div>

            {/* FILAS */}

            <div className="mt-7 space-y-4">

              {lineas.map(
                (linea, index) => {

                  const producto =
                    productos.find(
                      (p) =>
                        p.idProducto ===
                        Number(
                          linea.idProducto
                        )
                    );

                  const cantidad =
                    Number(
                      linea.cantidad
                    ) || 0;

                  const nuevoStock =
                    producto
                      ? producto.stockActual +
                        cantidad
                      : null;

                  return (

                    <div
                      key={linea.id}
                      className="rounded-2xl bg-white/10 p-5"
                    >

                      <div className="grid gap-4 md:grid-cols-[1fr_150px_200px_48px] md:items-end">

                        {/* PRODUCTO */}

                        <div>

                          <label className="mb-2 block text-sm font-bold">
                            Producto{" "}
                            {index + 1}
                          </label>

                          <select
                            value={
                              linea.idProducto
                            }
                            onChange={(
                              e
                            ) =>
                              actualizarLinea(
                                linea.id,
                                "idProducto",
                                e.target
                                  .value
                              )
                            }
                            className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                          >

                            <option value="">
                              Selecciona un producto
                            </option>

                            {productos.map(
                              (
                                item
                              ) => {

                                const usadoEnOtraLinea =
                                  idsSeleccionados.includes(
                                    item.idProducto
                                  ) &&
                                  Number(
                                    linea.idProducto
                                  ) !==
                                    item.idProducto;

                                return (
                                  <option
                                    key={
                                      item.idProducto
                                    }
                                    value={
                                      item.idProducto
                                    }
                                    disabled={
                                      usadoEnOtraLinea
                                    }
                                  >
                                    {
                                      item.nombre
                                    }
                                  </option>
                                );
                              }
                            )}

                          </select>

                        </div>

                        {/* CANTIDAD */}

                        <div>

                          <label className="mb-2 block text-sm font-bold">
                            Cantidad
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              linea.cantidad
                            }
                            onChange={(
                              e
                            ) =>
                              actualizarLinea(
                                linea.id,
                                "cantidad",
                                e.target
                                  .value
                              )
                            }
                            placeholder="0"
                            className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                          />

                        </div>

                        {/* PREVIEW */}

                        <div>

                          <p className="mb-2 text-sm font-bold">
                            Stock
                          </p>

                          <div className="rounded-2xl bg-black/20 px-4 py-3">

                            {producto ? (
                              <p className="font-black">

                                {
                                  producto.stockActual
                                }

                                <span className="mx-2 text-white/40">
                                  →
                                </span>

                                <span className="text-[#E8A35C]">
                                  {
                                    nuevoStock
                                  }
                                </span>

                              </p>
                            ) : (
                              <p className="text-white/40">
                                —
                              </p>
                            )}

                          </div>

                        </div>

                        {/* ELIMINAR */}

                        <button
                          type="button"
                          onClick={() =>
                            quitarLinea(
                              linea.id
                            )
                          }
                          disabled={
                            lineas.length ===
                            1
                          }
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-lg text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-20"
                          title="Quitar producto"
                        >
                          ×
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

            {/* AGREGAR PRODUCTO */}

            <button
              type="button"
              onClick={
                agregarLinea
              }
              disabled={
                lineas.length >=
                productos.length
              }
              className="mt-5 rounded-2xl border border-dashed border-white/30 px-5 py-3 font-bold text-white/70 transition hover:border-[#E8A35C] hover:text-[#E8A35C] disabled:opacity-30"
            >
              ＋ Agregar otro producto
            </button>

            {/* MOTIVO */}

            <div className="mt-7">

              <label className="mb-2 block text-sm font-bold">
                Motivo
              </label>

              <input
                value={motivo}
                onChange={(e) =>
                  setMotivo(
                    e.target.value
                  )
                }
                placeholder="Producción nueva"
                className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
              />

            </div>

            {/* RESUMEN */}

            <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm text-white/60">
                  Total a ingresar
                </p>

                <p className="mt-1 text-3xl font-black">
                  {totalEntrada}{" "}
                  <span className="text-lg text-white/50">
                    bolsas
                  </span>
                </p>

              </div>

              <div className="text-sm text-white/60">
                {
                  lineas.filter(
                    (linea) =>
                      linea.idProducto &&
                      Number(
                        linea.cantidad
                      ) > 0
                  ).length
                }{" "}
                producto(s)
              </div>

            </div>

            {/* ACCIONES */}

            <div className="mt-7 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setMostrarEntrada(
                    false
                  )
                }
                className="rounded-2xl bg-white/10 px-5 py-3 font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  registrarEntrada
                }
                disabled={
                  guardando ||
                  totalEntrada === 0
                }
                className="rounded-2xl bg-[#E78A32] px-7 py-3 font-black text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guardando
                  ? "REGISTRANDO..."
                  : "REGISTRAR ENTRADA"}
              </button>

            </div>

          </section>
        )}

        {/* =====================================================
            KPIs
        ===================================================== */}

        <section className="mt-8 grid gap-5 md:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Stock total
            </p>

            <p className="mt-3 text-4xl font-black">
              {stockTotal}
            </p>

            <p className="mt-1 text-xs text-[#8A907E]">
              bolsas
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Productos activos
            </p>

            <p className="mt-3 text-4xl font-black">
              {productos.length}
            </p>

          </div>

          <div
            className={`rounded-3xl p-6 text-white shadow-sm ${
              productosStockBajo > 0
                ? "bg-[#E78A32]"
                : "bg-[#4E5A36]"
            }`}
          >

            <p className="text-sm text-white/70">
              Stock bajo
            </p>

            <p className="mt-3 text-4xl font-black">
              {
                productosStockBajo
              }
            </p>

          </div>

          <div className="rounded-3xl bg-[#29321F] p-6 text-white shadow-sm">

            <p className="text-sm text-white/60">
              Valor del inventario
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatearDinero(
                valorInventario
              )}
            </p>

            <p className="mt-1 text-xs text-white/40">
              A costo actual
            </p>

          </div>

        </section>

        {/* =====================================================
            EXISTENCIAS
        ===================================================== */}

        <section className="mt-10">

          <h2 className="text-2xl font-black">
            Existencias
          </h2>

          <p className="mt-1 text-sm text-[#737A68]">
            Stock disponible por producto.
          </p>

          {cargando ? (

            <div className="mt-5 rounded-3xl bg-white p-10 text-center">
              Cargando inventario...
            </div>

          ) : (

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

              {productos.map(
                (producto) => (

                  <article
                    key={
                      producto.idProducto
                    }
                    className={`rounded-3xl bg-white p-6 shadow-sm ${
                      producto.stockBajo
                        ? "ring-2 ring-[#E78A32]"
                        : ""
                    }`}
                  >

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        producto.stockBajo
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {producto.stockBajo
                        ? "⚠ Stock bajo"
                        : "Disponible"}
                    </span>

                    <h3 className="mt-5 min-h-12 text-lg font-black">
                      {
                        producto.nombre
                      }
                    </h3>

                    <p className="mt-4 text-5xl font-black">
                      {
                        producto.stockActual
                      }
                    </p>

                    <p className="text-sm text-[#737A68]">
                      bolsas disponibles
                    </p>

                    <div className="mt-5 border-t border-[#EEE8DC] pt-4">

                      <div className="flex justify-between text-sm">

                        <span className="text-[#8A907E]">
                          Costo
                        </span>

                        <span className="font-bold">
                          {formatearDinero(
                            Number(
                              producto.costoActual
                            )
                          )}
                        </span>

                      </div>

                      <div className="mt-2 flex justify-between text-sm">

                        <span className="text-[#8A907E]">
                          Venta
                        </span>

                        <span className="font-bold">
                          {formatearDinero(
                            Number(
                              producto.precioVenta
                            )
                          )}
                        </span>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

        {/* =====================================================
            MOVIMIENTOS
        ===================================================== */}

        <section className="mt-10">

          <div className="mb-5">

            <h2 className="text-2xl font-black">
              Movimientos recientes
            </h2>

            <p className="mt-1 text-sm text-[#737A68]">
              Más nuevos primero.
            </p>

          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-[#29321F] text-left text-sm text-white">

                  <tr>
                    <th className="px-6 py-4">
                      Fecha
                    </th>

                    <th className="px-6 py-4">
                      Producto
                    </th>

                    <th className="px-6 py-4">
                      Tipo
                    </th>

                    <th className="px-6 py-4">
                      Cantidad
                    </th>

                    <th className="px-6 py-4">
                      Motivo
                    </th>

                    <th className="px-6 py-4">
                      Venta
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {movimientos.map(
                    (movimiento) => (

                      <tr
                        key={
                          movimiento.idMovimiento
                        }
                        className="border-b border-[#EEE8DC] last:border-none"
                      >

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-[#68715C]">

                          {formatearFecha(
                            movimiento.fechaMovimiento
                          )}

                        </td>

                        <td className="px-6 py-5 font-bold">
                          {
                            movimiento.producto
                          }
                        </td>

                        <td className="px-6 py-5">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              movimiento.tipoMovimiento ===
                              "ENTRADA"
                                ? "bg-green-100 text-green-700"
                                : movimiento.tipoMovimiento ===
                                  "SALIDA"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {
                              movimiento.tipoMovimiento
                            }
                          </span>

                        </td>

                        <td className="px-6 py-5 font-black">

                          {movimiento.tipoMovimiento ===
                          "ENTRADA"
                            ? "+"
                            : movimiento.tipoMovimiento ===
                              "SALIDA"
                            ? "-"
                            : ""}

                          {
                            movimiento.cantidad
                          }

                        </td>

                        <td className="px-6 py-5 text-sm text-[#68715C]">
                          {movimiento.motivo ||
                            "—"}
                        </td>

                        <td className="px-6 py-5 text-sm">

                          {movimiento.idVenta ? (

                            <span className="font-bold text-[#CF7B32]">
                              #
                              {
                                movimiento.idVenta
                              }
                            </span>

                          ) : (

                            <span className="text-[#AAAFA3]">
                              —
                            </span>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                  {movimientos.length ===
                    0 && (

                    <tr>

                      <td
                        colSpan={6}
                        className="p-10 text-center text-[#737A68]"
                      >
                        Todavía no hay movimientos registrados.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}