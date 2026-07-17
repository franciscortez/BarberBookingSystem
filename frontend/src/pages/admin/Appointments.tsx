import React from "react";
import AdminPortalSection from "../../sections/admin/AdminPortalSection";
import RescheduleAppointment from "../../components/staff/RescheduleAppointment";
const Appointments: React.FC = () => (
  <>
    <AdminPortalSection module="appointments" />
    <RescheduleAppointment role="admin" />
  </>
);
export default Appointments;
