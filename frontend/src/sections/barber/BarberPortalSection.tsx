/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import { staffRequest } from "../../services/staffApi";
import type {
  StaffAppointment,
  StaffAvailability,
  StaffBarber,
  StaffDashboard,
} from "../../types";
import { statusClass, titleCase } from "../admin/adminPortalUtils";
import { AvailabilityEditor } from "../admin/availability/AvailabilityEditor";

type Module = "dashboard" | "appointments" | "availability" | "profile";
const BarberPortalSection: React.FC<{ module: Module }> = ({ module }) => {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await staffRequest(`/api/barber/${module}`));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [module]);
  useEffect(() => {
    void load();
  }, [load]);
  const header = (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
        Barber workspace
      </p>
      <h1 className="mt-1 text-2xl font-bold">{titleCase(module)}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your schedule and assigned work.
      </p>
    </div>
  );
  if (loading)
    return (
      <>
        {header}
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </>
    );
  if (error)
    return (
      <>
        {header}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </>
    );
  if (module === "dashboard") {
    const d = data as StaffDashboard;
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Today", d.today],
            ["Upcoming", d.upcoming],
            ["Confirmed", d.confirmed],
            ["Completed", d.completed],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        {d.next_appointment && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Next appointment</p>
            <p className="mt-2 font-bold">{d.next_appointment.customer_name}</p>
            <p className="text-sm text-slate-600">
              {d.next_appointment.appointment_date} at{" "}
              {d.next_appointment.start_time.slice(0, 5)}
            </p>
          </div>
        )}
      </>
    );
  }
  if (module === "appointments") {
    const rows = data as StaffAppointment[];
    const update = async (id: string, status: string) => {
      if (!confirm(`Mark appointment ${titleCase(status)}?`)) return;
      await staffRequest(`/api/barber/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    };
    return (
      <>
        {header}
        <div className="grid gap-4">
          {rows.map((row) => (
            <article
              key={row.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold">{row.customer_name}</h2>
                  <p className="text-sm text-slate-500">
                    {row.customer_phone} · {row.customer_email}
                  </p>
                </div>
                <span
                  className={`h-fit rounded-full px-2 py-1 text-xs ring-1 ${statusClass(row.status)}`}
                >
                  {titleCase(row.status)}
                </span>
              </div>
              <p className="mt-4 text-sm">
                {row.appointment_date} · {row.start_time.slice(0, 5)}–
                {row.end_time.slice(0, 5)} · {row.service_name}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["checked_in", "completed", "no_show", "cancelled"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => void update(row.id, status)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:border-amber-400"
                    >
                      {titleCase(status)}
                    </button>
                  ),
                )}
              </div>
            </article>
          ))}
          {!rows.length && (
            <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No assigned appointments.
            </p>
          )}
        </div>
      </>
    );
  }
  if (module === "availability")
    return (
      <>
        {header}
        <AvailabilityEditor
          value={data as StaffAvailability}
          savePath="/api/barber/availability"
          onDone={load}
        />
      </>
    );
  return (
    <>
      {header}
      <ProfileForm profile={data as StaffBarber} onDone={load} />
    </>
  );
};
const ProfileForm: React.FC<{
  profile: StaffBarber;
  onDone: () => Promise<void>;
}> = ({ profile, onDone }) => {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await staffRequest("/api/barber/profile", {
      method: "PATCH",
      body: JSON.stringify({ name, phone }),
    });
    await onDone();
  };
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <label className="block text-sm font-medium">
        Display name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium">
        Phone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-slate-500">
        Email
        <input
          disabled
          value={profile.email ?? ""}
          className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
        />
      </label>
      <button className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold">
        Save profile
      </button>
    </form>
  );
};
export default BarberPortalSection;
