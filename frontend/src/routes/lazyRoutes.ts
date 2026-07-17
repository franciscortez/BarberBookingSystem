import { lazy, type ComponentType } from 'react';

type LazyImport<T extends ComponentType<object>> = () => Promise<{ default: T }>;

const lazyWithPreload = <T extends ComponentType<object>>(loader: LazyImport<T>) => {
  const Component = lazy(loader);
  return Object.assign(Component, { preload: loader });
};

export const BookingFunnelRoute = lazyWithPreload(() => import('../pages/user/BookingFunnel'));
export const SuccessPageRoute = lazyWithPreload(() => import('../pages/user/SuccessPage'));
export const RescheduleBookingRoute = lazyWithPreload(() => import('../pages/user/RescheduleBooking'));
export const CancelBookingRoute = lazyWithPreload(() => import('../pages/user/CancelBooking'));
export const LoginRoute = lazyWithPreload(() => import('../pages/user/Login'));

export const preloadBookingRoute = () => {
  void BookingFunnelRoute.preload();
};

export const preloadLoginRoute = () => {
  void LoginRoute.preload();
};
