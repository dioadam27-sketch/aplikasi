import React, { useState } from 'react';
import { Settings, Save, Database, Link, AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  sheetUrl: string;
  onSaveUrl: (url: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ sheetUrl, onSaveUrl }) => {
  const [url, setUrl] = useState(sheetUrl);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUrl(url);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetApp = () => {
      if (confirm("Apakah Anda yakin ingin mereset aplikasi? Cache lokal akan dihapus dan halaman akan dimuat ulang. Data di server tidak akan hilang.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h2>
        <p className="text-slate-500">Konfigurasi koneksi database dan API Endpoint.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-6">
           <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
             <Database size={32} />
           </div>
           <div>
             <h3 className="font-bold text-slate-800 text-lg">Koneksi API Database</h3>
             <p className="text-slate-500 text-sm">Aplikasi ini terhubung ke REST API (PHP) yang mengelola database MySQL.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Link size={16} /> URL API Endpoint
            </label>
            <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-700"
                  placeholder="https://domain.com/path/to/api.php"
                />
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl px-4 flex items-center justify-center transition-colors"
                    title="Buka URL di Tab Baru untuk Test"
                >
                    <ExternalLink size={20} />
                </a>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Pastikan file <code>api.php</code> telah di-upload ke server hosting dan database MySQL telah dikonfigurasi.
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
             <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
             <div className="text-xs text-amber-800 leading-relaxed">
               <strong>Perhatian:</strong> Mengubah URL ini akan memutuskan koneksi ke database saat ini. Pastikan endpoint baru merespons format JSON standar SIMPDB.
             </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 mt-4">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <Save size={18} /> Simpan Pengaturan
            </button>
            
            <button
              type="button"
              onClick={handleResetApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ml-auto"
            >
              <RefreshCw size={18} /> Reset Aplikasi
            </button>

            {isSaved && (
              <span className="text-emerald-600 font-bold text-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle size={18} /> Tersimpan!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsView;