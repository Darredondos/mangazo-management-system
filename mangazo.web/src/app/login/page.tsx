"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5152";

export default function LoginPage() {
  const router = useRouter();

  // Dejamos mangadmin precargado para facilitar el acceso
  const [usuario, setUsuario] = useState("mangadmin");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mangazo_token");

    if (token) {
      router.replace("/");
    }
  }, [router]);

  async function iniciarSesion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setCargando(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario: usuario.trim(),
            password: password,
          }),
        }
      );

      // Si la API devuelve error
      if (!response.ok) {
        let mensaje = "No fue posible iniciar sesión.";

        try {
          const errorData = await response.json();

          if (errorData.mensaje) {
            mensaje = errorData.mensaje;
          }
        } catch {
          if (response.status === 401) {
            mensaje = "Usuario o contraseña incorrectos.";
          }
        }

        throw new Error(mensaje);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error(
          "La API no devolvió un token de autenticación."
        );
      }

      // Guardamos la sesión
      localStorage.setItem(
        "mangazo_token",
        data.token
      );

      if (data.expiresAt) {
        localStorage.setItem(
          "mangazo_token_expiration",
          data.expiresAt
        );
      }

      localStorage.setItem(
        "mangazo_usuario",
        data.usuario ?? usuario
      );

      // Entramos al sistema
      router.replace("/");
      router.refresh();

    } catch (err) {
      console.error("Error de login:", err);

      if (err instanceof TypeError) {
        setError(
          "No se pudo conectar con la API. Verifica que Mangazo.API esté ejecutándose."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }

    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <img
            src="/images/mangazo_logo.png"
            alt="Mangazo"
            className="login-logo"
          />

          <div>
            <h1>MANGAZO</h1>
            <span>BUSINESS</span>
          </div>
        </div>

        <div className="login-header">
          <h2>Iniciar sesión</h2>

          <p>
            Ingresa tus credenciales para acceder al sistema.
          </p>
        </div>

        <form
          onSubmit={iniciarSesion}
          className="login-form"
        >
          <div className="login-field">

            <label htmlFor="usuario">
              Usuario
            </label>

            <input
              id="usuario"
              name="usuario"
              type="text"
              value={usuario}
              onChange={(e) =>
                setUsuario(e.target.value)
              }
              placeholder="Usuario"
              autoComplete="username"
              required
            />

          </div>

          <div className="login-field">

            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={cargando}
          >
            {cargando
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>

        </form>
      </div>
    </main>
  );
}