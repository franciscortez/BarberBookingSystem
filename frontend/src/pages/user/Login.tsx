import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogIn, UserPlus, ChevronLeft, Eye, EyeOff } from "lucide-react";

const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? ""
).replace(/\/+$/, "");

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const resetFields = () => {
    setError(null);
    setSuccess(null);
    setIdentifier("");
    setPassword("");
    setName("");
    setPhone("");
    setShowPassword(false);
  };

  const toggleRegisterMode = () => {
    resetFields();
    setIsRegistering(!isRegistering);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const body = isRegistering
        ? { name, email: identifier, phone, password }
        : { identifier, password };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isRegistering) {
        setSuccess("Registration successful! Please sign in.");
        setIsRegistering(false);
        setPassword("");
        navigate("/login");
      } else {
        login(data.user);
        const requested = (location.state as { from?: string } | null)?.from;
        navigate(
          requested ||
            (data.user.role === "admin"
              ? "/admin/dashboard"
              : data.user.role === "barber"
                ? "/barber/dashboard"
                : "/"),
          { replace: true },
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16 selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        <Link
          to="/"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
          {isRegistering ? "Create Account" : "Sign In"}
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base mb-8">
          {isRegistering
            ? "Register to auto-fill your bookings and track appointments."
            : "Access your account to manage bookings or your schedule."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-base sm:text-sm text-zinc-200 transition-colors placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 09171234567"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-base sm:text-sm text-zinc-200 transition-colors placeholder:text-zinc-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              {isRegistering ? "Email Address" : "Email or Username"}
            </label>
            <input
              type={isRegistering ? "email" : "text"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                isRegistering
                  ? "e.g. juan@email.com"
                  : "Enter email or username"
              }
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-base sm:text-sm text-zinc-200 transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isRegistering ? "At least 6 characters" : "••••••••"
                }
                required
                minLength={isRegistering ? 6 : undefined}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-base sm:text-sm text-zinc-200 transition-colors placeholder:text-zinc-600 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Toggle between login/register */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          {isRegistering ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleRegisterMode}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={toggleRegisterMode}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
