import React from "react";
import { Scissors, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Barber, Service } from "../../../types";
import { formatPrice, parseAmount } from "../../../utils/booking";
import { BarberSkeleton, ServiceSkeleton } from "./BookingSkeletons";
import { Clock } from "lucide-react";

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface BarberServiceStepProps {
  barbers: Barber[];
  services: Service[];
  loadingBarbers: boolean;
  loadingServices: boolean;
  selectedBarber: Barber | null;
  selectedService: Service | null;
  servicesByBarber: Map<string, Service[]>;
  visibleServiceGroups: { barber: Barber; services: Service[] }[];
  onSelectBarber: (barber: Barber) => void;
  onSelectService: (service: Service) => void;
}

const BarberServiceStep: React.FC<BarberServiceStepProps> = ({
  barbers,
  loadingBarbers,
  loadingServices,
  selectedBarber,
  selectedService,
  servicesByBarber,
  visibleServiceGroups,
  onSelectBarber,
  onSelectService,
}) => (
  <div>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Scissors className="w-5 h-5 text-amber-400" />
        Select Your Barber &amp; Preferred Service
      </h2>

      {/* Dedicated Policy Note */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-500/90 text-[10px] font-bold uppercase tracking-tight italic">
        <AlertCircle className="w-3.5 h-3.5" />
        Downpayments are non-refundable
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
      {/* Barbers */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Choose Barber
        </label>
        <div className="space-y-3">
          {loadingBarbers ? (
            <>
              <BarberSkeleton />
              <BarberSkeleton />
            </>
          ) : barbers.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">
              No barbers available.
            </p>
          ) : (
            barbers.map((barber) => {
              const isSelected = selectedBarber?.id === barber.id;
              return (
                <button
                  key={barber.id}
                  onClick={() => onSelectBarber(barber)}
                  className={`w-full p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 text-left ${
                    isSelected
                      ? "border-amber-500/60 bg-amber-500/8 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {getInitials(barber.name)}
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`font-semibold text-sm ${isSelected ? "text-white" : "text-zinc-300"}`}
                    >
                      {barber.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {servicesByBarber.get(barber.id)?.length ?? 0}{" "}
                      {(servicesByBarber.get(barber.id)?.length ?? 0) === 1
                        ? "service"
                        : "services"}{" "}
                      available
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 ml-auto shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Services */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Select Service
        </label>
        {loadingServices ? (
          <div className="space-y-3">
            <ServiceSkeleton />
            <ServiceSkeleton />
          </div>
        ) : visibleServiceGroups.length === 0 ? (
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 text-center text-zinc-500 text-sm">
            {selectedBarber
              ? "No services available for this barber."
              : "No services available."}
          </div>
        ) : (
          <div className="space-y-4 max-h-[470px] overflow-y-auto pr-1">
            {visibleServiceGroups.map((group) => (
              <div key={group.barber.id} className="space-y-2">
                {!selectedBarber && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-px flex-grow bg-zinc-900" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {group.barber.name}
                    </span>
                    <div className="h-px flex-grow bg-zinc-900" />
                  </div>
                )}
                {group.services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  const remainingBalance =
                    parseAmount(service.total_price) -
                    parseAmount(service.downpayment_amount);

                  return (
                    <button
                      key={service.id}
                      onClick={() => onSelectService(service)}
                      className={`w-full p-4 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? "border-amber-500/60 bg-amber-500/8 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4
                            className={`font-semibold text-sm ${isSelected ? "text-white" : "text-zinc-300"}`}
                          >
                            {service.name}
                          </h4>
                          {service.description && (
                            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                              {service.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-2.5 sm:p-3">
                        <div>
                          <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-600">
                            Duration
                          </span>
                          <span
                            className={`mt-0.5 flex items-center gap-1 text-[11px] sm:text-xs font-semibold ${isSelected ? "text-amber-400" : "text-zinc-300"}`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />{" "}
                            {service.duration_mins}m
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-600">
                            Total
                          </span>
                          <span
                            className={`mt-0.5 block text-[11px] sm:text-xs font-semibold truncate ${isSelected ? "text-amber-400" : "text-zinc-300"}`}
                          >
                            {formatPrice(service.total_price)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-600">
                            Due Now
                          </span>
                          <span
                            className={`mt-0.5 block text-[11px] sm:text-xs font-semibold truncate ${isSelected ? "text-amber-400" : "text-zinc-300"}`}
                          >
                            {formatPrice(service.downpayment_amount)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-[10px] text-zinc-600">
                        Remaining balance after downpayment:{" "}
                        {formatPrice(remainingBalance)}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default BarberServiceStep;
