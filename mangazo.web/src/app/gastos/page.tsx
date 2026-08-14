"use client";

import { useEffect, useMemo, useState } from "react";

type Gasto = {
  idGasto: number;
  concepto: string;
  descripcion: string | null;
  categoria: string;
  monto: number;
  fechaGasto: string;
};

const categorias = [
  "INSUMOS",
  "EMPAQUE",
  "ETIQUETAS",
  "PUBLICIDAD",
  "PAQUETERIA",
  "OTROS",
];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [gastoEditando, setGastoEditando] =
    useState<Gasto | null>(null);

  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] =
    useState("MATERIA_PRIMA");
  const [monto, setMonto] = useState("");
  const [fechaGasto, setFechaGasto] =
    useState(
      new Date().toISOString().split("T")[0]
    );

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  // =========================================================
  // CARGAR GASTOS
  // =========================================================

  const cargarGastos = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gastos`
      );

      if (!response.ok) {
        throw new Error(
          "No fue posible cargar los gastos."
        );
      }

      const data: Gasto[] =
        await response.json();

      setGastos(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cargando los gastos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarGastos();
  }, []);

  // =========================================================
  // CREAR GASTO
  // =========================================================

  const registrarGasto = async () => {
    setError("");
    setMensaje("");

    if (!concepto.trim()) {
      setError(
        "Ingresa el concepto del gasto."
      );
      return;
    }

    if (!monto || Number(monto) <= 0) {
      setError(
        "Ingresa un monto válido."
      );
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gastos`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            concepto,
            descripcion:
              descripcion.trim() || null,
            categoria,
            monto: Number(monto),

            fechaGasto:
              fechaGasto
                ? `${fechaGasto}T12:00:00`
                : null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ??
            "No fue posible registrar el gasto."
        );
      }

      setMensaje(
        `Registro "${data.concepto}" guardado correctamente.`
      );

      setConcepto("");
      setDescripcion("");
      setCategoria("MATERIA_PRIMA");
      setMonto("");

      setFechaGasto(
        new Date()
          .toISOString()
          .split("T")[0]
      );

      setMostrarFormulario(false);

      await cargarGastos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error registrando el gasto."
      );
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // MODIFICAR REGISTRO
  // =========================================================

  const modificarGasto = async () => {
    if (!gastoEditando) return;

    setError("");
    setMensaje("");

    if (!gastoEditando.concepto.trim()) {
      setError(
        "El concepto es obligatorio."
      );
      return;
    }

    if (
      !gastoEditando.categoria.trim()
    ) {
      setError(
        "La categoría es obligatoria."
      );
      return;
    }

    if (
      Number(gastoEditando.monto) <= 0
    ) {
      setError(
        "Ingresa un monto válido."
      );
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gastos/${gastoEditando.idGasto}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            concepto:
              gastoEditando.concepto,

            descripcion:
              gastoEditando.descripcion,

            categoria:
              gastoEditando.categoria,

            monto:
              Number(gastoEditando.monto),

            fechaGasto:
              gastoEditando.fechaGasto,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ??
            "No fue posible modificar el registro."
        );
      }

      setMensaje(
        data.mensaje ??
          "Registro modificado correctamente."
      );

      setGastoEditando(null);

      await cargarGastos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error modificando el registro."
      );
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // ELIMINAR
  // =========================================================

  const eliminarGasto = async (
    gasto: Gasto
  ) => {
    const confirmar =
      window.confirm(
        `¿Seguro que quieres eliminar el registro "${gasto.concepto}" por ${formatearDinero(
          Number(gasto.monto)
        )}?`
      );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gastos/${gasto.idGasto}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ??
            "No fue posible eliminar el registro."
        );
      }

      setMensaje(data.mensaje);

      await cargarGastos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error eliminando el registro."
      );
    }
  };

  // =========================================================
  // MÉTRICAS
  // =========================================================

  const totalGastos = useMemo(
    () =>
      gastos.reduce(
        (total, gasto) =>
          total +
          Number(gasto.monto),
        0
      ),
    [gastos]
  );

  const mesActual =
    new Date().getMonth();

  const anioActual =
    new Date().getFullYear();

  const gastosMes = useMemo(
    () =>
      gastos
        .filter((gasto) => {
          const fecha =
            new Date(gasto.fechaGasto);

          return (
            fecha.getMonth() ===
              mesActual &&
            fecha.getFullYear() ===
              anioActual
          );
        })
        .reduce(
          (total, gasto) =>
            total +
            Number(gasto.monto),
          0
        ),
    [gastos, mesActual, anioActual]
  );

  const categoriaMayor =
    useMemo(() => {
      const totales:
        Record<string, number> = {};

      gastos.forEach((gasto) => {
        totales[gasto.categoria] =
          (totales[
            gasto.categoria
          ] ?? 0) +
          Number(gasto.monto);
      });

      const resultado =
        Object.entries(totales)
          .sort(
            (a, b) =>
              b[1] - a[1]
          )[0];

      return resultado
        ? {
            categoria:
              resultado[0],

            total:
              resultado[1],
          }
        : null;
    }, [gastos]);

  // =========================================================
  // FORMATOS
  // =========================================================

  function formatearDinero(
    cantidad: number
  ) {
    return new Intl.NumberFormat(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
      }
    ).format(cantidad);
  }

  const formatearFecha = (
    fecha: string
  ) =>
    new Intl.DateTimeFormat(
      "es-MX",
      {
        dateStyle: "medium",
      }
    ).format(new Date(fecha));

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
              Finanzas
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Gastos 💸
            </h1>

            <p className="mt-2 text-[#68715C]">
              Control de egresos y registros de Mangazo.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarFormulario(
                !mostrarFormulario
              )
            }
            className="rounded-2xl bg-[#E78A32] px-6 py-4 font-black text-white shadow-sm transition hover:scale-[1.02]"
          >
            + REGISTRAR GASTO
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

        {/* NUEVO REGISTRO */}

        {mostrarFormulario && (

          <section className="mt-8 rounded-3xl bg-[#29321F] p-7 text-white shadow-lg">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-widest text-[#E8A35C]">
                  Nuevo registro
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Registrar gasto
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarFormulario(
                    false
                  )
                }
                className="text-3xl text-white/50 hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Concepto
                </label>

                <input
                  value={concepto}
                  onChange={(e) =>
                    setConcepto(
                      e.target.value
                    )
                  }
                  placeholder="Ej. Compra de mango"
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Categoría
                </label>

                <select
                  value={categoria}
                  onChange={(e) =>
                    setCategoria(
                      e.target.value
                    )
                  }
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                >

                  {categorias.map(
                    (item) => (

                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Monto
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={monto}
                  onChange={(e) =>
                    setMonto(
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Fecha
                </label>

                <input
                  type="date"
                  value={fechaGasto}
                  onChange={(e) =>
                    setFechaGasto(
                      e.target.value
                    )
                  }
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                />

              </div>

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-bold">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(
                      e.target.value
                    )
                  }
                  placeholder="Opcional"
                  rows={3}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                />

              </div>

            </div>

            <div className="mt-7 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setMostrarFormulario(
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
                  registrarGasto
                }
                disabled={
                  guardando
                }
                className="rounded-2xl bg-[#E78A32] px-6 py-3 font-black disabled:opacity-50"
              >
                {guardando
                  ? "REGISTRANDO..."
                  : "REGISTRAR GASTO"}
              </button>

            </div>

          </section>

        )}

        {/* KPIs */}

        <section className="mt-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm text-[#737A68]">
              Gastos este mes
            </p>

            <p className="mt-3 text-4xl font-black">
              {formatearDinero(
                gastosMes
              )}
            </p>

          </div>

          <div className="rounded-3xl bg-[#29321F] p-6 text-white shadow-sm">

            <p className="text-sm text-white/60">
              Registros
            </p>

            <p className="mt-3 text-4xl font-black">
              {gastos.length}
            </p>

          </div>

          <div className="rounded-3xl bg-[#4E5A36] p-6 text-white shadow-sm">

            <p className="text-sm text-white/60">
              Mayor categoría
            </p>

            <p className="mt-3 text-2xl font-black">
              {categoriaMayor
                ?.categoria ?? "—"}
            </p>

            <p className="mt-1 text-sm text-white/60">
              {categoriaMayor
                ? formatearDinero(
                    categoriaMayor.total
                  )
                : ""}
            </p>

          </div>

        </section>

        {/* HISTORIAL */}

        <section className="mt-10">

          <div className="mb-5">

            <h2 className="text-2xl font-black">
              Historial de gastos
            </h2>

            <p className="mt-1 text-sm text-[#737A68]">
              Total histórico:{" "}
              {formatearDinero(
                totalGastos
              )}
            </p>

          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-[#29321F] text-left text-sm text-white">

                  <tr>

                    <th className="px-6 py-4">
                      #
                    </th>

                    <th className="px-6 py-4">
                      Fecha
                    </th>

                    <th className="px-6 py-4">
                      Concepto
                    </th>

                    <th className="px-6 py-4">
                      Categoría
                    </th>

                    <th className="px-6 py-4">
                      Descripción
                    </th>

                    <th className="px-6 py-4">
                      Monto
                    </th>

                    <th className="px-6 py-4">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {gastos.map(
                    (gasto) => (

                      <tr
                        key={
                          gasto.idGasto
                        }
                        className="border-b border-[#EEE8DC] last:border-none"
                      >

                        <td className="px-6 py-5 font-black">
                          #{gasto.idGasto}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-[#68715C]">
                          {formatearFecha(
                            gasto.fechaGasto
                          )}
                        </td>

                        <td className="px-6 py-5 font-black">
                          {gasto.concepto}
                        </td>

                        <td className="px-6 py-5">

                          <span className="rounded-full bg-[#F4E7D1] px-3 py-1 text-xs font-bold text-[#A85E21]">
                            {gasto.categoria}
                          </span>

                        </td>

                        <td className="px-6 py-5 text-sm text-[#68715C]">
                          {gasto.descripcion ||
                            "—"}
                        </td>

                        <td className="px-6 py-5 text-lg font-black">
                          {formatearDinero(
                            Number(
                              gasto.monto
                            )
                          )}
                        </td>

                        <td className="px-6 py-5">

                          <div className="flex gap-4">

                            <button
                              type="button"
                              onClick={() =>
                                setGastoEditando(
                                  {
                                    ...gasto,
                                  }
                                )
                              }
                              className="whitespace-nowrap text-sm font-black text-[#CF7B32] hover:text-[#A85E21]"
                            >
                              ✏️ Modificar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                eliminarGasto(
                                  gasto
                                )
                              }
                              className="text-sm font-black text-red-500 hover:text-red-700"
                            >
                              Eliminar
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                  {!cargando &&
                    gastos.length ===
                      0 && (

                      <tr>

                        <td
                          colSpan={7}
                          className="p-10 text-center text-[#737A68]"
                        >
                          Todavía no hay gastos registrados.
                        </td>

                      </tr>

                    )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </div>

      {/* =====================================================
          MODAL MODIFICAR REGISTRO
      ===================================================== */}

      {gastoEditando && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">

          <div className="w-full max-w-xl rounded-3xl bg-[#29321F] p-7 text-white shadow-2xl">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-widest text-[#E8A35C]">
                  Gastos
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Modificar registro #
                  {
                    gastoEditando.idGasto
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setGastoEditando(
                    null
                  )
                }
                className="text-3xl text-white/50 hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="mt-7 space-y-5">

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Concepto
                </label>

                <input
                  value={
                    gastoEditando.concepto
                  }
                  onChange={(e) =>
                    setGastoEditando({
                      ...gastoEditando,

                      concepto:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Categoría
                </label>

                <select
                  value={
                    gastoEditando.categoria
                  }
                  onChange={(e) =>
                    setGastoEditando({
                      ...gastoEditando,

                      categoria:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                >

                  {categorias.map(
                    (item) => (

                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-bold">
                    Monto
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      gastoEditando.monto
                    }
                    onChange={(e) =>
                      setGastoEditando({
                        ...gastoEditando,

                        monto:
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
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={
                      gastoEditando.fechaGasto
                        ? gastoEditando.fechaGasto.split(
                            "T"
                          )[0]
                        : ""
                    }
                    onChange={(e) =>
                      setGastoEditando({
                        ...gastoEditando,

                        fechaGasto:
                          `${e.target.value}T12:00:00`,
                      })
                    }
                    className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                  />

                </div>

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold">
                  Descripción
                </label>

                <textarea
                  rows={3}
                  value={
                    gastoEditando.descripcion ??
                    ""
                  }
                  onChange={(e) =>
                    setGastoEditando({
                      ...gastoEditando,

                      descripcion:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-2xl bg-white px-4 py-3 text-[#29321F]"
                />

              </div>

            </div>

            <div className="mt-7 flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setGastoEditando(
                    null
                  )
                }
                className="flex-1 rounded-2xl bg-white/10 px-5 py-4 font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  modificarGasto
                }
                disabled={
                  guardando
                }
                className="flex-1 rounded-2xl bg-[#E78A32] px-5 py-4 font-black disabled:opacity-50"
              >
                {guardando
                  ? "GUARDANDO..."
                  : "GUARDAR CAMBIOS"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}