import React from "react";
import BarberPortalSection from "../../sections/barber/BarberPortalSection";
import RescheduleAppointment from "../../components/staff/RescheduleAppointment";
const Appointments: React.FC = () => (
  <>
    <BarberPortalSection module="appointments" />
    <RescheduleAppointment role="barber" />
  </>
);
export default Appointments;
