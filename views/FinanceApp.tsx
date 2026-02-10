import React from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';

const FinanceApp = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-lg">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <Wallet size={40} />
        </div>
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">Sistem Keuangan</h1>
        <p className="text-emerald-600 mb-8">Aplikasi ini belum diintegrasikan. Silakan paste kode Anda di sini.</p>
        <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 font-bold hover:bg-emerald-700 transition-all mx-auto">
            <ArrowLeft size={20} /> Kembali ke Portal
        </button>
      </div>
    </div>
  );
};
export default FinanceApp;