import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

const OfficeApp = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-lg">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
            <FileText size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">E-Office</h1>
        <p className="text-slate-600 mb-8">Aplikasi ini belum diintegrasikan. Silakan paste kode Anda di sini.</p>
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-300 font-bold hover:bg-slate-900 transition-all mx-auto">
            <ArrowLeft size={20} /> Kembali ke Portal
        </button>
      </div>
    </div>
  );
};
export default OfficeApp;