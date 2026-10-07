import React, { useState } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  Waves,
  Dumbbell,
  PartyPopper,
  Gamepad2,
  Clock,
  Calendar,
  ShieldAlert,
  Download,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';

export const AmenitiesView: React.FC = () => {
  const {
    bookings,
    cancelBooking,
    setIsBookingModalOpen,
    setTargetAmenity,
    userFlat,
    role,
    filterOnlyMyFilings,
    setFilterOnlyMyFilings,
  } = useSociety();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pool' | 'gym' | 'clubhouse' | 'games'>('all');

  const filteredBookings = bookings.filter((b) => {
    if (!filterOnlyMyFilings) return true;
    return b.flatNo.toLowerCase().trim() === userFlat.toLowerCase().trim();
  });

  const poolImg = '/src/assets/images/amenity_swimming_pool_1790929965312.jpg';
  const gymImg = '/src/assets/images/amenity_modern_gym_1790929982674.jpg';

  const handleBook = (amenity: 'pool' | 'gym' | 'clubhouse' | 'play_area') => {
    setTargetAmenity(amenity);
    setIsBookingModalOpen(true);
  };

  const downloadPdf = (docName: string) => {
    alert(`Downloaded: ${docName}.pdf`);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Resident Facilities & Recreation
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Society Amenities & Reservation Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All recreational facilities are maintained via certified service contracts. Reserve your slots to avoid crowding and review community hygiene guidelines.
          </p>
        </div>

        {/* Filter Bar (Functional segmented buttons) */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-xl">
          {[
            { id: 'all', label: 'All Facilities' },
            { id: 'pool', label: 'Swimming Pool' },
            { id: 'gym', label: 'Gymnasium' },
            { id: 'clubhouse', label: 'Clubhouse & Lawn' },
            { id: 'games', label: 'Indoor Games' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amenity Cards Grid */}
      <div className="space-y-8">
        {/* Card 1: Swimming Pool */}
        {(activeFilter === 'all' || activeFilter === 'pool') && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[260px] overflow-hidden bg-slate-100">
              <img
                src={poolImg}
                alt="Solitaire Swimming Pool"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                Adult Pool (4.5 ft) + Toddler Splash (1.5 ft)
              </div>
            </div>
            <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                      Facility 01
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">Swimming Pool & Sun Deck</h2>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Open Today
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Daily Timings</span>
                    <span className="font-semibold tabular-nums">06:00 AM – 10:00 AM</span>
                    <span className="block tabular-nums font-semibold">04:00 PM – 09:00 PM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Weekly Maintenance</span>
                    <span className="font-semibold text-amber-700">Closed Every Monday</span>
                    <span className="block text-[11px] text-slate-500">Automated chlorination & vacuuming</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Essential Rules & Guest Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li>Proper nylon or lycra swimwear is strictly compulsory (no cotton clothing allowed).</li>
                    <li>Rinse in poolside outdoor showers before entering the water.</li>
                    <li>Maximum 2 outside guests permitted per resident unit; guest pass registration required.</li>
                    <li>Glassware, eatables, and smoking strictly prohibited in the pool apron perimeter.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => downloadPdf('Solitaire_CHS_Swimming_Pool_Rules_2026')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download Pool Rules PDF</span>
                </button>
                <button
                  onClick={() => handleBook('pool')}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Reserve Pool Slot / Guest Pass
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: Gymnasium */}
        {(activeFilter === 'all' || activeFilter === 'gym') && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[260px] overflow-hidden bg-slate-100">
              <img
                src={gymImg}
                alt="Solitaire Gymnasium"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                Cardio Zone + Free Weights + Yoga Studio
              </div>
            </div>
            <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                      Facility 02
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">Clubhouse Gymnasium & Fitness Studio</h2>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Open 17 Hrs Daily
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Operating Hours</span>
                    <span className="font-semibold tabular-nums">05:00 AM – 10:00 PM</span>
                    <span className="block text-[11px] text-slate-500">Biometric fingerprint access</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Certified Fitness Trainer</span>
                    <span className="font-semibold text-slate-900">Coach Manish (06:00–10:00 AM)</span>
                    <span className="block text-[11px] text-slate-500">Personal guidance & posture check</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Gym Equipment & Etiquette:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li>Clean indoor-only sports shoes (outdoor soles strictly prohibited on rubberized floor).</li>
                    <li>Always carry a clean workout towel to wipe equipment seats after each set.</li>
                    <li>Re-rack all dumbbells and barbell plates to designated trees after finishing your routine.</li>
                    <li>Children under 16 not permitted on mechanized treadmills or cable stacks without supervision.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => downloadPdf('Gym_Equipment_Guidelines_Solitaire')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download Gym Guidelines PDF</span>
                </button>
                <button
                  onClick={() => handleBook('gym')}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Reserve Fitness Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card 3: Clubhouse Banquet & Party Lawn */}
        {(activeFilter === 'all' || activeFilter === 'clubhouse') && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                  Facility 03
                </span>
                <h2 className="text-xl font-bold text-slate-900">Clubhouse Banquet Hall & Landscaped Lawn</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Air-conditioned multi-purpose hall with attached pantry and 3,500 sq.ft open-air party lawn.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 shrink-0">
                Capacity: 120 Guests
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Slot 1 (Day Function)</span>
                <span className="font-semibold tabular-nums">10:00 AM – 03:00 PM</span>
                <span className="block text-[11px] text-slate-500">₹2,500 + ₹5,000 Deposit</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Slot 2 (Evening Party)</span>
                <span className="font-semibold tabular-nums">04:00 PM – 09:30 PM</span>
                <span className="block text-[11px] text-slate-500">₹3,500 + ₹5,000 Deposit</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Decibel Policy</span>
                <span className="font-semibold text-slate-900">Music Cut-Off at 10:00 PM</span>
                <span className="block text-[11px] text-slate-500">Pune Police noise bylaws</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Booking confirmation requires security deposit clearance with the Society Treasurer at least 48 hours prior to the event. Commercial selling or ticketed events strictly prohibited.
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => downloadPdf('Clubhouse_Booking_Rules_Undertaking')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download Banquet Undertaking Form</span>
              </button>
              <button
                onClick={() => handleBook('clubhouse')}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Book Banquet / Party Lawn
              </button>
            </div>
          </div>
        )}

        {/* Card 4: Children's Play Area & Indoor Games */}
        {(activeFilter === 'all' || activeFilter === 'games') && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                  Facility 04
                </span>
                <h2 className="text-xl font-bold text-slate-900">Indoor Sports Arena & Toddlers Play Park</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Two Stiga tournament Table Tennis boards, 3 Carrom arenas, chess corner, and rubber-mulch outdoor play park.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 shrink-0">
                Daily: 06:00 AM – 10:00 PM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="font-semibold block text-slate-900 mb-1">Table Tennis Zone</span>
                <p className="text-[11px] text-slate-500">2 International-size tables. Paddles available from security station with society flat ID.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="font-semibold block text-slate-900 mb-1">Board Games & Chess</span>
                <p className="text-[11px] text-slate-500">Quiet recreational lounge for seniors and youth chess practice clubs.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="font-semibold block text-slate-900 mb-1">Toddler Safe Play Zone</span>
                <p className="text-[11px] text-slate-500">EPDM non-slip soft flooring, safety swings, and gentle slides for ages 2 to 10.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleBook('play_area')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Reserve Table Tennis / Indoor Slot
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Society Booking Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Resident Reservations Ledger</h2>
            <p className="text-xs text-slate-500">Live roster of reserved common facilities and digital gate clearances.</p>
          </div>
          <button
            onClick={() => handleBook('pool')}
            className="px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            + New Reservation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Amenity</th>
                <th className="py-2.5 px-3">Resident & Unit</th>
                <th className="py-2.5 px-3">Date & Slot</th>
                <th className="py-2.5 px-3 text-center">Attendees</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">{b.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{b.amenityName}</td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-900 block">{b.residentName}</span>
                    <span className="text-[11px] text-slate-500">{b.tower} · Flat {b.flatNo}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-900 tabular-nums block">{b.date}</span>
                    <span className="text-[11px] text-slate-500">{b.timeSlot}</span>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums font-semibold text-slate-700">
                    {b.guestsCount}
                  </td>
                  <td className="py-3 px-3">
                    {b.status === 'Confirmed' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        <CheckCircle className="w-3 h-3" />
                        <span>Confirmed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        <XCircle className="w-3 h-3" />
                        <span>Cancelled</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {b.status === 'Confirmed' ? (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-[11px] cursor-pointer"
                      >
                        Cancel Slot
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
