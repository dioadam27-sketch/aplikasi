import React from 'react';
import { LayoutDashboard, Wallet, LifeBuoy, Users, Archive, FileText, ArrowRight, ExternalLink, Info, ChevronRight, LogOut, BarChart3 } from 'lucide-react';

interface PortalLandingProps {
  onSelectApp: (appId: string) => void;
}

const apps = [
  { id: 'simpdb', name: 'SIMPDB', desc: 'Sistem Informasi Manajemen Penjadwalan Kuliah & PDB', icon: LayoutDashboard, color: 'bg-blue-600', text: 'text-blue-600' },
  { id: 'monev', name: 'Monev', desc: 'Monitoring & Evaluasi Kinerja Akademik (Kuesioner)', icon: BarChart3, color: 'bg-emerald-600', text: 'text-emerald-600' },
  { id: 'asset', name: 'Helpdesk', desc: 'Pusat Bantuan & Layanan Teknis', icon: LifeBuoy, color: 'bg-orange-600', text: 'text-orange-600' },
  { id: 'hr', name: 'Ruang PDB', desc: 'Manajemen Penggunaan Ruang & Fasilitas', icon: Users, color: 'bg-purple-600', text: 'text-purple-600' },
  { id: 'academic', name: 'Repository', desc: 'Administrasi Akademik & Kemahasiswaan', icon: Archive, color: 'bg-pink-600', text: 'text-pink-600' },
  { id: 'office', name: 'E-Office', desc: 'Surat Menyurat Digital & Administrasi', icon: FileText, color: 'bg-slate-600', text: 'text-slate-600' },
];

const PortalLanding: React.FC<PortalLandingProps> = ({ onSelectApp }) => {
  const batikPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM0 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM30 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM0 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row overflow-hidden">
      
      <aside className="group w-full md:w-20 hover:md:w-80 text-white flex flex-col shadow-2xl z-50 shrink-0 md:h-screen transition-all duration-300 ease-in-out overflow-hidden relative bg-gradient-to-b from-[#003B73] via-[#003B73] to-[#FFC107]">
        <div 
            className="absolute inset-0 pointer-events-none opacity-[0.07] z-0 mix-blend-overlay"
            style={{ backgroundImage: batikPattern, backgroundSize: '40px 40px' }}
        ></div>
        
        <div className="relative z-10 h-20 flex items-center px-4 md:px-5 shrink-0 border-b border-white/10 whitespace-nowrap">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-white rounded-xl shadow-lg p-1.5 ring-2 ring-[#FFC107]/50">
                <img src="https://ppk2ipe.unair.ac.id/gambar/UNAIR_BRANDMARK_2025-02.png" alt="UNAIR" className="w-full h-full object-contain" />
            </div>
            <div className="ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 delay-75 flex flex-col justify-center">
                <h1 className="text-lg font-bold tracking-tight leading-none text-white drop-shadow-md">
                    Direktorat Pendidikan
                </h1>
                <span className="text-[10px] text-[#FFC107] uppercase tracking-wider font-bold drop-shadow-sm">PDB APPS</span>
            </div>
        </div>

        <nav className="relative z-10 flex-1 py-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="px-3 space-y-1">
                {apps.map((app) => (
                    <button
                        key={app.id}
                        onClick={() => onSelectApp(app.id)}
                        className="w-full flex items-center px-2 py-3 rounded-xl hover:bg-white/10 transition-colors group/item relative"
                        title={app.name}
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${app.color} text-white shadow-lg shadow-black/20 group-hover/item:scale-110 transition-transform`}>
                            <app.icon size={20} />
                        </div>
                        <div className="ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden text-left flex-1">
                            <span className="block text-sm font-bold text-slate-100">{app.name}</span>
                            <span className="block text-[10px] text-blue-100/70 truncate max-w-[150px]">{app.desc}</span>
                        </div>
                        <ChevronRight size={14} className="text-white/50 opacity-0 md:group-hover:opacity-100 md:-translate-x-2 md:group-hover:translate-x-0 transition-all duration-300" />
                    </button>
                ))}
            </div>
        </nav>

        <div className="relative z-10 p-4 border-t border-[#003B73]/10 shrink-0 whitespace-nowrap bg-white/5 backdrop-blur-sm">
             <div className="flex items-center justify-center md:justify-start px-1">
                <div className="w-10 h-10 flex items-center justify-center shrink-0 text-[#003B73] bg-white/20 rounded-full">
                    <Info size={20} />
                </div>
                <div className="ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 text-xs text-[#003B73] font-bold">
                    <p>&copy; {new Date().getFullYear()} PDB UNAIR</p>
                </div>
             </div>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 flex flex-col h-full min-h-screen overflow-y-auto relative scroll-smooth">
        <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-[#003B73]/10 to-transparent pointer-events-none"></div>

        <div className="flex-1 p-6 md:p-12 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-end gap-4">
                    <div className="text-right hidden md:block">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC107] animate-pulse"></span>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {apps.map((app) => (
                        <button 
                            key={app.id}
                            onClick={() => onSelectApp(app.id)}
                            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left border border-slate-100 flex flex-col h-full relative overflow-hidden"
                        >
                            <div className="absolute top-[-10px] right-[-10px] p-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:rotate-12 duration-500 pointer-events-none">
                                <app.icon size={100} />
                            </div>
                            
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className={`${app.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                    <app.icon size={24} />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#003B73]/10 group-hover:text-[#003B73] transition-colors">
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                            
                            <div className="relative z-10 mt-auto">
                                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-[#003B73] transition-colors leading-tight">{app.name}</h3>
                                <p className="text-slate-500 text-xs mb-4 leading-relaxed line-clamp-2 group-hover:text-slate-600 transition-colors h-8">{app.desc}</p>
                                
                                <div className="w-full py-2.5 rounded-lg bg-slate-50 group-hover:bg-[#003B73] transition-all duration-300 flex items-center justify-center relative overflow-hidden border border-slate-100 group-hover:border-[#003B73]">
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#FFC107] flex items-center gap-1.5 transition-colors uppercase tracking-wide relative z-10">
                                        Buka Aplikasi <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="hidden md:block py-6 px-12 text-center border-t border-[#003B73]/20 bg-gradient-to-r from-[#003B73] via-[#003B73] to-[#FFC107] relative z-10 overflow-hidden">
             <div 
                className="absolute inset-0 pointer-events-none opacity-[0.1] z-0 mix-blend-overlay"
                style={{ backgroundImage: batikPattern, backgroundSize: '30px 30px' }}
             ></div>
             <p className="relative z-10 text-white text-xs font-bold tracking-wide drop-shadow-md opacity-90">
                &copy; {new Date().getFullYear()} Pembelajaran Dasar Bersama (PDB) Universitas Airlangga. All rights reserved.
             </p>
        </div>
      </main>
    </div>
  );
};

export default PortalLanding;
