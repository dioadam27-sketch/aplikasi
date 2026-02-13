import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, LifeBuoy, Users, Archive, FileText, ArrowRight, ExternalLink, Info, ChevronRight, LogOut, BarChart3, Lock, Unlock, X, Check, ToggleLeft, ToggleRight, Settings, AlertTriangle, MonitorPlay, Plus, Trash2, Link, Globe } from 'lucide-react';

interface PortalLandingProps {
  onSelectApp: (appId: string) => void;
}

// Default Apps (Hardcoded logic)
const defaultApps = [
  { id: 'simpdb', name: 'SIMPDB', desc: 'Sistem Informasi Manajemen Penjadwalan Kuliah & PDB', icon: LayoutDashboard, color: 'bg-blue-600', text: 'text-blue-600' },
  { id: 'monev', name: 'Monev', desc: 'Monitoring & Evaluasi Kinerja Akademik', icon: BarChart3, color: 'bg-emerald-600', text: 'text-emerald-600' },
  { id: 'asset', name: 'Helpdesk', desc: 'Pusat Bantuan & Layanan Teknis', icon: LifeBuoy, color: 'bg-orange-600', text: 'text-orange-600' },
  { id: 'hr', name: 'Ruang PDB', desc: 'Manajemen Penggunaan Ruang & Fasilitas', icon: Users, color: 'bg-purple-600', text: 'text-purple-600' },
  { id: 'academic', name: 'Repository', desc: 'Arsip Digital', icon: Archive, color: 'bg-pink-600', text: 'text-pink-600' },
  { id: 'office', name: 'Kuesioner Mahasiswa', desc: 'Surat Menyurat Digital & Administrasi', icon: FileText, color: 'bg-slate-600', text: 'text-slate-600' },
  { id: 'workshop', name: 'Workshop PDB', desc: 'Pelatihan Dosen: Cybercampus & Hebat E-Learning', icon: MonitorPlay, color: 'bg-cyan-600', text: 'text-cyan-600' },
];

const API_URL = 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php';

interface CustomApp {
    id: string;
    name: string;
    description: string;
    url: string;
    color: string;
    isActive: boolean;
}

