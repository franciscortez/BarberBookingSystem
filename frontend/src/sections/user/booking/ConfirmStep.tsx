import React from "react";
import { CreditCard, Clock, AlertCircle } from "lucide-react";
import type { Barber, Service } from "../../../types";
import {
  formatDate,
  formatPrice,
  formatTime,
  parseAmount,
} from "../../../utils/booking";

interface ConfirmStepProps {
  selectedBarber: Barber;
  selectedService: Service;
  selectedDate: string;
  selectedSlot: { start: string; end: string };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  selectedBarber,
  selectedService,
  selectedDate,
  selectedSlot,
  customerName,
  customerEmail,
  customerPhone,
}) => (
  <div>
    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
      <CreditCard className="w-5 h-5 text-amber-400" />
      Review &amp; Proceed to Downpayment
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Summary Card */}
      <div className="md:col-span-2 space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6">
        <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-zinc-800 pb-2">
          Booking Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 sm:gap-y-3 text-xs sm:text-sm">
          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Barber:</span>
            <span className="text-zinc-200 font-medium">
              {selectedBarber.name}
            </span>
          </div>

          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Service:</span>
            <span className="text-zinc-200 font-medium">
              {selectedService.name}
            </span>
          </div>

          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Duration:</span>
            <span className="text-zinc-200 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />{" "}
              {selectedService.duration_mins} minutes
            </span>
          </div>

          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Date:</span>
            <span className="text-amber-400 font-medium">
              {formatDate(selectedDate)}
            </span>
          </div>

          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Time:</span>
            <span className="text-amber-400 font-medium">
              {formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}
            </span>
          </div>

          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Client:</span>
            <span className="text-zinc-200 font-medium">{customerName}</span>
          </div>

          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Email:</span>
            <span className="text-zinc-200 font-medium break-all">
              {customerEmail}
            </span>
          </div>

          <div className="flex justify-between sm:contents">
            <span className="text-zinc-500">Phone:</span>
            <span className="text-zinc-200 font-medium">{customerPhone}</span>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-amber-500/10 pb-2 mb-4">
            Payment Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Total Price:</span>
              <span className="text-zinc-300 font-semibold">
                {formatPrice(selectedService.total_price)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Downpayment Required:</span>
              <span className="text-amber-400 font-bold">
                {formatPrice(selectedService.downpayment_amount)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Remaining Balance:</span>
              <span className="text-zinc-400">
                {formatPrice(
                  parseAmount(selectedService.total_price) -
                    parseAmount(selectedService.downpayment_amount),
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[10px] text-zinc-400 leading-relaxed">
            <p>
              You will be redirected to our secure PayMongo checkout to process
              the downpayment and confirm your slot.
            </p>
            <p className="mt-1.5 text-amber-500 font-bold uppercase tracking-tight italic">
              Note: All downpayments are strictly non-refundable.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ConfirmStep;
