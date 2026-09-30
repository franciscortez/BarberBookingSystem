import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { authenticate } from "../services/authApi";
import { getAuthDestination, isValidEmail } from "../utils/publicForms";

export const useAuthForm = (mode: "login" | "signup") => {
  const { login, user, loading: accountLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requested = (location.state as { from?: string } | null)?.from;
  const [fields, setFields] = useState({
    name: "",
    phone: "",
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!accountLoading && user)
      navigate(getAuthDestination(requested, user.role, mode === "signup"), {
        replace: true,
      });
  }, [accountLoading, user, requested, mode, navigate]);
  const changeField = (field: keyof typeof fields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setError(null);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    const validation: Record<string, string> = {};
    if (!fields.identifier.trim())
      validation.identifier =
        mode === "signup"
          ? "Enter your email address."
          : "Enter your email or username.";
    else if (mode === "signup" && !isValidEmail(fields.identifier))
      validation.identifier = "Enter a valid email address.";
    if (!fields.password) validation.password = "Enter your password.";
    else if (mode === "signup" && fields.password.length < 6)
      validation.password = "Use at least 6 characters.";
    if (mode === "signup") {
      if (!fields.name.trim()) validation.name = "Enter your full name.";
      if (!fields.phone.trim()) validation.phone = "Enter your phone number.";
    }
    setErrors(validation);
    setError(null);
    if (Object.keys(validation).length) {
      const order =
        mode === "signup"
          ? ["name", "phone", "identifier", "password"]
          : ["identifier", "password"];
      document
        .getElementById("auth-" + order.find((key) => validation[key]))
        ?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const result = await authenticate(mode, fields);
      if (!mounted.current) return;
      login(result.user, result.token, result.refreshToken);
      navigate(
        getAuthDestination(requested, result.user.role, mode === "signup"),
        { replace: true },
      );
    } catch (err) {
      if (mounted.current)
        setError(
          err instanceof Error
            ? err.message
            : "Unable to access your account. Please try again.",
        );
    } finally {
      submitting.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return {
    mode,
    fields,
    errors,
    error,
    pending,
    accountLoading,
    showPassword,
    setShowPassword,
    changeField,
    submit,
    requested,
  };
};
