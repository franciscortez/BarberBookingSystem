import { lazy, type ComponentType } from 'react';

type LazyImport<T extends ComponentType<object>> = () => Promise<{ default: T }>;

const lazyWithPreload = <T extends ComponentType<object>>(loader: LazyImport<T>) => {
  const Component = lazy(loader);
  return Object.assign(Component, { preload: loader });
};

export const BookingFunnelRoute = lazyWithPreload(() => import('../pages/BookingFunnel'));
export const SuccessPageRoute = lazyWithPreload(() => import('../pages/SuccessPage'));
export const RescheduleBookingRoute = lazyWithPreload(() => import('../pages/RescheduleBooking'));
export const CancelBookingRoute = lazyWithPreload(() => import('../pages/CancelBooking'));
export const LoginRoute = lazyWithPreload(() => import('../pages/Login'));

export const preloadBookingRoute = () => {
  void BookingFunnelRoute.preload();
};

export const preloadLoginRoute = () => {
  void LoginRoute.preload();
};
