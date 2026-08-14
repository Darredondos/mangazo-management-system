const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5152";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("mangazo_token")
      : null;

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  // Sesión vencida o token inválido
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mangazo_token");
      localStorage.removeItem(
        "mangazo_token_expiration"
      );
      localStorage.removeItem(
        "mangazo_usuario"
      );

      window.location.href = "/login";
    }

    throw new Error("Sesión expirada.");
  }

  return response;
}