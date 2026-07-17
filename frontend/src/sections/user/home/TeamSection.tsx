import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Barber } from "../../../types";
import { getBarberVisuals } from "./teamUtils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const BarberSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 animate-pulse flex flex-col md:flex-row gap-6">
    <div className="w-24 h-24 rounded-2xl bg-zinc-800/80 shrink-0" />
    <div className="flex-grow space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-6 w-32 bg-zinc-800/80 rounded" />
        <div className="h-4 w-12 bg-zinc-800/80 rounded-full" />
      </div>
      <div className="h-4 w-48 bg-zinc-800/80 rounded" />
      <div className="space-y-2 mt-2">
        <div className="h-4 w-full bg-zinc-800/80 rounded" />
        <div className="h-4 w-5/6 bg-zinc-800/80 rounded" />
      </div>
    </div>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeamSectionProps {
  loading: boolean;
  barbers: Barber[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const TeamSection: React.FC<TeamSectionProps> = ({ loading, barbers }) => (
  <section
    id="team"
    className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 border-t border-zinc-900"
  >
    <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
        Meet Our Master Craftsmen
      </h2>
      <p className="mt-4 text-zinc-400 text-sm sm:text-base">
        Award-winning stylists dedicated to elevating your personal profile and
        style standards.
      </p>
    </div>

    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto items-stretch">
      {loading ? (
        <>
          <div className="lg:flex-1 lg:min-w-0">
            <BarberSkeleton />
          </div>
          <div className="lg:flex-1 lg:min-w-0">
            <BarberSkeleton />
          </div>
        </>
      ) : barbers.length > 0 ? (
        barbers.map((barber) => {
          const visuals = getBarberVisuals(barber.name);
          return (
            <div
              key={barber.id}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-6 p-5 sm:p-6 lg:flex-1 lg:min-w-0"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-850 shrink-0 flex items-center justify-center font-bold text-2xl sm:text-3xl text-amber-400 border border-zinc-700 group-hover:scale-105 transition-transform duration-300 mx-auto sm:mx-0">
                {visuals.initials}
              </div>
              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">
                      {barber.name}
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium block mt-1">
                    {visuals.specialty}
                  </span>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    {visuals.bio}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    to={`/book?barberId=${barber.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Book with {barber.name.split(" ")[0]}{" "}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="col-span-full py-12 text-center text-zinc-500">
          No barbers are currently active.
        </div>
      )}
    </div>
  </section>
);

export default TeamSection;
