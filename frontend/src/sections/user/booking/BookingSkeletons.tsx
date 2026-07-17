import React from "react";

export const BarberSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
    <div className="flex-grow space-y-2">
      <div className="h-4 w-28 bg-zinc-800 rounded" />
      <div className="h-3 w-36 bg-zinc-800 rounded" />
    </div>
  </div>
);

export const ServiceSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 animate-pulse flex justify-between items-center">
    <div className="space-y-2">
      <div className="h-4 w-32 bg-zinc-800 rounded" />
      <div className="h-3 w-16 bg-zinc-800 rounded" />
    </div>
    <div className="space-y-1.5 text-right">
      <div className="h-5 w-20 bg-zinc-800 rounded" />
      <div className="h-3 w-24 bg-zinc-800 rounded" />
    </div>
  </div>
);
