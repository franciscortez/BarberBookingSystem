import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { staffRequest } from "../../../services/staffApi";
const AcceptInvitationSection: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [invite, setInvite] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    staffRequest<{ name: string; email: string }>(
      `/api/auth/barber-invitations/validate?token=${encodeURIComponent(token)}`,
    )
      .then(setInvite)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Invalid invitation"),
      );
  }, [token]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffRequest("/api/auth/barber-invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Account setup failed");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-20 text-slate-900">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Gentlemen&apos;s Quarters
        </p>
        <h1 className="mt-2 text-2xl font-bold">Set up barber account</h1>
        {error && (
          <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {done ? (
          <div className="mt-5">
            <p className="text-sm text-slate-600">
              Account ready. Sign in with {invite?.email}.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-md bg-amber-500 px-4 py-2 font-semibold"
            >
              Sign in
            </Link>
          </div>
        ) : (
          invite && (
            <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-4">
              <div>
                <p className="font-semibold">{invite.name}</p>
                <p className="text-sm text-slate-500">{invite.email}</p>
              </div>
              <label className="block text-sm font-medium">
                Password
                <input
                  required
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <button className="w-full rounded-md bg-amber-500 px-4 py-2 font-semibold">
                Create account
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
};
export default AcceptInvitationSection;
