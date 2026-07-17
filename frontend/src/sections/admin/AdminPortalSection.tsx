/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { staffRequest } from "../../services/staffApi";
import type {
  Service,
  StaffAppointment,
  StaffAvailability,
  StaffBarber,
  StaffDashboard,
  StaffPayment,
  WorkingHour,
} from "../../types";
import { money, statusClass, titleCase, weekdays } from "./adminPortalUtils";

type Module =
  | "dashboard"
  | "appointments"
  | "barbers"
  | "services"
  | "availability"
  | "payments";
const actionStatuses = ["checked_in", "completed", "no_show", "cancelled"];
const AdminPortalSection: React.FC<{ module: Module }> = ({ module }) => {
  const params = useParams();
  const [data, setData] = useState<unknown>(null);
  const [barbers, setBarbers] = useState<StaffBarber[]>([]);
  const [selected, setSelected] = useState("");
  const [availability, setAvailability] = useState<StaffAvailability | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (module === "availability") {
        const list = await staffRequest<StaffBarber[]>("/api/admin/barbers");
        setBarbers(list);
        const id = selected || list[0]?.id || "";
        setSelected(id);
        setAvailability(
          id
            ? await staffRequest<StaffAvailability>(
                `/api/admin/availability/${id}`,
              )
            : { hours: [], blocks: [] },
        );
        setData(list);
      } else {
        const path = params.appointmentId
          ? `/api/admin/appointments/${params.appointmentId}`
          : params.barberId
            ? `/api/admin/barbers/${params.barberId}`
            : `/api/admin/${module}`;
        const result = await staffRequest<unknown>(path);
        setData(result);
        if (module === "services")
          setBarbers(await staffRequest<StaffBarber[]>("/api/admin/barbers"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [module, params.appointmentId, params.barberId, selected]);
  useEffect(() => {
    void load();
  }, [load]);
  const mutate = async (path: string, options: RequestInit) => {
    if (!confirm("Confirm this action?")) return;
    try {
      await staffRequest(path, options);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };
  const header = (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
        Administration
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-950">
        {titleCase(module)}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage shop operations from one place.
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </>
    );
  if (module === "dashboard") {
    const d = data as StaffDashboard;
    const cards = [
      ["Today", d.today],
      ["Upcoming", d.upcoming],
      ["Confirmed", d.confirmed],
      ["Completed", d.completed],
      ["Active barbers", d.active_barbers ?? 0],
      ["Paid total", money(d.payment_total)],
    ];
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {["appointments", "barbers", "services", "availability"].map(
            (item) => (
              <Link
                key={item}
                to={`/admin/${item}`}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold hover:border-amber-400"
              >
                Manage {item}
              </Link>
            ),
          )}
        </div>
      </>
    );
  }
  if (module === "appointments") {
    const rows = (Array.isArray(data) ? data : [data]) as StaffAppointment[];
    return (
      <>
        {header}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    "Customer",
                    "Schedule",
                    "Barber / Service",
                    "Payment",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/appointments/${row.id}`}
                        className="font-semibold hover:text-amber-700"
                      >
                        {row.customer_name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {row.customer_email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.appointment_date}
                      <p className="text-xs text-slate-500">
                        {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.barber_name}
                      <p className="text-xs text-slate-500">
                        {row.service_name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {money(row.payment_amount)}
                      <p className="text-xs text-slate-500">
                        {row.payment_status}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ring-1 ${statusClass(row.status)}`}
                      >
                        {titleCase(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {actionStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              void mutate(
                                `/api/admin/appointments/${row.id}/status`,
                                {
                                  method: "PATCH",
                                  body: JSON.stringify({ status }),
                                },
                              )
                            }
                            className="rounded border border-slate-200 px-2 py-1 text-xs hover:border-amber-400"
                          >
                            {titleCase(status)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <p className="p-8 text-center text-sm text-slate-500">
              No appointments found.
            </p>
          )}
        </div>
      </>
    );
  }
  if (module === "barbers") {
    const rows = (Array.isArray(data) ? data : [data]) as StaffBarber[];
    return (
      <>
        {header}
        {!params.barberId && <InviteForm onDone={load} />}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex justify-between">
                <div>
                  <Link
                    to={`/admin/barbers/${row.id}`}
                    className="font-bold hover:text-amber-700"
                  >
                    {row.name}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {row.email || "Invitation/profile only"}
                  </p>
                  <p className="text-sm text-slate-500">{row.phone}</p>
                </div>
                <span
                  className={`h-fit rounded-full px-2 py-1 text-xs ring-1 ${row.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
                >
                  {row.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={() =>
                  void mutate(`/api/admin/barbers/${row.id}/active`, {
                    method: "PATCH",
                    body: JSON.stringify({ is_active: !row.is_active }),
                  })
                }
                className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {row.is_active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (module === "services") {
    const rows = data as Service[];
    return (
      <>
        {header}
        <ServiceForm barbers={barbers} onDone={load} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-bold">{row.name}</h2>
                  <p className="text-sm text-slate-500">{row.barber_name}</p>
                </div>
                <strong>{money(row.total_price)}</strong>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {row.duration_mins} minutes · {money(row.downpayment_amount)}{" "}
                downpayment
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (module === "payments") {
    const rows = data as StaffPayment[];
    return (
      <>
        {header}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {["Customer", "Barber", "Amount", "Status", "Reference"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {row.customer_name}
                    <p className="text-xs text-slate-500">
                      {row.customer_email}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.barber_name}</td>
                  <td className="px-4 py-3 font-semibold">
                    {money(row.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ring-1 ${statusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row.paymongo_payment_id ||
                      row.paymongo_checkout_id ||
                      "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  const changeBarber = async (id: string) => {
    setSelected(id);
    setAvailability(
      await staffRequest<StaffAvailability>(`/api/admin/availability/${id}`),
    );
  };
  return (
    <>
      {header}
      <select
        value={selected}
        onChange={(e) => void changeBarber(e.target.value)}
        className="mb-5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {barbers.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {availability && (
        <AvailabilityEditor
          value={availability}
          savePath={`/api/admin/availability/${selected}`}
          onDone={load}
        />
      )}
    </>
  );
};

const InviteForm: React.FC<{ onDone: () => Promise<void> }> = ({ onDone }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [invites, setInvites] = useState<
    { id: string; name: string; email: string; status: string }[]
  >([]);
  const loadInvites = useCallback(
    async () => setInvites(await staffRequest("/api/admin/barber-invitations")),
    [],
  );
  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await staffRequest("/api/admin/barber-invitations", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ name: "", email: "", phone: "" });
    await Promise.all([onDone(), loadInvites()]);
  };
  const invitationAction = async (id: string, action: "resend" | "revoke") => {
    if (!confirm(`${titleCase(action)} this invitation?`)) return;
    await staffRequest(
      `/api/admin/barber-invitations/${id}${action === "resend" ? "/resend" : ""}`,
      { method: action === "resend" ? "POST" : "DELETE" },
    );
    await loadInvites();
  };
  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4"
      >
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <button className="rounded-md bg-amber-500 px-4 py-2 font-semibold text-slate-950">
          Send invitation
        </button>
      </form>
      {invites.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-bold">Invitations</h2>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-3 text-sm"
              >
                <div>
                  <strong>{invite.name}</strong>
                  <p className="text-slate-500">
                    {invite.email} · {titleCase(invite.status)}
                  </p>
                </div>
                {invite.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => void invitationAction(invite.id, "resend")}
                      className="rounded border border-slate-300 px-2 py-1"
                    >
                      Resend
                    </button>
                    <button
                      onClick={() => void invitationAction(invite.id, "revoke")}
                      className="rounded border border-red-200 px-2 py-1 text-red-700"
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
const ServiceForm: React.FC<{
  barbers: StaffBarber[];
  onDone: () => Promise<void>;
}> = ({ barbers, onDone }) => {
  const [form, setForm] = useState({
    barber_id: "",
    name: "",
    description: "",
    total_price: "",
    downpayment_amount: "",
    duration_mins: 30,
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await staffRequest("/api/admin/services", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        duration_mins: Number(form.duration_mins),
      }),
    });
    await onDone();
  };
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3"
    >
      <select
        required
        value={form.barber_id}
        onChange={(e) => setForm({ ...form, barber_id: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-2"
      >
        <option value="">Select barber</option>
        {barbers
          .filter((b) => b.is_active)
          .map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
      </select>
      {(["name", "total_price", "downpayment_amount"] as const).map((key) => (
        <input
          key={key}
          required
          placeholder={titleCase(key)}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      ))}
      <input
        required
        type="number"
        min="30"
        step="30"
        value={form.duration_mins}
        onChange={(e) =>
          setForm({ ...form, duration_mins: Number(e.target.value) })
        }
        className="rounded-md border border-slate-300 px-3 py-2"
      />
      <button className="rounded-md bg-amber-500 px-4 py-2 font-semibold">
        Add service
      </button>
    </form>
  );
};
export const AvailabilityEditor: React.FC<{
  value: StaffAvailability;
  savePath: string;
  onDone: () => Promise<void>;
}> = ({ value, savePath, onDone }) => {
  const [hours, setHours] = useState<WorkingHour[]>(value.hours);
  const [block, setBlock] = useState({
    block_date: "",
    start_time: "09:00",
    end_time: "18:00",
    reason: "",
  });
  useEffect(() => setHours(value.hours), [value]);
  const addHour = () =>
    setHours([
      ...hours,
      { weekday: 1, start_time: "09:00", end_time: "18:00" },
    ]);
  const save = async () => {
    await staffRequest(`${savePath}/hours`, {
      method: "PUT",
      body: JSON.stringify({ hours }),
    });
    await onDone();
  };
  const addBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    await staffRequest(`${savePath}/blocks`, {
      method: "POST",
      body: JSON.stringify(block),
    });
    await onDone();
  };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex justify-between">
          <h2 className="font-bold">Weekly hours</h2>
          <button
            onClick={addHour}
            className="text-sm font-semibold text-amber-700"
          >
            Add period
          </button>
        </div>
        <div className="space-y-3">
          {hours.map((hour, index) => (
            <div
              key={`${hour.weekday}-${index}`}
              className="grid grid-cols-3 gap-2"
            >
              <select
                value={hour.weekday}
                onChange={(e) =>
                  setHours(
                    hours.map((item, i) =>
                      i === index
                        ? { ...item, weekday: Number(e.target.value) }
                        : item,
                    ),
                  )
                }
                className="rounded border border-slate-300 px-2 py-2"
              >
                {weekdays.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={hour.start_time.slice(0, 5)}
                onChange={(e) =>
                  setHours(
                    hours.map((item, i) =>
                      i === index
                        ? { ...item, start_time: e.target.value }
                        : item,
                    ),
                  )
                }
                className="rounded border border-slate-300 px-2"
              />
              <input
                type="time"
                value={hour.end_time.slice(0, 5)}
                onChange={(e) =>
                  setHours(
                    hours.map((item, i) =>
                      i === index
                        ? { ...item, end_time: e.target.value }
                        : item,
                    ),
                  )
                }
                className="rounded border border-slate-300 px-2"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => void save()}
          className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold"
        >
          Save hours
        </button>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-bold">Blocked periods</h2>
        <form
          onSubmit={(e) => void addBlock(e)}
          className="grid gap-2 sm:grid-cols-2"
        >
          <input
            required
            type="date"
            value={block.block_date}
            onChange={(e) => setBlock({ ...block, block_date: e.target.value })}
            className="rounded border border-slate-300 px-2 py-2"
          />
          <input
            placeholder="Reason"
            value={block.reason}
            onChange={(e) => setBlock({ ...block, reason: e.target.value })}
            className="rounded border border-slate-300 px-2"
          />
          <input
            type="time"
            value={block.start_time}
            onChange={(e) => setBlock({ ...block, start_time: e.target.value })}
            className="rounded border border-slate-300 px-2"
          />
          <input
            type="time"
            value={block.end_time}
            onChange={(e) => setBlock({ ...block, end_time: e.target.value })}
            className="rounded border border-slate-300 px-2"
          />
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
            Add block
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {value.blocks.map((item) => (
            <div key={item.id} className="rounded bg-slate-50 p-3 text-sm">
              <strong>{item.block_date}</strong> · {item.start_time.slice(0, 5)}
              –{item.end_time.slice(0, 5)}
              <p className="text-slate-500">{item.reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
export default AdminPortalSection;