const PortalLanding: React.FC<PortalLandingProps> = ({ onSelectApp }) => {
  const sidebarBgImage = `url("https://pkkii.pendidikan.unair.ac.id/website/meta.jpg")`;
  const mainBgImage = `url("https://pkkii.pendidikan.unair.ac.id/website/VB%206.png")`;

  // --- STATE ---
  const [disabledApps, setDisabledApps] = useState<string[]>(() => {
    const saved = localStorage.getItem('pdb_portal_disabled_apps');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customApps, setCustomApps] = useState<CustomApp[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Add Custom App Form State
  const [newApp, setNewApp] = useState({ name: '', description: '', url: '', color: 'bg-slate-600' });
  const [isSavingApp, setIsSavingApp] = useState(false);

  // --- FETCH DATA ---
  const fetchCustomApps = async () => {
      try {
          const res = await fetch(`${API_URL}?action=fetch_portal_apps`);
          if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                  setCustomApps(data);
              }
          }
      } catch (e) {
          console.error("Failed to fetch custom apps", e);
      }
  };

  useEffect(() => {
      fetchCustomApps();
  }, []);

  // --- MERGE APPS ---
  const allApps = [
      ...defaultApps,
      ...customApps.map(app => ({
          ...app,
          icon: Globe, // Default icon for external apps
          text: app.color.replace('bg-', 'text-'), // Simple heuristic
          isExternal: true
      }))
  ];

  // --- HANDLERS ---

  const handleAppClick = (app: any) => {
    if (disabledApps.includes(app.id)) {
        alert("Aplikasi sedang dalam perbaikan (Maintenance). Silakan coba lagi nanti.");
        return;
    }
    
    if (app.isExternal) {
        window.open(app.url, '_blank');
    } else {
        onSelectApp(app.id);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '112233') {
        setShowLoginModal(false);
        setShowSettingsModal(true);
        setAdminPassword('');
        setLoginError('');
        fetchCustomApps(); // Refresh when opening admin
    } else {
        setLoginError('Password salah!');
    }
  };

  const toggleAppStatus = (appId: string) => {
    setDisabledApps(prev => {
        let newStatus;
        if (prev.includes(appId)) {
            newStatus = prev.filter(id => id !== appId); // Enable
        } else {
            newStatus = [...prev, appId]; // Disable
        }
        localStorage.setItem('pdb_portal_disabled_apps', JSON.stringify(newStatus));
        return newStatus;
    });
  };

  // --- CUSTOM APP MANAGEMENT ---

  const handleAddApp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newApp.name || !newApp.url) {
          alert("Nama dan URL wajib diisi.");
          return;
      }

      setIsSavingApp(true);
      const payload = {
          id: `ext-${Date.now()}`,
          ...newApp,
          isActive: 1,
          createdAt: Date.now()
      };

      try {
          const res = await fetch(`${API_URL}?action=add&table=portal_apps`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  table: 'portal_apps',
                  action: 'add',
                  data: payload
              })
          });
          
          if (res.ok) {
              setCustomApps([...customApps, payload]);
              setNewApp({ name: '', description: '', url: '', color: 'bg-slate-600' });
          } else {
              alert("Gagal menyimpan aplikasi.");
          }
      } catch (e) {
          console.error(e);
          alert("Gagal menghubungi server.");
      } finally {
          setIsSavingApp(false);
      }
  };

  const handleDeleteApp = async (id: string) => {
      if (!confirm("Hapus aplikasi ini?")) return;
      
      const prevApps = [...customApps];
      setCustomApps(prev => prev.filter(a => a.id !== id));

      try {
          await fetch(`${API_URL}?action=delete&table=portal_apps&id=${id}`, {
              method: 'POST',
              body: JSON.stringify({
                  table: 'portal_apps',
                  action: 'delete',
                  id: id
              })
          });
      } catch (e) {
          setCustomApps(prevApps);
          alert("Gagal menghapus.");
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row overflow-hidden">
      
      {/* --- MODAL LOGIN ADMIN --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                <button 
                    onClick={() => setShowLoginModal(false)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Admin Login</h3>
                    <p className="text-xs text-slate-500">Masuk untuk mengatur status aplikasi.</p>
                </div>
                <form onSubmit={handleAdminLogin}>
                    <div className="mb-4">
                        <input 
                            type="password" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#003B73] focus:ring-2 focus:ring-blue-100 outline-none text-center font-bold text-lg tracking-widest"
                            placeholder="PIN / Password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            autoFocus
                        />
                        {loginError && <p className="text-red-500 text-xs mt-2 text-center font-bold">{loginError}</p>}
                    </div>
                    <button className="w-full py-3 bg-[#003B73] text-white font-bold rounded-xl hover:bg-[#002b55] transition-all shadow-lg">
                        Masuk
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL SETTINGS APLIKASI --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Settings size={20} className="text-[#003B73]" /> Pengaturan Aplikasi
                    </h3>
                    <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    
                    {/* SECTION 1: ADD NEW APP */}
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Plus size={18}/> Tambah Aplikasi Eksternal</h4>
                        <form onSubmit={handleAddApp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder="Nama Aplikasi" 
                                className="px-3 py-2 border rounded-lg text-sm"
                                value={newApp.name}
                                onChange={e => setNewApp({...newApp, name: e.target.value})}
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="URL Link (https://...)" 
                                className="px-3 py-2 border rounded-lg text-sm"
                                value={newApp.url}
                                onChange={e => setNewApp({...newApp, url: e.target.value})}
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="Deskripsi Singkat" 
                                className="px-3 py-2 border rounded-lg text-sm md:col-span-2"
                                value={newApp.description}
                                onChange={e => setNewApp({...newApp, description: e.target.value})}
                            />
                            <div className="flex gap-2 items-center md:col-span-2">
                                <label className="text-xs font-bold text-slate-500">Warna:</label>
                                {['bg-blue-600', 'bg-emerald-600', 'bg-orange-600', 'bg-purple-600', 'bg-pink-600', 'bg-slate-600', 'bg-cyan-600', 'bg-red-600'].map(c => (
                                    <button 
                                        key={c}
                                        type="button"
                                        onClick={() => setNewApp({...newApp, color: c})}
                                        className={`w-6 h-6 rounded-full ${c} ${newApp.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                    />
                                ))}
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSavingApp}
                                className="md:col-span-2 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                            >
                                {isSavingApp ? 'Menyimpan...' : 'Simpan Aplikasi'}
                            </button>
                        </form>
                    </div>

                    {/* SECTION 2: MANAGE APPS */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-4">Daftar Aplikasi</h4>
                        <div className="space-y-2">
                            {allApps.map(app => {
                                const isDisabled = disabledApps.includes(app.id);
                                const isCustom = (app as any).isExternal;
                                return (
                                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${app.color} text-white`}>
                                                <app.icon size={16} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-slate-800">{app.name}</h4>
                                                    {isCustom && <span className="text-[9px] bg-slate-200 px-1.5 rounded text-slate-600 font-medium">Custom</span>}
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDisabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {isDisabled ? 'Non-Aktif' : 'Aktif'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => toggleAppStatus(app.id)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDisabled ? 'bg-slate-300' : 'bg-green-500'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDisabled ? 'translate-x-1' : 'translate-x-6'}`} />
                                            </button>
                                            
                                            {isCustom && (
                                                <button 
                                                    onClick={() => handleDeleteApp(app.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200"
                                                    title="Hapus Aplikasi"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button onClick={() => setShowSettingsModal(false)} className="w-full py-3 bg-[#003B73] text-white font-bold rounded-xl hover:bg-[#002b55] transition-all">
                        Selesai
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="group w-full md:w-20 hover:md:w-80 text-white flex flex-col shadow-2xl z-50 shrink-0 md:h-screen transition-all duration-300 ease-in-out overflow-hidden relative bg-gradient-to-b from-[#003B73] via-[#003B73] to-[#FFC107]">
        <div 
            className="absolute inset-0 pointer-events-none opacity-20 z-0 mix-blend-overlay"
            style={{ 
                backgroundImage: sidebarBgImage, 
                backgroundSize: '60px auto', 
                backgroundRepeat: 'repeat',
                backgroundPosition: '0 0'
            }}
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
                {allApps.map((app) => {
                    const isDisabled = disabledApps.includes(app.id);
                    return (
                        <button
                            key={app.id}
                            onClick={() => handleAppClick(app)}
                            className={`w-full flex items-center px-2 py-3 rounded-xl transition-colors group/item relative ${isDisabled ? 'opacity-50 grayscale hover:bg-white/5 cursor-not-allowed' : 'hover:bg-white/10'}`}
                            title={app.name}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${app.color} text-white shadow-lg shadow-black/20 group-hover/item:scale-110 transition-transform`}>
                                <app.icon size={20} />
                            </div>
                            <div className="ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden text-left flex-1">
                                <span className="block text-sm font-bold text-slate-100">
                                    {app.name} {isDisabled && <span className="text-[9px] bg-red-500 px-1 rounded ml-1">OFF</span>}
                                </span>
                                <span className="block text-[10px] text-blue-100/70 truncate max-w-[150px]">{app.desc}</span>
                            </div>
                            {!isDisabled && <ChevronRight size={14} className="text-white/50 opacity-0 md:group-hover:opacity-100 md:-translate-x-2 md:group-hover:translate-x-0 transition-all duration-300" />}
                            {isDisabled && <Lock size={14} className="text-white/50 opacity-0 md:group-hover:opacity-100 ml-auto mr-2" />}
                        </button>
                    );
                })}
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700/5 via-slate-50 to-amber-500/5 pointer-events-none z-0"></div>
        <div 
            className="absolute inset-0 pointer-events-none z-0 opacity-30"
            style={{
                backgroundImage: mainBgImage,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                maskImage: 'radial-gradient(circle at center, black 30%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 75%)',
            }}
        ></div>

        <div className="flex-1 p-6 md:p-12 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-end gap-4">
                    
                    {/* Admin Trigger Button */}
                    <button 
                        onClick={() => setShowLoginModal(true)}
                        className="bg-white p-2 rounded-full shadow-sm border border-slate-200 text-slate-400 hover:text-[#003B73] hover:border-[#003B73] transition-all"
                        title="Admin Settings"
                    >
                        <Lock size={14} />
                    </button>

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
                    {allApps.map((app) => {
                        const isDisabled = disabledApps.includes(app.id);
                        const isCustom = (app as any).isExternal;
                        
                        return (
                            <button 
                                key={app.id}
                                onClick={() => handleAppClick(app)}
                                className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden text-left group
                                    ${isDisabled ? 'cursor-not-allowed opacity-80' : 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300'}
                                `}
                            >
                                <div className="absolute top-[-10px] right-[-10px] p-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:rotate-12 duration-500 pointer-events-none">
                                    <app.icon size={100} />
                                </div>
                                
                                {isDisabled && (
                                    <div className="absolute inset-0 bg-slate-100/60 z-20 backdrop-blur-[1px] flex items-center justify-center">
                                        <div className="bg-white/90 border border-slate-200 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider transform -rotate-6">
                                            <Lock size={14} /> Maintenance
                                        </div>
                                    </div>
                                )}
                                
                                <div className={`flex items-start justify-between mb-4 relative z-10 ${isDisabled ? 'grayscale opacity-50' : ''}`}>
                                    <div className={`${app.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                        <app.icon size={24} />
                                    </div>
                                    <div className="flex gap-1">
                                        {isCustom && (
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300" title="Link Eksternal">
                                                <Link size={14} />
                                            </div>
                                        )}
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#003B73]/10 group-hover:text-[#003B73] transition-colors">
                                            <ExternalLink size={14} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`relative z-10 mt-auto ${isDisabled ? 'grayscale opacity-50' : ''}`}>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-[#003B73] transition-colors leading-tight">{app.name}</h3>
                                    <p className="text-slate-500 text-xs mb-4 leading-relaxed line-clamp-2 group-hover:text-slate-600 transition-colors h-8">
                                        {app.desc || (isCustom ? 'Aplikasi Eksternal' : '')}
                                    </p>
                                    
                                    <div className="w-full py-2.5 rounded-lg bg-slate-50 group-hover:bg-[#003B73] transition-all duration-300 flex items-center justify-center relative overflow-hidden border border-slate-100 group-hover:border-[#003B73]">
                                        <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#FFC107] flex items-center gap-1.5 transition-colors uppercase tracking-wide relative z-10">
                                            {isCustom ? 'Kunjungi Link' : 'Buka Aplikasi'} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="hidden md:block py-6 px-12 text-center border-t border-[#003B73]/20 bg-gradient-to-r from-[#003B73] via-[#003B73] to-[#FFC107] relative z-10 overflow-hidden">
             <div 
                className="absolute inset-0 pointer-events-none opacity-20 z-0 mix-blend-overlay"
                style={{ 
                    backgroundImage: sidebarBgImage, 
                    backgroundSize: '60px auto', 
                    backgroundRepeat: 'repeat',
                    backgroundPosition: '0 0'
                }}
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