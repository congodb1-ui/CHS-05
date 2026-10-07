import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { X, Calendar, Clock, Users, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { TowerId } from '../types';

export const BookingModal: React.FC = () => {
  const {
    isBookingModalOpen,
    setIsBookingModalOpen,
    targetAmenity,
    addBooking,
    userName,
    userFlat,
  } = useSociety();

  const [amenity, setAmenity] = useState<'pool' | 'gym' | 'clubhouse' | 'play_area'>(targetAmenity);
  const [residentName, setResidentName] = useState(userName);
  const [flatNo, setFlatNo] = useState(userFlat);
  const [tower, setTower] = useState<TowerId>('Tower A');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('06:00 AM – 08:00 AM');
  const [guestsCount, setGuestsCount] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  if (!isBookingModalOpen) return null;

  const amenityConfig = {
    pool: {
      name: 'Swimming Pool & Kids Pool',
      slots: [
        '06:00 AM – 07:30 AM (Early Laps)',
        '07:30 AM – 09:30 AM (Family & Kids)',
        '04:00 PM – 06:30 PM (Evening Open)',
        '06:30 PM – 09:00 PM (Adults Session)',
      ],
      maxGuests: 4,
      note: 'Proper nylon/lycra swimwear is mandatory. Monday closed for weekly chlorination.',
    },
    gym: {
      name: 'Clubhouse Gymnasium',
      slots: [
        '05:30 AM – 07:00 AM (Early Session)',
        '07:00 AM – 08:30 AM (Morning Peak)',
        '08:30 AM – 10:00 AM (Mid-Morning)',
        '05:00 PM – 07:00 PM (Evening Cardio)',
        '07:00 PM – 09:30 PM (Night Strength)',
      ],
      maxGuests: 2,
      note: 'Clean indoor sports shoes and personal workout towel mandatory.',
    },
    clubhouse: {
      name: 'Clubhouse Banquet & Lawn',
      slots: [
        '10:00 AM – 03:00 PM (Day Function)',
        '04:00 PM – 09:30 PM (Evening Celebration)',
        'Full Day: 10:00 AM – 09:30 PM (Requires MC NOC)',
      ],
      maxGuests: 80,
      note: 'Security deposit of ₹5,000 applicable. Music permitted strictly till 10:00 PM as per municipal bye-laws.',
    },
    play_area: {
      name: 'Indoor Games (Table Tennis / Carrom / Chess)',
      slots: [
        '09:00 AM – 11:00 AM (Morning Slot)',
        '04:00 PM – 06:00 PM (Afternoon Slot)',
        '06:00 PM – 08:00 PM (Evening Slot)',
        '08:00 PM – 10:00 PM (Night Slot)',
      ],
      maxGuests: 6,
      note: 'Equipment return after session is required. Under 10 must be accompanied by guardian.',
    },
  };

  const handleAmenityChange = (newVal: 'pool' | 'gym' | 'clubhouse' | 'play_area') => {
    setAmenity(newVal);
    setTimeSlot(amenityConfig[newVal].slots[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = addBooking({
      amenityId: amenity,
      amenityName: amenityConfig[amenity].name,
      residentName: residentName.trim() || 'Resident',
      flatNo: flatNo.trim() || 'A-402',
      tower,
      date,
      timeSlot,
      guestsCount: Number(guestsCount) || 1,
      purpose: purpose.trim() || 'General amenity use',
    });
    setConfirmedId(newId);
  };

  const handleClose = () => {
    setConfirmedId(null);
    setIsBookingModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-base font-bold">Amenity Slot Reservation</h2>
              <p className="text-xs text-slate-300">Solitaire CHS Resident Facilities</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto border border-teal-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Booking Confirmed
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Reservation #{confirmedId}</h3>
              <p className="text-sm text-slate-600 mt-1">
                Your reservation for <strong>{amenityConfig[amenity].name}</strong> on{' '}
                <span className="tabular-nums font-semibold">{date}</span> ({timeSlot}) is registered in the society ledger.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 text-left space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Resident / Unit:</span>
                <span className="font-semibold">{residentName} ({tower} - {flatNo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attendee Count:</span>
                <span className="font-semibold">{guestsCount} person(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Gate Check:</span>
                <span className="font-semibold text-emerald-700">Digital Pass Synced</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amenity Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Amenity
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['pool', 'gym', 'clubhouse', 'play_area'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleAmenityChange(a)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                      amenity === a
                        ? 'border-teal-600 bg-teal-50 text-teal-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {amenityConfig[a].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Note pill */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>{amenityConfig[amenity].note}</span>
            </div>

            {/* Resident details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tower</label>
                <select
                  value={tower}
                  onChange={(e) => setTower(e.target.value as TowerId)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-teal-600"
                >
                  <option value="Tower A">Tower A</option>
                  <option value="Tower B">Tower B</option>
                  <option value="Tower C">Tower C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Flat Number</label>
                <input
                  type="text"
                  required
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  placeholder="e.g. A-402"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resident Name</label>
                <input
                  type="text"
                  required
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-teal-600"
                />
              </div>
            </div>

            {/* Date & Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Booking Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-teal-600 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-teal-600 tabular-nums"
                >
                  {amenityConfig[amenity].slots.map((s, idx) => (
                    <option key={idx} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guests count & Purpose */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Attendees / Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max={amenityConfig[amenity].maxGuests}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-teal-600 tabular-nums"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Purpose / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Regular lap swimming, guest pass, small dinner"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-teal-600"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Confirm Slot Reservation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
