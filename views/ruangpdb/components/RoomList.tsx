import React, { useState, useMemo } from 'react';
import { Room, Booking } from '../../../types_pdb';
import { TIME_SLOTS } from '../../../constants_pdb';
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface RoomListProps {
  rooms: Room[];
  bookings: Booking[];
  onSelectSlot: (room: Room, date: string, timeSlot: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, bookings, onSelectSlot }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateToString = (date: Date) => date.toISOString().split('T')[0];
  const selectedDateStr = dateToString(currentDate);

  const handleDateChange = (days: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const isSlotBooked = (roomId: string, date: string, timeSlot: string): boolean => {
    return bookings.some(b => b.room.id === roomId && b.date === date && b.timeSlot === timeSlot);
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const isPastDate = currentDate < today;

  return (
    <div className="space-y-8">
      {/* Date Navigator */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-slate-700">Pilih Tanggal & Waktu</h2>
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <button onClick={() => handleDateChange(-1)} className="p-2 rounded-lg hover:bg-slate-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <input
            type="date"
            value={selectedDateStr}
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button onClick={() => handleDateChange(1)} className="p-2 rounded-lg hover:bg-slate-200 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      {isPastDate && (
         <div className="bg-amber-50 text-amber-700 text-sm font-medium p-3 rounded-xl border border-amber-200 text-center">
            Anda melihat jadwal untuk tanggal yang sudah lampau.
         </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">{room.name}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5"><Users size={12}/> {room.capacity} Orang</span>
                <span className="flex items-center gap-1.5"><MapPin size={12}/> {room.location}</span>
              </div>
            </div>
            <div className="p-6 flex-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Slot Waktu Tersedia</h4>
              <div className="grid grid-cols-2 gap-3">
                {TIME_SLOTS.map(slot => {
                  const isBooked = isSlotBooked(room.id, selectedDateStr, slot);
                  const isSelectable = !isBooked && !isPastDate;
                  
                  return (
                    <button
                      key={slot}
                      onClick={() => isSelectable && onSelectSlot(room, selectedDateStr, slot)}
                      disabled={!isSelectable}
                      className={`p-3 rounded-lg text-sm font-bold border-2 text-center transition-all ${
                        isBooked 
                          ? 'bg-red-50 text-red-400 border-red-100 cursor-not-allowed line-through' 
                          : isPastDate
                          ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-purple-700 border-slate-200 hover:border-purple-500 hover:bg-purple-50 hover:scale-105 active:scale-100'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;
