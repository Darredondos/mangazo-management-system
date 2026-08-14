"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function Sidebar() {
  const pathname = usePathname();

  // =========================================================
  // DETERMINAR OPCIÓN ACTIVA
  // =========================================================

  const estaActivo = (item: MenuItem) => {
    // Dashboard
    if (item.href === "/") {
      return pathname === "/";
    }

    // Nueva venta debe ser exacta
    if (item.href === "/ventas/nueva") {
      return pathname === "/ventas/nueva";
    }

    // Ventas incluye:
    // /ventas
    // /ventas/75
    // /ventas/75/editar
    //
    // PERO NO:
    // /ventas/nueva
    if (item.href === "/ventas") {
      return (
        pathname === "/ventas" ||
        (
          pathname.startsWith("/ventas/") &&
          !pathname.startsWith("/ventas/nueva")
        )
      );
    }

    // Resto de módulos
    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    );
  };

  return (
    <aside
      className="
        sticky
        top-0
        hidden
        h-screen
        w-64
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-white/10
        bg-[#24311C]
        text-white
        lg:flex
      "
    >

      {/* =====================================================
          LOGO / BRANDING
      ===================================================== */}

      <div
        className="
          shrink-0
          border-b
          border-white/10
          px-6
          py-6
        "
      >
        <Link
          href="/"
          className="
            group
            flex
            items-center
            gap-3
          "
        >

          {/* LOGO */}

          <div
            className="
              relative
              h-18
              w-18
              shrink-0
              transition-transform
              duration-200
              group-hover:scale-105
            "
          >
            <Image
              src="/images/mangazo_logo.png"
              alt="Logo de Mangazo"
              fill
              priority
              sizes="150px"
              className="object-contain"
            />
          </div>

          {/* NOMBRE */}

          <div className="min-w-0">

            <h1
              className="
                truncate
                text-2xl
                font-black
                tracking-tight
                text-white
              "
            >
              MANGAZO
            </h1>

            <p
              className="
                mt-0.5
                text-[10px]
                font-bold
                uppercase
                tracking-[0.28em]
                text-[#E78A32]
              "
            >
              Business
            </p>

          </div>

        </Link>
      </div>

      {/* =====================================================
          NAVEGACIÓN
      ===================================================== */}

      <nav
        className="
          min-h-0
          flex-1
          overflow-y-auto
          px-4
          py-6
        "
      >

        <p
          className="
            mb-4
            px-4
            text-xs
            font-black
            uppercase
            tracking-[0.18em]
            text-white/40
          "
        >
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
                  group
                  flex
                  min-h-14
                  items-center
                  gap-3
                  rounded-2xl
                  px-4
                  py-3
                  font-bold
                  transition-all
                  duration-200

                  ${
                    activo
                      ? `
                        bg-[#EF8E2F]
                        text-white
                        shadow-sm
                      `
                      : `
                        text-white/65
                        hover:bg-white/10
                        hover:text-white
                      `
                  }
                `}
              >

                {/* ICONO */}

                <span
                  className={`
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    text-lg
                    transition-all
                    duration-200

                    ${
                      activo
                        ? `
                          bg-white/15
                          text-white
                        `
                        : `
                          bg-white/10
                          text-white/70
                          group-hover:bg-white/15
                          group-hover:text-white
                        `
                    }
                  `}
                >
                  {item.icono}
                </span>

                {/* TEXTO */}

                <span className="truncate">
                  {item.nombre}
                </span>

              </Link>
            );
          })}

        </div>

      </nav>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div
        className="
          shrink-0
          border-t
          border-white/10
          p-4
        "
      >

        <div
          className="
            rounded-2xl
            bg-white/5
            p-4
          "
        >

          <div className="flex items-center gap-3">

            {/* MINI LOGO */}

            <div
              className="
                relative
                h-10
                w-10
                shrink-0
                overflow-hidden
                rounded-full
                bg-[#182012]
              "
            >
              <Image
                src="/images/mangazo_logo.png"
                alt="Mangazo"
                fill
                sizes="40px"
                className="object-contain p-1"
              />
            </div>

            {/* INFO */}

            <div className="min-w-0">

              <p
                className="
                  truncate
                  text-sm
                  font-black
                  text-white
                "
              >
                Mangazo
              </p>

              <p
                className="
                  truncate
                  text-xs
                  text-white/45
                "
              >
                Sabor que te engancha
              </p>

            </div>

          </div>

          {/* ESTADO */}

          <div
            className="
              mt-4
              flex
              items-center
              gap-2
              text-xs
              font-semibold
              text-green-300
            "
          >

            <span
              className="
                h-2
                w-2
                rounded-full
                bg-green-400
              "
            />

            Sistema conectado

          </div>

        </div>

      </div>

    </aside>
  );
}