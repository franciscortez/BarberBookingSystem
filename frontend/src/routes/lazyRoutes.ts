import { lazy, type ComponentType } from "react";

type LazyImport<T extends ComponentType<object>> = () => Promise<{
  default: T;
}>;

const lazyWithPreload = <T extends ComponentType<object>>(
  loader: LazyImport<T>,
) => {
  const Component = lazy(loader);
  return Object.assign(Component, { preload: loader });
};

export const BookingFunnelRoute = lazyWithPreload(
  () => import("../pages/user/BookingFunnel"),
);
export const SuccessPageRoute = lazyWithPreload(
  () => import("../pages/user/SuccessPage"),
);
export const RescheduleBookingRoute = lazyWithPreload(
  () => import("../pages/user/RescheduleBooking"),
);
export const CancelBookingRoute = lazyWithPreload(
  () => import("../pages/user/CancelBooking"),
);
export const LoginRoute = lazyWithPreload(() => import("../pages/user/Login"));
export const AcceptBarberInvitationRoute = lazyWithPreload(
  () => import("../pages/user/AcceptBarberInvitation"),
);
export const AdminDashboardRoute = lazyWithPreload(
  () => import("../pages/admin/Dashboard"),
);
export const AdminAppointmentsRoute = lazyWithPreload(
  () => import("../pages/admin/Appointments"),
);
export const AdminBarbersRoute = lazyWithPreload(
  () => import("../pages/admin/Barbers"),
);
export const AdminServicesRoute = lazyWithPreload(
  () => import("../pages/admin/Services"),
);
export const AdminAvailabilityRoute = lazyWithPreload(
  () => import("../pages/admin/Availability"),
);
export const AdminPaymentsRoute = lazyWithPreload(
  () => import("../pages/admin/Payments"),
);
export const BarberDashboardRoute = lazyWithPreload(
  () => import("../pages/barber/Dashboard"),
);
export const BarberAppointmentsRoute = lazyWithPreload(
  () => import("../pages/barber/Appointments"),
);
export const BarberAvailabilityRoute = lazyWithPreload(
  () => import("../pages/barber/Availability"),
);
export const BarberProfileRoute = lazyWithPreload(
  () => import("../pages/barber/Profile"),
);

export const preloadBookingRoute = () => {
  void BookingFunnelRoute.preload();
};

export const preloadLoginRoute = () => {
  void LoginRoute.preload();
};
