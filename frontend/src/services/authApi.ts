import type { AuthResponse } from "../types/auth";

export const authenticate = async (
  mode: "login" | "signup",
  input: { identifier: string; password: string; name: string; phone: string },
): Promise<AuthResponse> => {
  const base = (
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? ""
  ).replace(/\/+$/, "");
  let response: Response;
  try {
    response = await fetch(
      base + (mode === "signup" ? "/api/auth/register" : "/api/auth/login"),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(
          mode === "signup"
            ? {
                name: input.name.trim(),
                phone: input.phone.trim(),
                email: input.identifier.trim(),
                password: input.password,
              }
            : { identifier: input.identifier.trim(), password: input.password },
        ),
      },
    );
  } catch {
    throw new Error("Unable to connect. Please try again.");
  }
  let data: Partial<AuthResponse> & { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The account service returned an unreadable response. Please try again.",
    );
  }
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Too many attempts. Please wait before trying again."
        : data.error || "Unable to access your account. Please try again.",
    );
  }
  if (!data.user || !data.token || !data.refreshToken)
    throw new Error("Unable to read your account session. Please try again.");
  return data as AuthResponse;
};
