import React from 'react';
import { ArrowLeft, Construction, Clock, Hammer } from 'lucide-react';

const OfficeApp = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl border border-white/50 max-w-lg w-full relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-slate-100 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-full h-full bg-slate-50 rounded-full flex items-center justify-center shadow-inner border border-slate-200">
                <Construction size={48} className="text-slate-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 p-2 rounded-full border-4 border-white">
                <Hammer size={16} className="text-white" />
            </div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 mb-3">
          Dalam Pengembangan
        </h1>
        
        <div className="w-16 h-1 bg-amber-400 mx-auto mb-6 rounded-full"></div>

        <p className="text-slate-500 mb-8 leading-relaxed text-sm md:text-base">
          Modul <span className="font-bold text-slate-700">E-Office</span> sedang kami bangun untuk meningkatkan efisiensi administrasi surat-menyurat digital Anda.
        </p>

        <div className="flex flex-col gap-3">
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-100">
                <Clock size={16} />
                <span>Status: Coming Soon</span>
            </div>

            <button 
                onClick={onBack} 
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 font-bold text-sm"
            >
                <ArrowLeft size={18} /> Kembali ke Portal
            </button>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-xs font-medium relative z-10">
        &copy; {new Date().getFullYear()} Direktorat Pendidikan Universitas Airlangga
      </p>
    </div>
  );
};
export default OfficeApp;