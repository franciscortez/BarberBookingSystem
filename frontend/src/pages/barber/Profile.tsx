/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from "react";
import BarberProfileSection from "../../sections/barber/profile/BarberProfileSection";
import { staffRequest } from "../../services/staffApi";
import type { StaffBarber } from "../../types";

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<StaffBarber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await staffRequest<StaffBarber>("/api/barber/profile");
      setProfile(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (name: string, phone: string) => {
    await staffRequest("/api/barber/profile", {
      method: "PATCH",
      body: JSON.stringify({ name, phone }),
    });
    await fetchProfile();
  };

  return (
    <BarberProfileSection
      loading={loading}
      error={error}
      profile={profile}
      onUpdateProfile={handleUpdateProfile}
    />
  );
};

export default Profile;
