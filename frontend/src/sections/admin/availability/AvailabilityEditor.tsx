/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { staffRequest } from "../../../services/staffApi";
import type { StaffAvailability, WorkingHour } from "../../../types";
import { weekdays } from "../adminPortalUtils";

interface AvailabilityEditorProps {
  value: StaffAvailability;
  savePath: string;
  onDone: () => Promise<void>;
}

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  value,
  savePath,
  onDone,
}) => {
  const [hours, setHours] = useState<WorkingHour[]>(value.hours);
  const [savingHours, setSavingHours] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [block, setBlock] = useState({
    block_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "18:00",
    reason: "",
  });

  useEffect(() => {
    setHours(value.hours);
  }, [value]);

  const addPeriod = (weekday: number) => {
    setHours([...hours, { weekday, start_time: "09:00", end_time: "18:00" }]);
  };

  const removePeriod = (index: number) => {
    setHours(hours.filter((_, i) => i !== index));
  };

  const updatePeriod = (
    index: number,
    field: "start_time" | "end_time" | "weekday",
    val: string | number,
  ) => {
    setHours(hours.map((h, i) => (i === index ? { ...h, [field]: val } : h)));
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    setStatusMessage(null);
    try {
      await staffRequest(`${savePath}/hours`, {
        method: "PUT",
        body: JSON.stringify({ hours }),
      });
      setStatusMessage({
        type: "success",
        text: "Working hours updated successfully!",
      });
      await onDone();
    } catch (e: unknown) {
      setStatusMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to update working hours",
      });
    } finally {
      setSavingHours(false);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingBlock(true);
    setStatusMessage(null);
    try {
      await staffRequest(`${savePath}/blocks`, {
        method: "POST",
        body: JSON.stringify(block),
      });
      setBlock({
        block_date: new Date().toISOString().split("T")[0],
        start_time: "09:00",
        end_time: "18:00",
        reason: "",
      });
      setStatusMessage({
        type: "success",
        text: "Availability block added!",
      });
      await onDone();
    } catch (e: unknown) {
      setStatusMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to add block",
      });
    } finally {
      setAddingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("Remove this blocked period?")) return;
    setStatusMessage(null);
    try {
      await staffRequest(`${savePath}/blocks/${blockId}`, {
        method: "DELETE",
      });
      setStatusMessage({
        type: "success",
        text: "Blocked period removed!",
      });
      await onDone();
    } catch (e: unknown) {
      setStatusMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to remove block",
      });
    }
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-lg border p-4 text-sm font-medium ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Weekly Working Hours Card */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-base">Weekly Working Schedule</h2>
              </div>
            </div>

            <div className="space-y-4">
              {weekdays.map((dayName, dayIndex) => {
                const dayPeriods = hours
                  .map((h, originalIndex) => ({ ...h, originalIndex }))
                  .filter((h) => Number(h.weekday) === dayIndex);

                return (
                  <div
                    key={dayName}
                    className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {dayName}
                      </span>
                      <button
                        type="button"
                        onClick={() => addPeriod(dayIndex)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Shift</span>
                      </button>
                    </div>

                    {dayPeriods.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Day Off / Unavailable
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dayPeriods.map((period) => (
                          <div
                            key={period.originalIndex}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="time"
                              value={period.start_time.slice(0, 5)}
                              onChange={(e) =>
                                updatePeriod(
                                  period.originalIndex,
                                  "start_time",
                                  e.target.value,
                                )
                              }
                              className="w-32 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
                            />
                            <span className="text-xs text-slate-400 font-medium">
                              to
                            </span>
                            <input
                              type="time"
                              value={period.end_time.slice(0, 5)}
                              onChange={(e) =>
                                updatePeriod(
                                  period.originalIndex,
                                  "end_time",
                                  e.target.value,
                                )
                              }
                              className="w-32 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => removePeriod(period.originalIndex)}
                              title="Delete Shift"
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={savingHours}
              onClick={() => void handleSaveHours()}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-xs hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>{savingHours ? "Saving..." : "Save Working Hours"}</span>
            </button>
          </div>
        </section>

        {/* Blocked Dates & Overrides Card */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 text-slate-900">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-base">Blocked Dates & Time Off</h2>
            </div>

            <form
              onSubmit={(e) => void handleAddBlock(e)}
              className="space-y-3.5 p-4 rounded-lg bg-slate-50 border border-slate-100 mb-6"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Block Specific Time Slot
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Block Date
                </label>
                <input
                  required
                  type="date"
                  value={block.block_date}
                  onChange={(e) =>
                    setBlock({ ...block, block_date: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={block.start_time}
                    onChange={(e) =>
                      setBlock({ ...block, start_time: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={block.end_time}
                    onChange={(e) =>
                      setBlock({ ...block, end_time: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Reason / Note
                </label>
                <input
                  placeholder="e.g. Lunch Break, Vacation, Maintenance"
                  value={block.reason}
                  onChange={(e) =>
                    setBlock({ ...block, reason: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={addingBlock}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addingBlock ? "Adding..." : "Add Blocked Time"}</span>
              </button>
            </form>

            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Active Blocked Slots ({value.blocks.length})
              </h3>
              {value.blocks.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No blocked time slots scheduled.
                </p>
              ) : (
                value.blocks.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {item.block_date}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                          {item.start_time.slice(0, 5)} –{" "}
                          {item.end_time.slice(0, 5)}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="mt-1 text-slate-500">{item.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteBlock(item.id)}
                      title="Remove Block"
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AvailabilityEditor;
