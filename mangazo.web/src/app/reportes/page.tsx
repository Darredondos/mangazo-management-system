"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type ProductoReporte = {
  idProducto: number;
  producto: string;
  cantidad: number;
  ventas: number;
  costo: number;
  ganancia: number;
};

type MetodoPago = {
  metodo: string;
  ventas: number;
  total: number;
};

type GastoCategoria = {
  categoria: string;
  total: number;
  tipo: "INVENTARIO" | "OPERATIVO";
};

type Reporte = {
  periodo: {
    desde: string;
    hasta: string;
  };

  resumen: {
    ventas: number;
    ingresos: number;
    costoProducto: number;
    utilidadBruta: number;
    margenBruto: number;

    gastosOperativos: number;
    utilidadNeta: number;
    margenNeto: number;

    bolsasVendidas: number;
    ticketPromedio: number;

    comprasInventario: number;
    totalSalidas: number;
  };

  productoEstrella: ProductoReporte | null;
  productos: ProductoReporte[];
  metodosPago: MetodoPago[];
  gastosCategoria: GastoCategoria[];
};


type FinanzasResumen = {
  entradas: number;
  salidas: number;
  saldoCalculado: number;
  saldoReal: number | null;
  fechaSaldoReal: string | null;
  diferencia: number | null;
  ultimosMovimientos: {
    idMovimientoFinanciero: number;
    tipo: string;
    concepto: string;
    monto: number;
    fechaMovimiento: string;
    idVenta: number | null;
    idGasto: number | null;
    observaciones: string | null;
  }[];
};

