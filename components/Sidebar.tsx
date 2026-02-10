import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Users, 
  Building2, 
  Layers, 
  Activity, 
  CheckSquare, 
  DollarSign, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  Key, 
  ArrowLeft, 
  Menu, 
  X,
  Settings
} from 'lucide-react';
import { UserRole, ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  userRole: UserRole;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
  onSync: () => void;
  onChangePassword: () => void;
  onBackToPortal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, userRole, onChangeView, isOpen, toggleSidebar, 
  onLogout, onSync, onChangePassword, onBackToPortal 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'all' },
    { id: 'schedule', label: 'Jadwal Kuliah', icon: Calendar, role: 'all' },
    { id: 'courses', label: 'Mata Kuliah', icon: BookOpen, role: 'all' },
    { id: 'lecturers', label: 'Data Dosen', icon: Users, role: 'all' },
    { id: 'rooms', label: 'Data Ruangan', icon: Building2, role: 'all' },
    { id: 'classes', label: 'Data Kelas', icon: Layers, role: 'all' },
    { id: 'monitoring', label: 'Monitoring', icon: Activity, role: 'all' },
    { id: 'attendance', label: 'Presensi Dosen', icon: CheckSquare, role: 'all' },
    { id: 'honor', label: 'Honor Mengajar', icon: DollarSign, role: 'admin' },
    { id: 'portal', label: 'Portal Dosen', icon: ShieldCheck, role: 'all' },
    { id: 'lecturer_monitoring', label: 'Monitoring Saya', icon: Activity, role: 'lecturer' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, role: 'admin' },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (userRole === 'admin') return item.role !== 'lecturer';
    if (userRole === 'lecturer') return ['portal', 'lecturer_monitoring'].includes(item.id);
    return false;
  });

  // Batik Kawung Pattern (SVG Data URI) - Subtle White
  const batikPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM0 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM30 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM0 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container - THEME UPDATE: Blue-Yellow Gradient + Batik */}
      <div className={`
        fixed top-0 left-0 h-full w-64 text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        bg-gradient-to-b from-[#003B73] via-[#003B73] to-[#FFC107]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        
        {/* Batik Overlay (Absolute Positioned) */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-[0.07] z-0 mix-blend-overlay"
            style={{ backgroundImage: batikPattern, backgroundSize: '40px 40px' }}
        ></div>

        {/* Content Wrapper (Relative to sit above batik) */}
        <div className="relative z-10 flex flex-col h-full">
            
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5 ring-2 ring-[#FFC107]/50">
                   <img src="https://ppk2ipe.unair.ac.id/gambar/UNAIR_BRANDMARK_2025-02.png" alt="UNAIR" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight tracking-tight drop-shadow-md">SIMPDB</h1>
                  <p className="text-[10px] text-[#FFC107] font-bold uppercase tracking-wider drop-shadow-sm">Direktorat Pendidikan</p>
                </div>
              </div>
              <button onClick={toggleSidebar} className="md:hidden text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Menu Items - Removed "Main Menu" label */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/20">
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onChangeView(item.id as ViewState); if(window.innerWidth < 768) toggleSidebar(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    currentView === item.id 
                      ? 'bg-white text-[#003B73] shadow-lg font-bold' 
                      : 'text-blue-50 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <item.icon size={20} className={`relative z-10 transition-transform duration-200 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="relative z-10 text-sm">{item.label}</span>
                  {currentView === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFC107]"></div>}
                </button>
              ))}
            </div>

            {/* Footer Actions - Adjusted for Gradient (Bottom is Yellowish) */}
            <div className="p-4 border-t border-[#003B73]/10 bg-white/10 backdrop-blur-sm space-y-2 shrink-0">
              {onSync && (
                 <button 
                    onClick={onSync}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#003B73] bg-white/40 hover:bg-white hover:text-[#003B73] transition-colors text-sm font-bold shadow-sm"
                 >
                    <RefreshCw size={18} />
                    <span>Sync Data</span>
                 </button>
              )}
              
              <button 
                 onClick={onChangePassword}
                 className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#003B73] hover:bg-white/50 transition-colors text-sm font-bold"
              >
                 <Key size={18} />
                 <span>Ganti Password</span>
              </button>

              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-700 hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
              >
                <LogOut size={18} />
                <span>Keluar</span>
              </button>

              <button 
                onClick={onBackToPortal}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#003B73] border-2 border-[#003B73]/20 hover:border-[#003B73] hover:bg-[#003B73] hover:text-[#FFC107] transition-all text-sm font-bold mt-2"
              >
                <ArrowLeft size={18} />
                <span>Ke Portal</span>
              </button>
            </div>
        </div>
      </div>
    </>
  );
};