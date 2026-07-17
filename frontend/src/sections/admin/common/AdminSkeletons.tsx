import React from "react";

export const HeaderSkeleton: React.FC = () => (
  <div className="mb-6 animate-pulse">
    <div className="h-3 w-24 rounded-sm bg-slate-200" />
    <div className="mt-2 h-7 w-48 rounded-md bg-slate-200" />
    <div className="mt-2 h-4 w-64 rounded-sm bg-slate-200" />
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <>
    <HeaderSkeleton />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-xs"
        >
          <div className="h-4 w-24 rounded-sm bg-slate-200" />
          <div className="mt-3 h-8 w-20 rounded-md bg-slate-200" />
        </div>
      ))}
    </div>
    <div className="mt-6 grid gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-13 animate-pulse rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="h-4 w-28 rounded-sm bg-slate-200" />
        </div>
      ))}
    </div>
  </>
);

export const AppointmentsSkeleton: React.FC = () => (
  <>
    <HeaderSkeleton />
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded-sm bg-slate-200" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 pt-3">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-32 rounded-sm bg-slate-200" />
              <div className="h-3 w-40 rounded-sm bg-slate-200" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-24 rounded-sm bg-slate-200" />
              <div className="h-3 w-28 rounded-sm bg-slate-200" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-28 rounded-sm bg-slate-200" />
              <div className="h-3 w-20 rounded-sm bg-slate-200" />
            </div>
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="flex gap-1">
              <div className="h-6 w-14 rounded-sm bg-slate-200" />
              <div className="h-6 w-14 rounded-sm bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const BarbersSkeleton: React.FC = () => (
  <>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <HeaderSkeleton />
      <div className="h-10 w-36 rounded-lg bg-slate-200 animate-pulse" />
    </div>
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between gap-4">
          {["Name", "Email", "Phone", "Status", "Actions"].map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded-sm bg-slate-200" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 pt-2">
            <div className="h-4 w-28 flex-1 rounded-sm bg-slate-200" />
            <div className="h-4 w-40 flex-1 rounded-sm bg-slate-200" />
            <div className="h-4 w-28 flex-1 rounded-sm bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="h-7 w-24 rounded-md bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  </>
);

export const ServicesSkeleton: React.FC = () => (
  <>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <HeaderSkeleton />
      <div className="h-10 w-36 rounded-lg bg-slate-200 animate-pulse" />
    </div>
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between gap-4">
          {["Service", "Barber", "Total Price", "Downpayment", "Duration"].map(
            (_, i) => (
              <div key={i} className="h-4 flex-1 rounded-sm bg-slate-200" />
            ),
          )}
        </div>
      </div>
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 pt-2">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 rounded-sm bg-slate-200" />
              <div className="h-3 w-48 rounded-sm bg-slate-200" />
            </div>
            <div className="h-4 w-24 flex-1 rounded-sm bg-slate-200" />
            <div className="h-4 w-20 flex-1 rounded-sm bg-slate-200" />
            <div className="h-4 w-20 flex-1 rounded-sm bg-slate-200" />
            <div className="h-4 w-16 flex-1 rounded-sm bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  </>
);

export const AvailabilitySkeleton: React.FC = () => (
  <>
    <HeaderSkeleton />
    <div className="mb-5 h-10 w-44 rounded-md bg-slate-200 animate-pulse" />

    <div className="grid gap-5 lg:grid-cols-2">
      <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex justify-between">
          <div className="h-5 w-32 rounded-md bg-slate-200" />
          <div className="h-4 w-20 rounded-sm bg-slate-200" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <div className="h-9 rounded-md bg-slate-200" />
            <div className="h-9 rounded-md bg-slate-200" />
            <div className="h-9 rounded-md bg-slate-200" />
          </div>
        ))}
        <div className="h-9 w-28 rounded-md bg-slate-200" />
      </div>

      <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="h-5 w-36 rounded-md bg-slate-200" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="h-9 rounded-md bg-slate-200" />
          <div className="h-9 rounded-md bg-slate-200" />
          <div className="h-9 rounded-md bg-slate-200" />
          <div className="h-9 rounded-md bg-slate-200" />
          <div className="h-9 rounded-md bg-slate-200 sm:col-span-2" />
        </div>
        <div className="space-y-2">
          <div className="h-12 rounded-md bg-slate-200" />
          <div className="h-12 rounded-md bg-slate-200" />
        </div>
      </div>
    </div>
  </>
);

export const PaymentsSkeleton: React.FC = () => (
  <>
    <HeaderSkeleton />
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded-sm bg-slate-200" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 pt-3">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-32 rounded-sm bg-slate-200" />
              <div className="h-3 w-40 rounded-sm bg-slate-200" />
            </div>
            <div className="h-4 w-28 flex-1 rounded-sm bg-slate-200" />
            <div className="h-4 w-20 flex-1 rounded-sm bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="h-4 w-32 flex-1 rounded-sm bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  </>
);