export default function ReportesPage() {
  const hoy = new Date();

  const primerDiaMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  );

  const formatearFechaInput = (fecha: Date) =>
    fecha.toISOString().split("T")[0];

  const [desde, setDesde] = useState(
    formatearFechaInput(primerDiaMes)
  );

  const [hasta, setHasta] = useState(
    formatearFechaInput(hoy)
  );

  const [reporte, setReporte] =
    useState<Reporte | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // CONCILIACIÓN
  // =========================================================

  const [nuevoSaldo, setNuevoSaldo] =
    useState("");

  const [guardandoSaldo, setGuardandoSaldo] =
    useState(false);

  const [mensajeSaldo, setMensajeSaldo] =
    useState("");

  const [finanzas, setFinanzas] =
    useState<FinanzasResumen | null>(null);

  // =========================================================
  // REPORTE
  // =========================================================

  const cargarReporte = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await apiFetch(
        `/api/reportes?desde=${desde}&hasta=${hasta}`
      );

      if (!response.ok) {
        throw new Error(
          "No fue posible cargar el reporte."
        );
      }

      const raw = await response.json();

      const data: Reporte = {
        periodo: {
          desde: raw?.periodo?.desde ?? desde,
          hasta: raw?.periodo?.hasta ?? hasta,
        },
        resumen: {
          ventas: Number(raw?.resumen?.ventas ?? 0),
          ingresos: Number(raw?.resumen?.ingresos ?? 0),
          costoProducto: Number(raw?.resumen?.costoProducto ?? 0),
          utilidadBruta: Number(raw?.resumen?.utilidadBruta ?? 0),
          margenBruto: Number(raw?.resumen?.margenBruto ?? 0),
          gastosOperativos: Number(raw?.resumen?.gastosOperativos ?? 0),
          utilidadNeta: Number(raw?.resumen?.utilidadNeta ?? 0),
          margenNeto: Number(raw?.resumen?.margenNeto ?? 0),
          bolsasVendidas: Number(raw?.resumen?.bolsasVendidas ?? 0),
          ticketPromedio: Number(raw?.resumen?.ticketPromedio ?? 0),
          comprasInventario: Number(raw?.resumen?.comprasInventario ?? 0),
          totalSalidas: Number(raw?.resumen?.totalSalidas ?? 0),
        },
        productoEstrella: raw?.productoEstrella ?? null,
        productos: Array.isArray(raw?.productos)
          ? raw.productos
          : [],
        metodosPago: Array.isArray(raw?.metodosPago)
          ? raw.metodosPago
          : [],
        gastosCategoria: Array.isArray(raw?.gastosCategoria)
          ? raw.gastosCategoria
          : [],
      };

      setReporte(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cargando el reporte."
      );
    } finally {
      setCargando(false);
    }
  };

  // =========================================================
  // RESUMEN FINANCIERO
  // =========================================================

  const cargarFinanzas = async () => {
    try {
      const response = await apiFetch(
        "/api/finanzas/resumen"
      );

      if (!response.ok) {
        throw new Error(
          "No fue posible cargar el resumen financiero."
        );
      }

      const raw = await response.json();

      const data: FinanzasResumen = {
        entradas: Number(raw?.entradas ?? 0),
        salidas: Number(raw?.salidas ?? 0),
        saldoCalculado: Number(raw?.saldoCalculado ?? 0),
        saldoReal:
          raw?.saldoReal == null
            ? null
            : Number(raw.saldoReal),
        fechaSaldoReal:
          raw?.fechaSaldoReal ?? null,
        diferencia:
          raw?.diferencia == null
            ? null
            : Number(raw.diferencia),
        ultimosMovimientos:
          Array.isArray(raw?.ultimosMovimientos)
            ? raw.ultimosMovimientos
            : [],
      };

      setFinanzas(data);
    } catch (err) {
      console.error(
        "Error cargando resumen financiero:",
        err
      );
    }
  };

  // =========================================================
  // ACTUALIZAR SALDO
  // =========================================================

  const actualizarSaldo = async () => {
    try {
      setMensajeSaldo("");

      if (
        nuevoSaldo.trim() === "" ||
        Number.isNaN(Number(nuevoSaldo))
      ) {
        setMensajeSaldo(
          "Ingresa un saldo válido."
        );
        return;
      }

      const saldo = Number(nuevoSaldo);

      if (saldo < 0) {
        setMensajeSaldo(
          "El saldo no puede ser negativo."
        );
        return;
      }

      setGuardandoSaldo(true);

      const response = await apiFetch(
        "/api/finanzas/saldo",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            saldoCuenta: saldo,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "No fue posible actualizar el saldo."
        );
      }

      await response.json();

      setNuevoSaldo("");

      setMensajeSaldo(
        "Conciliación guardada correctamente."
      );

      await cargarFinanzas();
    } catch (err) {
      setMensajeSaldo(
        err instanceof Error
          ? err.message
          : "Ocurrió un error actualizando el saldo."
      );
    } finally {
      setGuardandoSaldo(false);
    }
  };

  // =========================================================
  // CARGA INICIAL
  // =========================================================

  useEffect(() => {
    cargarReporte();
    cargarFinanzas();
  }, []);

  // =========================================================
  // FORMATOS
  // =========================================================

  const formatearDinero = (
    cantidad: number | null | undefined
  ) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(cantidad ?? 0));

  const formatearFechaSaldo = (
    fecha: string | null
  ) => {
    if (!fecha) {
      return "Sin actualización";
    }

    return new Date(fecha).toLocaleString(
      "es-MX",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // =========================================================
  // PRODUCTO MÁXIMO
  // =========================================================

  const maxProducto = useMemo(() => {
    if (!reporte?.productos?.length) {
      return 1;
    }

    return Math.max(
      ...(reporte.productos ?? []).map(
        (producto) => Number(producto.cantidad ?? 0)
      ),
      1
    );
  }, [reporte]);

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
            Inteligencia
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Reportes 📊
          </h1>

          <p className="mt-2 text-[#68715C]">
            Analiza el desempeño financiero y operativo
            de Mangazo.
          </p>
        </div>

        {/* =====================================================
            FILTROS
        ===================================================== */}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">

            <div>
              <label className="mb-2 block text-sm font-bold">
                Desde
              </label>

              <input
                type="date"
                value={desde}
                onChange={(e) =>
                  setDesde(e.target.value)
                }
                className="w-full rounded-2xl border border-[#DDD5C8] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Hasta
              </label>

              <input
                type="date"
                value={hasta}
                onChange={(e) =>
                  setHasta(e.target.value)
                }
                className="w-full rounded-2xl border border-[#DDD5C8] px-4 py-3"
              />
            </div>

            <button
              type="button"
              onClick={cargarReporte}
              disabled={cargando}
              className="rounded-2xl bg-[#E78A32] px-6 py-3 font-black text-white disabled:opacity-50"
            >
              {cargando
                ? "CARGANDO..."
                : "APLICAR FILTRO"}
            </button>

          </div>
        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-100 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        {reporte && (
          <>

            {/* =================================================
                KPIs PRINCIPALES
            ================================================= */}

            <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

              {/* INGRESOS */}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Ingresos
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatearDinero(
                    reporte.resumen.ingresos
                  )}
                </p>
              </div>

              {/* UTILIDAD BRUTA */}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Utilidad bruta
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatearDinero(
                    reporte.resumen.utilidadBruta
                  )}
                </p>

                <p className="mt-2 text-xs text-[#737A68]">
                  {Number(
                    reporte.resumen.margenBruto ?? 0
                  ).toFixed(1)}
                  % margen bruto
                </p>
              </div>

              {/* GASTOS OPERATIVOS */}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Gastos operativos
                </p>

                <p className="mt-3 text-3xl font-black text-[#E78A32]">
                  {formatearDinero(
                    reporte.resumen.gastosOperativos
                  )}
                </p>

                <p className="mt-2 text-xs text-[#737A68]">
                  Gastos que afectan directamente
                  la utilidad
                </p>
              </div>

              {/* UTILIDAD NETA */}

              <div
                className={`rounded-3xl p-6 text-white shadow-sm ${
                  Number(reporte.resumen.utilidadNeta ?? 0) >= 0
                    ? "bg-[#4E5A36]"
                    : "bg-red-600"
                }`}
              >
                <p className="text-sm text-white/70">
                  Utilidad neta
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatearDinero(
                    reporte.resumen.utilidadNeta
                  )}
                </p>

                <p className="mt-2 text-xs text-white/60">
                  {Number(
                    reporte.resumen.margenNeto ?? 0
                  ).toFixed(1)}
                  % margen neto
                </p>
              </div>

            </section>

            {/* =================================================
                KPIs SECUNDARIOS
            ================================================= */}

            <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Ventas
                </p>

                <p className="mt-3 text-4xl font-black">
                  {reporte.resumen.ventas}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Bolsas vendidas
                </p>

                <p className="mt-3 text-4xl font-black">
                  {reporte.resumen.bolsasVendidas}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Costo producto vendido
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatearDinero(
                    reporte.resumen.costoProducto
                  )}
                </p>

                <p className="mt-2 text-xs text-[#737A68]">
                  Costo asociado únicamente
                  a lo ya vendido
                </p>
              </div>

              <div className="rounded-3xl bg-[#29321F] p-6 text-white shadow-sm">
                <p className="text-sm text-white/60">
                  Ticket promedio
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatearDinero(
                    reporte.resumen.ticketPromedio
                  )}
                </p>
              </div>

            </section>

            {/* =================================================
                POSICIÓN ACTUAL
            ================================================= */}

            <section className="mt-8">

              <div className="mb-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
                  Posición actual
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Liquidez 💰
                </h2>

                <p className="mt-1 text-sm text-[#737A68]">
                  El saldo principal se calcula automáticamente con todos
                  los movimientos financieros de Mangazo.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr_1fr]">

                {/* SALDO AUTOMÁTICO */}

                <div className="rounded-3xl bg-[#29321F] p-7 text-white shadow-sm xl:row-span-2">
                  <p className="text-sm text-white/60">
                    Saldo actual de Mangazo
                  </p>

                  <p className="mt-3 text-5xl font-black">
                    {formatearDinero(
                      finanzas?.saldoCalculado ?? 0
                    )}
                  </p>

                  <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
                    Calculado automáticamente con aportaciones, ventas,
                    compras, gastos, retiros y ajustes.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-white/50">
                        Entradas acumuladas
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {formatearDinero(
                          finanzas?.entradas ?? 0
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-white/50">
                        Salidas acumuladas
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {formatearDinero(
                          finanzas?.salidas ?? 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ENTRADAS */}

                <div className="rounded-3xl bg-white p-7 shadow-sm">
                  <p className="text-sm text-[#737A68]">
                    Entradas acumuladas
                  </p>

                  <p className="mt-3 text-3xl font-black text-green-700">
                    {formatearDinero(
                      finanzas?.entradas ?? 0
                    )}
                  </p>

                  <p className="mt-2 text-xs text-[#737A68]">
                    Ventas, aportaciones y ajustes de entrada
                  </p>
                </div>

                {/* SALIDAS */}

                <div className="rounded-3xl bg-white p-7 shadow-sm">
                  <p className="text-sm text-[#737A68]">
                    Salidas acumuladas
                  </p>

                  <p className="mt-3 text-3xl font-black text-[#E78A32]">
                    {formatearDinero(
                      finanzas?.salidas ?? 0
                    )}
                  </p>

                  <p className="mt-2 text-xs text-[#737A68]">
                    Inventario, gastos, retiros y ajustes
                  </p>
                </div>

                {/* DIFERENCIA */}

                <div className="rounded-3xl bg-white p-7 shadow-sm">
                  <p className="text-sm text-[#737A68]">
                    Diferencia por conciliar
                  </p>

                  <p
                    className={`mt-3 text-3xl font-black ${
                      finanzas?.diferencia == null
                        ? "text-[#737A68]"
                        : Math.abs(finanzas.diferencia) < 0.01
                        ? "text-green-700"
                        : "text-[#E78A32]"
                    }`}
                  >
                    {finanzas?.diferencia == null
                      ? "Sin conciliación"
                      : formatearDinero(
                          finanzas.diferencia
                        )}
                  </p>

                  <p className="mt-2 text-xs text-[#737A68]">
                    Saldo observado menos saldo calculado
                  </p>
                </div>

                {/* ESTADO DE CONCILIACIÓN */}

                <div className="rounded-3xl bg-white p-7 shadow-sm">
                  <p className="text-sm text-[#737A68]">
                    Estado de conciliación
                  </p>

                  <p className="mt-3 text-2xl font-black">
                    {finanzas?.saldoReal == null
                      ? "Pendiente"
                      : Math.abs(finanzas.diferencia ?? 0) < 0.01
                      ? "Cuadrado"
                      : "Por revisar"}
                  </p>

                  <p className="mt-2 text-xs text-[#737A68]">
                    La conciliación es opcional y no modifica ventas
                    ni gastos.
                  </p>
                </div>

              </div>

              {/* =================================================
                  CONCILIACIÓN OPCIONAL
              ================================================= */}

              <div className="mt-5 rounded-3xl bg-white p-7 shadow-sm">

                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
                      Conciliación opcional
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      Comparar contra saldo observado
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737A68]">
                      Úsalo solamente para verificar que el saldo calculado
                      coincida con lo que realmente observas en la cuenta.
                      Guardar este dato no altera el saldo automático.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#F8F4EC] p-4">
                        <p className="text-xs text-[#737A68]">
                          Último saldo observado
                        </p>

                        <p className="mt-2 text-2xl font-black">
                          {finanzas?.saldoReal == null
                            ? "Sin registro"
                            : formatearDinero(
                                finanzas.saldoReal
                              )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F8F4EC] p-4">
                        <p className="text-xs text-[#737A68]">
                          Última conciliación
                        </p>

                        <p className="mt-2 text-sm font-black">
                          {formatearFechaSaldo(
                            finanzas?.fechaSaldoReal ?? null
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Saldo observado
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={nuevoSaldo}
                      onChange={(e) => {
                        setNuevoSaldo(
                          e.target.value
                        );

                        setMensajeSaldo("");
                      }}
                      placeholder="Ej. 6500"
                      className="w-full rounded-2xl border border-[#DDD5C8] px-4 py-3 outline-none focus:border-[#E78A32]"
                    />

                    <button
                      type="button"
                      onClick={actualizarSaldo}
                      disabled={guardandoSaldo}
                      className="mt-4 w-full rounded-2xl bg-[#E78A32] px-6 py-3 font-black text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {guardandoSaldo
                        ? "GUARDANDO..."
                        : "GUARDAR CONCILIACIÓN"}
                    </button>

                    {mensajeSaldo && (
                      <p className="mt-3 text-sm font-semibold text-[#68715C]">
                        {mensajeSaldo}
                      </p>
                    )}
                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                FLUJO DE EFECTIVO
            ================================================= */}

            <section className="mt-8">

              <div className="mb-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
                  Flujo de efectivo
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Compras y salidas
                </h2>

                <p className="mt-1 max-w-3xl text-sm text-[#737A68]">
                  Dinero utilizado durante el periodo.
                  Estas salidas no representan
                  necesariamente pérdidas, ya que parte
                  del dinero puede permanecer convertido
                  en inventario.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                {/* COMPRAS INVENTARIO */}

                <div className="rounded-3xl bg-white p-6 shadow-sm">

                  <p className="text-sm text-[#737A68]">
                    Compras de inventario
                  </p>

                  <p className="mt-3 text-3xl font-black">
                    {formatearDinero(
                      reporte.resumen.comprasInventario
                    )}
                  </p>

                  <p className="mt-2 text-xs text-[#737A68]">
                    Producto, empaques y etiquetas
                  </p>

                </div>

                {/* SALIDAS TOTALES */}

                <div className="rounded-3xl bg-[#29321F] p-6 text-white shadow-sm">

                  <p className="text-sm text-white/60">
                    Salidas totales
                  </p>

                  <p className="mt-3 text-3xl font-black">
                    {formatearDinero(
                      reporte.resumen.totalSalidas
                    )}
                  </p>

                  <p className="mt-2 text-xs text-white/60">
                    Compras de inventario +
                    gastos operativos
                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                PRODUCTO ESTRELLA
            ================================================= */}

            <section className="mt-8 rounded-3xl bg-[#29321F] p-7 text-white">

              <p className="text-sm font-black uppercase tracking-widest text-[#E8A35C]">
                Producto estrella
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {reporte.productoEstrella
                  ?.producto ?? "Sin datos"}
              </h2>

              {reporte.productoEstrella && (
                <div className="mt-4 flex flex-wrap gap-6 text-sm text-white/60">

                  <span>
                    {
                      reporte.productoEstrella
                        .cantidad
                    }{" "}
                    bolsas
                  </span>

                  <span>
                    {formatearDinero(
                      reporte.productoEstrella
                        .ventas
                    )}{" "}
                    en ventas
                  </span>

                  <span>
                    {formatearDinero(
                      reporte.productoEstrella
                        .ganancia
                    )}{" "}
                    de ganancia bruta
                  </span>

                </div>
              )}

            </section>

            {/* =================================================
                PRODUCTOS
            ================================================= */}

            <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm">

              <h2 className="text-2xl font-black">
                Ventas por producto
              </h2>

              <p className="mt-1 text-sm text-[#737A68]">
                Ranking de productos durante
                el periodo.
              </p>

              <div className="mt-7 space-y-6">

                {(reporte.productos ?? []).map(
                  (producto) => {

                    const porcentaje =
                      (Number(producto.cantidad ?? 0) /
                        maxProducto) *
                      100;

                    return (
                      <div
                        key={
                          producto.idProducto
                        }
                      >

                        <div className="mb-2 flex justify-between gap-5">

                          <div>

                            <p className="font-black">
                              {
                                producto.producto
                              }
                            </p>

                            <p className="text-sm text-[#737A68]">
                              {
                                producto.cantidad
                              }{" "}
                              bolsas
                            </p>

                          </div>

                          <div className="text-right">

                            <p className="font-black">
                              {formatearDinero(
                                producto.ventas
                              )}
                            </p>

                            <p className="text-xs font-bold text-green-700">
                              Ganancia{" "}
                              {formatearDinero(
                                producto.ganancia
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-[#F0EBE1]">

                          <div
                            className="h-full rounded-full bg-[#E78A32]"
                            style={{
                              width: `${porcentaje}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  }
                )}

                {(reporte.productos ?? []).length === 0 && (
                  <p className="text-[#737A68]">
                    No hay productos vendidos
                    en este periodo.
                  </p>
                )}

              </div>

            </section>

            {/* =================================================
                MÉTODOS + SALIDAS
            ================================================= */}

            <section className="mt-8 grid gap-6 lg:grid-cols-2">

              {/* MÉTODOS DE PAGO */}

              <div className="rounded-3xl bg-white p-7 shadow-sm">

                <h2 className="text-2xl font-black">
                  Métodos de pago
                </h2>

                <p className="mt-1 text-sm text-[#737A68]">
                  Cómo se recibieron los ingresos
                  del periodo.
                </p>

                <div className="mt-6 space-y-4">

                  {(reporte.metodosPago ?? []).map(
                    (metodo) => (

                      <div
                        key={
                          metodo.metodo
                        }
                        className="flex items-center justify-between rounded-2xl bg-[#F8F4EC] p-4"
                      >

                        <div>

                          <p className="font-black">
                            {metodo.metodo}
                          </p>

                          <p className="text-sm text-[#737A68]">
                            {metodo.ventas} ventas
                          </p>

                        </div>

                        <p className="font-black">
                          {formatearDinero(
                            metodo.total
                          )}
                        </p>

                      </div>

                    )
                  )}

                  {(reporte.metodosPago ?? []).length === 0 && (
                    <p className="text-[#737A68]">
                      No hay ventas en el periodo.
                    </p>
                  )}

                </div>

              </div>

              {/* SALIDAS POR CATEGORÍA */}

              <div className="rounded-3xl bg-white p-7 shadow-sm">

                <h2 className="text-2xl font-black">
                  Salidas por categoría
                </h2>

                <p className="mt-1 text-sm text-[#737A68]">
                  Distribución de compras y gastos
                  del periodo.
                </p>

                <div className="mt-6 space-y-4">

                  {(reporte.gastosCategoria ?? []).map(
                    (categoria) => (

                      <div
                        key={
                          categoria.categoria
                        }
                        className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8F4EC] p-4"
                      >

                        <div>

                          <p className="font-black">
                            {
                              categoria.categoria
                            }
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#737A68]">
                            {categoria.tipo ===
                            "INVENTARIO"
                              ? "Compra de inventario"
                              : "Gasto operativo"}
                          </p>

                        </div>

                        <p
                          className={`font-black ${
                            categoria.tipo ===
                            "OPERATIVO"
                              ? "text-[#E78A32]"
                              : "text-[#29321F]"
                          }`}
                        >
                          {formatearDinero(
                            categoria.total
                          )}
                        </p>

                      </div>

                    )
                  )}

                  {(reporte.gastosCategoria ?? []).length ===
                    0 && (
                    <p className="text-[#737A68]">
                      No hay salidas registradas
                      en este periodo.
                    </p>
                  )}

                </div>

              </div>

            </section>

          </>
        )}

      </div>
    </main>
  );
}