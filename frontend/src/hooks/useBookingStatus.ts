import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, getBookingStatus } from "../services/api";
import type { PublicBookingStatus } from "../types";

export const useBookingStatus = () => {
  const [params] = useSearchParams();
  const [storedToken] = useState(() =>
    sessionStorage.getItem("pendingBookingToken"),
  );
  const token = params.get("token") || storedToken;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    token: string | null;
    status: "verifying" | "ready" | "invalid" | "delayed";
    result: PublicBookingStatus | null;
  }>({ token: null, status: "verifying", result: null });
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    const poll = async () => {
      count += 1;
      try {
        const result = await getBookingStatus(token, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const secured =
          ["confirmed", "checked_in", "completed", "no_show"].includes(
            result.appointment.status,
          ) && result.payment_status === "paid";
        if (
          secured ||
          result.appointment.status === "cancelled" ||
          result.payment_status === "failed"
        ) {
          setState({ token, status: "ready", result });
          if (sessionStorage.getItem("pendingBookingToken") === token) {
            sessionStorage.removeItem("pendingBookingToken");
          }
          return;
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        if (
          err instanceof ApiError &&
          (err.status === 400 || err.status === 404)
        ) {
          setState({ token, status: "invalid", result: null });
          return;
        }
      }
      if (controller.signal.aborted) return;
      if (count >= 40) {
        setState({ token, status: "delayed", result: null });
        return;
      }
      timer = setTimeout(() => void poll(), 3000);
    };
    void poll();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [token, attempt]);
  const retry = () => {
    setState({ token, status: "verifying", result: null });
    setAttempt((value) => value + 1);
  };
  return {
    noToken: !token,
    status: state.token === token ? state.status : ("verifying" as const),
    result: state.token === token ? state.result : null,
    retry,
  };
};
