import React from 'react';
import { FileSignature, AlertTriangle, ArrowRight } from 'lucide-react';

interface StudentMenuProps {
  onSelectLeave: () => void;
  onSelectComplain: () => void;
}

const StudentMenu: React.FC<StudentMenuProps> = ({ onSelectLeave, onSelectComplain }) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Header Section */}
      <div className="text-center space-y-1 mb-2">
        <h2 className="text-2xl font-bold text-[#003B73] tracking-tight">
          Pilih Layanan
        </h2>
        <p className="text-slate-500 text-sm">Silakan pilih jenis formulir yang ingin Anda ajukan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card Surat Izin */}
        <button 
          onClick={onSelectLeave}
          className="group relative h-64 text-left p-8 rounded-[2rem] bg-white border border-slate-200 overflow-hidden hover:border-[#003B73] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 p-24 bg-[#003B73]/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-[#003B73]/10 transition-all"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <FileSignature className="w-7 h-7 text-[#003B73]" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#003B73] transition-colors">
              Surat Izin
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-grow">
              Ajukan permohonan ketidakhadiran kuliah karena sakit, acara keluarga, atau dispensasi.
            </p>
            
            <div className="flex items-center text-xs font-bold text-[#003B73] tracking-wider uppercase mt-auto">
              Buka Form <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </button>

        {/* Card Komplain */}
        <button 
          onClick={onSelectComplain}
          className="group relative h-64 text-left p-8 rounded-[2rem] bg-white border border-slate-200 overflow-hidden hover:border-[#FFC700] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 p-24 bg-[#FFC700]/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-[#FFC700]/20 transition-all"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors">
              Lapor / Komplain
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-grow">
              Sampaikan keluhan terkait fasilitas, akademik, atau pelayanan staff.
            </p>
            
            <div className="flex items-center text-xs font-bold text-amber-600 tracking-wider uppercase mt-auto">
              Buka Form <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </button>

      </div>
    </div>
  );
};

export default StudentMenu;
