"use client";

import { useEffect, useMemo, useState } from "react";

type ProductoReporte = {
  idProducto: number;
  producto: string;
  cantidad: number;
  ventas: number;
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
    gastos: number;
    utilidadNeta: number;
    margenNeto: number;
    bolsasVendidas: number;
    ticketPromedio: number;
  };

  productoEstrella: ProductoReporte | null;
  productos: ProductoReporte[];
  metodosPago: MetodoPago[];
  gastosCategoria: GastoCategoria[];
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

  const cargarReporte = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reportes?desde=${desde}&hasta=${hasta}`
      );

      if (!response.ok) {
        throw new Error(
          "No fue posible cargar el reporte."
        );
      }

      const data: Reporte =
        await response.json();

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

  useEffect(() => {
    cargarReporte();
  }, []);

  const formatearDinero = (
    cantidad: number
  ) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cantidad);

  const maxProducto = useMemo(() => {
    if (!reporte?.productos.length) {
      return 1;
    }

    return Math.max(
      ...reporte.productos.map(
        (producto) => producto.cantidad
      ),
      1
    );
  }, [reporte]);

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-6 py-10 text-[#29321F] lg:px-10">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#CF7B32]">
            Inteligencia
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Reportes 📊
          </h1>

          <p className="mt-2 text-[#68715C]">
            Analiza el desempeño de Mangazo por periodo.
          </p>
        </div>

        {/* FILTROS */}

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

        {error && (
          <div className="mt-6 rounded-2xl bg-red-100 p-5 font-semibold text-red-700">
            {error}
          </div>
        )}

        {reporte && (
          <>

            {/* KPIs PRINCIPALES */}

            <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

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

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Utilidad bruta
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatearDinero(
                    reporte.resumen.utilidadBruta
                  )}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm text-[#737A68]">
                  Gastos
                </p>

                <p className="mt-3 text-3xl font-black text-red-600">
                  {formatearDinero(
                    reporte.resumen.gastos
                  )}
                </p>
              </div>

              <div
                className={`rounded-3xl p-6 text-white shadow-sm ${
                  reporte.resumen.utilidadNeta >= 0
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
                  {reporte.resumen.margenNeto.toFixed(
                    1
                  )}
                  % margen neto
                </p>
              </div>

            </section>

            {/* KPIs SECUNDARIOS */}

            <section className="mt-5 grid gap-5 md:grid-cols-4">

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
                  Costo producto
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatearDinero(
                    reporte.resumen.costoProducto
                  )}
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

            {/* PRODUCTO ESTRELLA */}

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
                    {reporte.productoEstrella.cantidad} bolsas
                  </span>

                  <span>
                    {formatearDinero(
                      reporte.productoEstrella.ventas
                    )} en ventas
                  </span>

                </div>
              )}

            </section>

            {/* PRODUCTOS */}

            <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm">

              <h2 className="text-2xl font-black">
                Ventas por producto
              </h2>

              <p className="mt-1 text-sm text-[#737A68]">
                Ranking de productos durante el periodo.
              </p>

              <div className="mt-7 space-y-6">

                {reporte.productos.map(
                  (producto) => {

                    const porcentaje =
                      (producto.cantidad /
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
                              {producto.producto}
                            </p>

                            <p className="text-sm text-[#737A68]">
                              {producto.cantidad} bolsas
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

                {reporte.productos.length === 0 && (
                  <p className="text-[#737A68]">
                    No hay productos vendidos en este periodo.
                  </p>
                )}

              </div>

            </section>

            {/* MÉTODOS Y GASTOS */}

            <section className="mt-8 grid gap-6 lg:grid-cols-2">

              <div className="rounded-3xl bg-white p-7 shadow-sm">

                <h2 className="text-2xl font-black">
                  Métodos de pago
                </h2>

                <div className="mt-6 space-y-4">

                  {reporte.metodosPago.map(
                    (metodo) => (

                      <div
                        key={metodo.metodo}
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

                  {reporte.metodosPago.length === 0 && (
                    <p className="text-[#737A68]">
                      No hay ventas en el periodo.
                    </p>
                  )}

                </div>

              </div>

              <div className="rounded-3xl bg-white p-7 shadow-sm">

                <h2 className="text-2xl font-black">
                  Gastos por categoría
                </h2>

                <div className="mt-6 space-y-4">

                  {reporte.gastosCategoria.map(
                    (categoria) => (

                      <div
                        key={
                          categoria.categoria
                        }
                        className="flex items-center justify-between rounded-2xl bg-[#F8F4EC] p-4"
                      >

                        <p className="font-black">
                          {categoria.categoria}
                        </p>

                        <p className="font-black text-red-600">
                          {formatearDinero(
                            categoria.total
                          )}
                        </p>

                      </div>

                    )
                  )}

                  {reporte.gastosCategoria.length === 0 && (
                    <p className="text-[#737A68]">
                      No hay gastos en este periodo.
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