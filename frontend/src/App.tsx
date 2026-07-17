import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PublicLayout from "./components/PublicLayout";
import RoleGuard from "./components/staff/RoleGuard";
import StaffShell from "./components/staff/StaffShell";
import Home from "./pages/user/Home";
import {
  BookingFunnelRoute,
  CancelBookingRoute,
  RescheduleBookingRoute,
  SuccessPageRoute,
  LoginRoute,
  AcceptBarberInvitationRoute,
  AdminDashboardRoute,
  AdminAppointmentsRoute,
  AdminBarbersRoute,
  AdminServicesRoute,
  AdminAvailabilityRoute,
  AdminPaymentsRoute,
  BarberDashboardRoute,
  BarberAppointmentsRoute,
  BarberAvailabilityRoute,
  BarberProfileRoute,
} from "./routes/lazyRoutes";

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-6 pt-28 text-sm text-zinc-500">
    Loading...
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/book" element={<BookingFunnelRoute />} />
              <Route path="/success" element={<SuccessPageRoute />} />
              <Route
                path="/reschedule-booking"
                element={<RescheduleBookingRoute />}
              />
              <Route path="/cancel-booking" element={<CancelBookingRoute />} />
              <Route path="/login" element={<LoginRoute />} />
              <Route
                path="/accept-barber-invitation"
                element={<AcceptBarberInvitationRoute />}
              />
            </Route>
            <Route element={<RoleGuard role="admin" />}>
              <Route element={<StaffShell role="admin" />}>
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboardRoute />}
                />
                <Route
                  path="/admin/appointments"
                  element={<AdminAppointmentsRoute />}
                />
                <Route
                  path="/admin/appointments/:appointmentId"
                  element={<AdminAppointmentsRoute />}
                />
                <Route path="/admin/barbers" element={<AdminBarbersRoute />} />
                <Route
                  path="/admin/barbers/:barberId"
                  element={<AdminBarbersRoute />}
                />
                <Route
                  path="/admin/services"
                  element={<AdminServicesRoute />}
                />
                <Route
                  path="/admin/availability"
                  element={<AdminAvailabilityRoute />}
                />
                <Route
                  path="/admin/payments"
                  element={<AdminPaymentsRoute />}
                />
              </Route>
            </Route>
            <Route element={<RoleGuard role="barber" />}>
              <Route element={<StaffShell role="barber" />}>
                <Route
                  path="/barber"
                  element={<Navigate to="/barber/dashboard" replace />}
                />
                <Route
                  path="/barber/dashboard"
                  element={<BarberDashboardRoute />}
                />
                <Route
                  path="/barber/appointments"
                  element={<BarberAppointmentsRoute />}
                />
                <Route
                  path="/barber/appointments/:appointmentId"
                  element={<BarberAppointmentsRoute />}
                />
                <Route
                  path="/barber/availability"
                  element={<BarberAvailabilityRoute />}
                />
                <Route
                  path="/barber/profile"
                  element={<BarberProfileRoute />}
                />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
