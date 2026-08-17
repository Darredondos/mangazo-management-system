"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type MenuItem = {
  nombre: string;
  href: string;
  icono: string;
};

const menu: MenuItem[] = [
  {
    nombre: "Dashboard",
    href: "/",
    icono: "⌂",
  },
  {
    nombre: "Nueva venta",
    href: "/ventas/nueva",
    icono: "+",
  },
  {
    nombre: "Ventas",
    href: "/ventas",
    icono: "◫",
  },
  {
    nombre: "Inventario",
    href: "/inventario",
    icono: "▣",
  },
  {
    nombre: "Productos",
    href: "/productos",
    icono: "🥭",
  },
  {
    nombre: "Gastos",
    href: "/gastos",
    icono: "$",
  },
  {
    nombre: "Reportes",
    href: "/reportes",
    icono: "↗",
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [abierto, setAbierto] = useState(false);
  const [logueado, setLogueado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mangazo_token");
    setLogueado(!!token);

    setAbierto(false);
  }, [pathname]);

  const estaActivo = (item: MenuItem) => {
    if (item.href === "/") {
      return pathname === "/";
    }

    if (item.href === "/ventas/nueva") {
      return pathname === "/ventas/nueva";
    }

    if (item.href === "/ventas") {
      return (
        pathname === "/ventas" ||
        (
          pathname.startsWith("/ventas/") &&
          !pathname.startsWith("/ventas/nueva")
        )
      );
    }

    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    );
  };

  const cerrarSesion = () => {
    localStorage.removeItem("mangazo_token");
    localStorage.removeItem("mangazo_token_expiration");
    localStorage.removeItem("mangazo_usuario");

    setLogueado(false);
    setAbierto(false);

    router.replace("/login");
    router.refresh();
  };

  if (!logueado) {
    return null;
  }

  return (
    <>
      {/* =====================================================
          HEADER MOBILE
      ===================================================== */}

      <header
        className="
          sticky
          top-0
          z-40
          flex
          items-center
          justify-between
          border-b
          border-black/5
          bg-[#24311C]
          px-4
          py-3
          text-white
          lg:hidden
        "
      >
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="relative h-10 w-10">
            <Image
              src="/images/mangazo_logo.png"
              alt="Mangazo"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>

          <div>
            <p className="text-lg font-black leading-none">
              MANGAZO
            </p>

            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[#E78A32]">
              Business
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() =>
            setAbierto((actual) => !actual)
          }
          aria-label="Abrir menú"
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-white/10
            text-2xl
            font-black
          "
        >
          {abierto ? "×" : "☰"}
        </button>
      </header>

      {/* =====================================================
          OVERLAY
      ===================================================== */}

      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="
            fixed
            inset-0
            z-40
            bg-black/40
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          DRAWER
      ===================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-[85%]
          max-w-[320px]
          flex-col
          bg-[#24311C]
          text-white
          shadow-2xl
          transition-transform
          duration-300
          lg:hidden

          ${
            abierto
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* BRANDING */}

        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center justify-between">

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="relative h-12 w-12">
                <Image
                  src="/images/mangazo_logo.png"
                  alt="Mangazo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>

              <div>
                <p className="text-xl font-black">
                  MANGAZO
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#E78A32]">
                  Business
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-white/10
                text-2xl
              "
            >
              ×
            </button>

          </div>
        </div>

        {/* NAVEGACIÓN */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">

          <p className="mb-4 px-3 text-xs font-black uppercase tracking-[0.18em] text-white/40">
            Operación
          </p>

          <div className="space-y-2">

            {menu.map((item) => {

              const activo =
                estaActivo(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    px-4
                    py-3
                    font-bold
                    transition

                    ${
                      activo
                        ? "bg-[#EF8E2F] text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <span
                    className={`
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      text-lg

                      ${
                        activo
                          ? "bg-white/15"
                          : "bg-white/10"
                      }
                    `}
                  >
                    {item.icono}
                  </span>

                  <span>
                    {item.nombre}
                  </span>
                </Link>
              );
            })}

          </div>
        </nav>

        {/* FOOTER */}

        <div className="border-t border-white/10 p-4">

          <div className="rounded-2xl bg-white/5 p-4">

            <div className="flex items-center gap-3">

              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#182012]">
                <Image
                  src="/images/mangazo_logo.png"
                  alt="Mangazo"
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              </div>

              <div>

                <p className="text-sm font-black">
                  Mangazo
                </p>

                <p className="text-xs text-white/45">
                  Sistema conectado
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={cerrarSesion}
              className="
                mt-4
                w-full
                rounded-xl
                bg-white/10
                px-4
                py-3
                text-sm
                font-black
                text-white/75
                transition
                hover:bg-red-500
                hover:text-white
              "
            >
              Cerrar sesión
            </button>

          </div>

        </div>
      </aside>
    </>
  );
}