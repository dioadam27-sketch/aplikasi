import React from 'react';
import { GraduationCap, LogOut, LayoutDashboard, PlusCircle, History, AlertTriangle, LayoutGrid, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  currentView: 'menu' | 'form' | 'history' | 'admin' | 'complain';
  setCurrentView: (view: any) => void;
  userRole: 'student' | 'admin' | null;
  onLogout: () => void;
  onBackToPortal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, userRole, onLogout, onBackToPortal }) => {
  if (!userRole) return null;

  return (
    <div className="bg-[#003B73] shadow-md mb-6 sticky top-0 z-50">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => userRole === 'student' && setCurrentView('menu')}>
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
             <GraduationCap className="w-5 h-5 text-[#FFC700]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold text-white tracking-widest uppercase font-mono leading-tight">
              HELPDESK <span className="text-[#FFC700]">PDB</span>
            </h1>
            <span className="text-[9px] text-blue-200 font-semibold tracking-wider">UNIVERSITAS AIRLANGGA</span>
          </div>
        </div>

        {/* MENU */}
        <div className="flex gap-1 bg-[#002d5a] p-1 rounded-lg border border-[#004b91]">
           {userRole === 'student' && (
             <>
               <NavBtn active={currentView === 'menu'} onClick={() => setCurrentView('menu')} icon={LayoutGrid}>MENU</NavBtn>
               <NavBtn active={currentView === 'form'} onClick={() => setCurrentView('form')} icon={PlusCircle}>SURAT</NavBtn>
               <NavBtn active={currentView === 'history'} onClick={() => setCurrentView('history')} icon={History}>RIWAYAT</NavBtn>
               <NavBtn active={currentView === 'complain'} onClick={() => setCurrentView('complain')} icon={AlertTriangle}>KOMPLAIN</NavBtn>
             </>
           )}
           {userRole === 'admin' && (
             <div className="px-4 py-2 text-xs font-bold text-[#FFC700] flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> DASHBOARD ADMIN
             </div>
           )}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
           <button onClick={onLogout} className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Keluar">
              <LogOut className="w-5 h-5" />
           </button>
           <button onClick={onBackToPortal} className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Ke Portal Utama">
              <ArrowLeft className="w-5 h-5" />
           </button>
        </div>

      </nav>
    </div>
  );
};

const NavBtn = ({ active, onClick, children, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded flex items-center gap-2 transition-all ${active ? 'bg-[#FFC700] text-[#003B73] shadow-sm' : 'text-blue-200 hover:text-white hover:bg-white/5'}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {children}
  </button>
);

export default Navbar;
