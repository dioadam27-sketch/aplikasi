import React, { useState, useEffect } from 'react';
import Navbar from './helpdesk/components/Navbar';
import LeaveForm from './helpdesk/components/LeaveForm';
import ComplainForm from './helpdesk/components/ComplainForm';
import History from './helpdesk/components/History';
import AdminDashboard from './helpdesk/components/AdminDashboard';
import StudentMenu from './helpdesk/components/StudentMenu';
import { LeaveRequest, RequestStatus, ComplaintRequest } from './helpdesk/types';
import { api } from './helpdesk/services/api'; 
import { UserCircle2, ShieldCheck, ArrowRight, Lock, KeyRound, X, Loader2, Unplug, CloudCog, GraduationCap, CheckCircle2, ArrowLeft } from 'lucide-react';

type UserRole = 'student' | 'admin' | null;
type View = 'menu' | 'form' | 'history' | 'admin' | 'complain';

// URL Logo Strategi
const LOGO_MAIN = "https://ppk2ipe.unair.ac.id/gambar/UNAIR_BRANDMARK_2025-02.png";
const LOGO_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/e/e6/Logo_Universitas_Airlangga.png";

const AssetApp = ({ onBack }: { onBack: () => void }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<View>('menu');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRequest[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [logoSrc, setLogoSrc] = useState(LOGO_MAIN);
  const [logoError, setLogoError] = useState(false);

  const handleLogoLoadError = () => {
    if (logoSrc === LOGO_MAIN) {
      setLogoSrc(LOGO_FALLBACK);
    } else {
      setLogoError(true);
    }
  };

  useEffect(() => {
    if ((userRole === 'student' && currentView === 'history') || userRole === 'admin') {
      loadDataSmart();
    }
  }, [userRole, currentView]);

  const loadDataSmart = async () => {
    const cachedData = api.getLocalData();
    const hasCache = cachedData.requests.length > 0 || cachedData.complaints.length > 0;

    if (hasCache) {
      setRequests(cachedData.requests);
      setComplaints(cachedData.complaints);
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { requests: reqData, complaints: compData } = await api.fetchAll();
      setRequests(reqData);
      setComplaints(compData);
    } catch (e) {
      console.error("Background sync error", e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleFormSubmit = async (newRequest: LeaveRequest) => {
    setIsLoading(true);
    const success = await api.createRequest(newRequest);
    setIsLoading(false); 

    if (success) {
      await loadDataSmart(); 
      setCurrentView('history'); 
      setShowSuccessModal(true); 
    } else {
      alert("Koneksi ke server bermasalah, namun data tersimpan di browser.");
      await loadDataSmart();
      setCurrentView('history');
    }
  };

  const handleComplaintSubmit = async (complaint: ComplaintRequest) => {
    setIsLoading(true);
    const success = await api.createComplaint(complaint);
    if (success) {
        alert("Laporan komplain berhasil dikirim. Terima kasih atas masukan Anda.");
        await loadDataSmart(); 
        setCurrentView('history'); 
    } else {
        alert("Koneksi bermasalah. Laporan disimpan secara offline.");
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: RequestStatus, reason?: string) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus, rejectionReason: reason } : req
    ));

    const success = await api.updateStatus(id, newStatus, reason);
    if (!success) {
      console.warn("Update status offline");
    }
  };

  const handleComplaintUpdate = async (id: string, note: string) => {
    setComplaints(prev => prev.map(comp => 
      comp.id === id ? { ...comp, adminNote: note } : comp
    ));

    const success = await api.updateComplaint(id, note);
    if (!success) {
       console.warn("Update complaint offline");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id)); 
    await api.deleteRequest(id); 
  };

  const handleDeleteComplaint = async (id: string) => {
    setComplaints(prev => prev.filter(req => req.id !== id)); 
    await api.deleteComplaint(id); 
  };

  const handleRoleSelect = (role: 'student' | 'admin') => {
    if (role === 'student') {
      setUserRole('student');
      setCurrentView('menu');
    } else {
      setShowAdminAuth(true);
      setAuthError('');
      setAdminPassword('');
    }
  };

  const submitAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '112233') {
      setUserRole('admin');
      setCurrentView('admin');
      setShowAdminAuth(false);
    } else {
      setAuthError('Password salah. Akses ditolak.');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentView('menu');
    setRequests([]);
    setComplaints([]);
  };

  if (!userRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#F8FAFC]">
        {/* UNAIR THEME BACKGROUND BLOBS */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#003B73]/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FFC700]/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"></div>
        
        {/* Back Button */}
        <button 
            onClick={onBack} 
            className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-gray-600 font-bold text-xs hover:bg-white hover:text-blue-600 transition-all shadow-sm group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Portal</span>
        </button>

        <div className="relative z-10 max-w-2xl w-full">
          <div className="text-center mb-10">
            {/* LOGO UNAIR */}
            <div className="flex justify-center mb-6">
              {logoError ? (
                <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-xl">
                   <GraduationCap className="w-12 h-12 text-[#003B73]" />
                </div>
              ) : (
                <img 
                  src={logoSrc}
                  alt="Logo Universitas Airlangga" 
                  className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md hover:scale-105 transition-transform duration-500"
                  onError={handleLogoLoadError}
                />
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-slate-800">
              Helpdesk <span className="text-[#003B73]">PDB</span>
            </h1>
            
            <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <p className="text-[#003B73] text-base font-bold mb-2 uppercase tracking-wide">
                Portal Pelayanan Mahasiswa
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Silakan masuk untuk mengajukan <span className="text-[#003B73] font-bold">Izin Kuliah</span> atau menyampaikan <span className="text-amber-600 font-bold">Layanan Komplain</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => handleRoleSelect('student')}
              className="group relative bg-white border border-slate-200 rounded-3xl p-8 text-left hover:border-[#003B73] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 p-32 bg-[#003B73]/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#003B73]/10 transition-all"></div>
              <div className="relative z-10 flex flex-col flex-grow">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mb-6 group-hover:scale-110 transition-transform">
                  <UserCircle2 className="w-8 h-8 text-[#003B73]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Mahasiswa</h3>
                <p className="text-slate-500 text-sm mb-6 flex-grow">
                  Akses formulir perizinan dan layanan pengaduan masalah (Helpdesk).
                </p>
                <div className="flex items-center text-[#003B73] text-sm font-bold mt-auto">
                  Masuk Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button 
              onClick={() => handleRoleSelect('admin')}
              className="group relative bg-white border border-slate-200 rounded-3xl p-8 text-left hover:border-[#FFC700] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 p-32 bg-[#FFC700]/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#FFC700]/10 transition-all"></div>
              <div className="relative z-10 flex flex-col flex-grow">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8 text-[#b38b00]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Admin</h3>
                <p className="text-slate-500 text-sm mb-6 flex-grow">
                  Dashboard validasi surat izin dan tinjauan laporan komplain.
                </p>
                <div className="flex items-center text-amber-600 text-sm font-bold mt-auto">
                  Login Admin <Lock className="w-3 h-3 ml-2 inline" />
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-6 text-slate-400 text-xs">
          &copy; {new Date().getFullYear()} Universitas Airlangga - Helpdesk PDB
        </div>

        {/* Admin Login Modal */}
        {showAdminAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAdminAuth(false)}></div>
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <button 
                onClick={() => setShowAdminAuth(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#FFC700]/10 flex items-center justify-center mb-4 border border-[#FFC700]/30">
                  <KeyRound className="w-6 h-6 text-[#b38b00]" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Admin Access</h3>
                <p className="text-slate-500 text-sm">Masukkan password untuk melanjutkan</p>
              </div>

              <form onSubmit={submitAdminAuth} className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:border-[#FFC700] focus:ring-1 focus:ring-[#FFC700] outline-none transition-all placeholder:text-slate-400"
                    placeholder="Password"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-rose-500 text-xs font-bold px-1">{authError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#FFC700] hover:bg-[#e6b300] text-[#003B73] font-bold rounded-xl transition-all shadow-md"
                >
                  Masuk Dashboard
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 text-slate-800 bg-[#FDFBF7]">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        userRole={userRole}
        onLogout={handleLogout}
        onBackToPortal={onBack}
      />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in relative">
        
        {/* Syncing Indicator */}
        {isSyncing && (
          <div className="absolute top-0 right-8 -mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono animate-pulse bg-white/80 px-2 py-1 rounded-full border border-slate-200 shadow-sm">
             <CloudCog className="w-3 h-3" />
             SYNCING...
          </div>
        )}

        {!api.isConfigured() && userRole === 'admin' && (
           <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <Unplug className="w-4 h-4" />
              <span>
                Backend belum terhubung. Harap isi <code>API_URL</code> di file <code>services/api.ts</code>.
              </span>
           </div>
        )}

        {isLoading ? (
           <div className="flex flex-col items-center justify-center min-h-[70vh] relative animate-fade-in">
             <div className="relative mb-8 p-6 bg-white rounded-full border border-slate-200 shadow-lg flex items-center justify-center">
               {logoError ? (
                 <GraduationCap className="w-32 h-32 text-[#003B73] opacity-80" />
               ) : (
                 <img 
                    src={logoSrc} 
                    alt="Universitas Airlangga" 
                    className="w-32 h-32 object-contain"
                    onError={handleLogoLoadError}
                 />
               )}
             </div>

             <div className="flex flex-col items-center space-y-3 z-10">
               <Loader2 className="w-6 h-6 text-[#003B73] animate-spin" />
               <div className="flex flex-col items-center">
                 <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Memuat Data</p>
                 <p className="text-slate-400 text-[10px]">Universitas Airlangga</p>
               </div>
             </div>
           </div>
        ) : (
          <>
            {userRole === 'student' && currentView === 'menu' && (
              <StudentMenu 
                onSelectLeave={() => setCurrentView('form')}
                onSelectComplain={() => setCurrentView('complain')}
              />
            )}

            {userRole === 'student' && currentView === 'form' && (
              <div className="space-y-6">
                <LeaveForm onSubmit={handleFormSubmit} />
              </div>
            )}
            
            {userRole === 'student' && currentView === 'history' && (
              <History 
                requests={requests} 
                complaints={complaints} 
              />
            )}

            {userRole === 'student' && currentView === 'complain' && (
              <ComplainForm onSubmit={handleComplaintSubmit} />
            )}

            {userRole === 'admin' && (
              <AdminDashboard 
                requests={requests} 
                complaints={complaints}
                onUpdateStatus={handleStatusUpdate}
                onUpdateComplaint={handleComplaintUpdate}
                onRefresh={loadDataSmart}
                onDeleteRequest={handleDeleteRequest}
                onDeleteComplaint={handleDeleteComplaint}
              />
            )}
          </>
        )}

        {/* Success Modal Notification */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-emerald-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative">
               
               <div className="relative z-10">
                 <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                   <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                 </div>
                 
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Permohonan Terkirim!</h3>
                 <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                   Data Anda berhasil dikirim dan sedang <strong>menunggu persetujuan admin</strong>.
                 </p>
                 
                 <button
                   onClick={() => setShowSuccessModal(false)}
                   className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md text-sm tracking-wide"
                 >
                   MENGERTI
                 </button>
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AssetApp;