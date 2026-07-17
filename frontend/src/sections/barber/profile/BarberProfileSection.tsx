import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import type { StaffBarber } from "../../../types";
import { BarberFormSkeleton } from "../../admin/common/AdminSkeletons";

interface BarberProfileSectionProps {
  loading: boolean;
  error: string;
  profile: StaffBarber | null;
  onUpdateProfile: (name: string, phone: string) => Promise<void>;
  onUpdatePassword: (current_password: string, new_password: string) => Promise<void>;
}

const BarberProfileSection: React.FC<BarberProfileSectionProps> = ({
  loading,
  error,
  profile,
  onUpdateProfile,
  onUpdatePassword,
}) => {
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordStatusMessage, setPasswordStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (loading) return <BarberFormSkeleton />;
  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  if (!profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      await onUpdateProfile(name, phone);
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatusMessage({
        type: "error",
        text: "New passwords do not match",
      });
      return;
    }
    setUpdatingPassword(true);
    setPasswordStatusMessage(null);
    try {
      await onUpdatePassword(currentPassword, newPassword);
      setPasswordStatusMessage({
        type: "success",
        text: "Password updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update password",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Barber Profile</h1>
        <p className="text-sm text-slate-500">
          Update your public display details and contact information.
        </p>
      </div>

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

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Contact Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Email Address (Account Identifier)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              disabled
              value={profile.email ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Email cannot be changed directly. Contact shop administration for
            account modifications.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-2xs hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
          </button>
        </div>
      </form>

      <form
        onSubmit={(e) => void handlePasswordSubmit(e)}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs mt-6"
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Update Password</h2>
          <p className="text-xs text-slate-500">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>

        {passwordStatusMessage && (
          <div
            className={`flex items-center gap-2.5 rounded-lg border p-4 text-sm font-medium ${
              passwordStatusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {passwordStatusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{passwordStatusMessage.text}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Current Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={updatingPassword}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-2xs hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{updatingPassword ? "Updating Password..." : "Update Password"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BarberProfileSection;
