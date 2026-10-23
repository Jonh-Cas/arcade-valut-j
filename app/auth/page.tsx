"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const USERNAME_MIN = 3;
const USERNAME_MAX = 16;

function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "user_already_exists":
    case "email_exists":
      return "Ese correo ya está registrado.";
    case "weak_password":
      return "La contraseña es muy corta. Usa al menos 6 caracteres.";
    case "email_address_invalid":
    case "validation_failed":
      return "Revisa el correo y la contraseña.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Demasiados intentos. Espera un momento e intenta de nuevo.";
    default:
      return "No se pudo completar la operación. Intenta de nuevo.";
  }
}

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/biblioteca");
    });
  }, [router]);

  const switchTab = (next: "in" | "up") => {
    setTab(next);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const username = user.trim();
    if (
      tab === "up" &&
      (username.length < USERNAME_MIN || username.length > USERNAME_MAX)
    ) {
      setError(
        `El usuario debe tener entre ${USERNAME_MIN} y ${USERNAME_MAX} caracteres.`,
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } =
        tab === "in"
          ? await supabase.auth.signInWithPassword({ email, password: pass })
          : await supabase.auth.signUp({
              email,
              password: pass,
              options: { data: { username } },
            });

      if (authError) {
        setError(authErrorMessage(authError));
        return;
      }
      router.push("/biblioteca");
    } catch {
      setError(
        "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const playAsGuest = () => {
    router.push("/biblioteca");
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === "in" ? "on" : ""}
            onClick={() => switchTab("in")}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "up" ? "on" : ""}
            onClick={() => switchTab("up")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit}>
          {tab === "up" && (
            <div className="field slide-in">
              <label>Usuario</label>
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="px_kai"
                required
              />
            </div>
          )}
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "in" ? "current-password" : "new-password"}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}
          <button
            className="btn lg"
            type="submit"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading
              ? "CONECTANDO..."
              : tab === "in"
                ? "ENTRAR AL VAULT"
                : "CREAR Y JUGAR"}
          </button>
        </form>

        <button
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={playAsGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
