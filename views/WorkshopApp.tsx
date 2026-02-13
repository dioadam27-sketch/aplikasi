import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MonitorPlay, CheckCircle2, User, Building2, Calendar, Loader2, Award, Lock, LogOut, Trash2, Search, FileSpreadsheet, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';

interface WorkshopAppProps {
  onBack: () => void;
}

// Tipe data peserta
interface Participant {
  id: string;
  name: string;
  nip: string;
  faculty: string;
  topic: string;
  sessionDate: string;
  status: 'Terdaftar' | 'Hadir';
}

const API_URL = 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php';

const WorkshopApp: React.FC<WorkshopAppProps> = ({ onBack }) => {
  // --- STATE ---
  const [view, setView] = useState<'register' | 'login' | 'admin'>('register');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data Peserta
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nip: '', 
    faculty: '',
    topic: 'Cybercampus',
    sessionDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ticket logic
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

  // --- API HELPERS ---
  
  const fetchParticipants = async () => {
      setIsLoading(true);
      try {
          const res = await fetch(`${API_URL}?action=fetch_workshop_participants`);
          if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                  setParticipants(data);
              }
          }
      } catch (error) {
          console.error("Failed to fetch participants:", error);
      } finally {
          setIsLoading(false);
      }
  };

  // Load data when entering admin view
  useEffect(() => {
      if (view === 'admin') {
          fetchParticipants();
      }
  }, [view]);

  // --- HANDLERS REGISTER ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newParticipant: Participant = {
        id: `ws-${Date.now()}`, 
        name: formData.name,
        nip: formData.nip,
        faculty: formData.faculty,
        topic: formData.topic,
        sessionDate: formData.sessionDate,
        status: 'Terdaftar'
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add',
                table: 'workshop_participants',
                data: newParticipant
            })
        });

        if (res.ok) {
            setSubmitted(true);
        } else {
            alert("Gagal mendaftar. Silakan coba lagi.");
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("Gagal menghubungi server.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReset = () => {
      setFormData({
        name: '',
        nip: '',
        faculty: '',
        topic: 'Cybercampus',
        sessionDate: ''
      });
      setSubmitted(false);
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
        const canvas = await html2canvas(ticketRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `TIKET-WORKSHOP-${formData.nip}.png`;
        link.click();
    } catch (err) {
        console.error("Download failed", err);
        alert("Gagal mengunduh tiket.");
    } finally {
        setIsDownloading(false);
    }
  };

  // --- HANDLERS ADMIN ---

  const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (adminPassword === '112233') { 
          setView('admin');
          setLoginError('');
          setAdminPassword('');
      } else {
          setLoginError('Password salah!');
      }
  };

  const handleDeleteClick = (id: string) => {
      setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
      if (!deleteModal.id) return;
      const id = deleteModal.id;
      setDeleteModal({ isOpen: false, id: null });

      // Optimistic Update
      const oldParticipants = [...participants];
      setParticipants(prev => prev.filter(p => p.id !== id));

      try {
          const res = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  action: 'delete',
                  table: 'workshop_participants',
                  id: id
              })
          });

          if (!res.ok) throw new Error("API Error");
          
      } catch (error) {
          alert("Gagal menghapus data di server.");
          setParticipants(oldParticipants); // Revert
      }
  };

  const filteredParticipants = participants.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.includes(searchTerm) ||
      (p.faculty && p.faculty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- RENDER VIEWS ---

  // 1. View Sukses Daftar (TIKET)
  if (submitted) {
      return (
        <div className="min-h-screen bg-cyan-50 flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

            <div className="flex flex-col items-center max-w-md w-full relative z-10">
                
                {/* TICKET CARD TO CAPTURE */}
                <div 
                    ref={ticketRef} 
                    className="bg-white rounded-3xl shadow-xl overflow-hidden w-full border border-slate-200"
                >
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <CheckCircle2 size={48} className="mx-auto mb-2 text-cyan-200" />
                            <h2 className="text-xl font-bold uppercase tracking-widest">Bukti Pendaftaran</h2>
                            <p className="text-cyan-100 text-xs mt-1">Workshop & Pelatihan Dosen</p>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Topik Pelatihan</p>
                            <h3 className="text-2xl font-black text-slate-800">{formData.topic}</h3>
                            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold border border-cyan-100">
                                <Calendar size={14} />
                                {new Date(formData.sessionDate).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 my-4 relative">
                            <div className="absolute -left-10 -top-3 w-6 h-6 bg-cyan-50 rounded-full"></div>
                            <div className="absolute -right-10 -top-3 w-6 h-6 bg-cyan-50 rounded-full"></div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Nama Peserta</span>
                                <span className="font-bold text-slate-800 text-right w-1/2">{formData.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">NIP</span>
                                <span className="font-mono font-bold text-slate-800">{formData.nip}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Fakultas / Unit</span>
                                <span className="font-bold text-slate-800 text-right w-1/2">{formData.faculty}</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 mt-4">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Kode Verifikasi</p>
                            <div className="font-mono text-lg font-bold text-slate-600 tracking-widest">
                                {btoa(formData.nip).substring(0, 8).toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-100 p-4 text-center text-[10px] text-slate-400 border-t border-slate-200">
                        Harap simpan bukti ini dan tunjukkan saat registrasi ulang.
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 w-full mt-6">
                    <button 
                        onClick={onBack} 
                        className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all border border-slate-200 text-sm"
                    >
                        Kembali
                    </button>
                    <button 
                        onClick={handleDownloadTicket}
                        disabled={isDownloading}
                        className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-200 hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        Simpan Bukti
                    </button>
                </div>
                
                <button 
                    onClick={handleReset}
                    className="mt-4 text-cyan-600 text-xs font-bold hover:underline"
                >
                    Daftarkan Peserta Lain
                </button>

            </div>
        </div>
      );
  }

  // 2. View Login Admin
  if (view === 'login') {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-zoom-in">
                  <button onClick={() => setView('register')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><ArrowLeft size={20}/></button>
                  <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lock className="text-slate-700" size={24}/>
                      </div>
                      <h2 className="text-xl font-bold text-slate-800">Admin Workshop</h2>
                      <p className="text-slate-500 text-sm">Masuk untuk mengelola data peserta.</p>
                  </div>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div>
                          <input 
                            type="password" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 outline-none text-center font-bold tracking-widest"
                            placeholder="Password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            autoFocus
                          />
                          {loginError && <p className="text-red-500 text-xs mt-2 text-center font-bold">{loginError}</p>}
                      </div>
                      <button className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all">
                          Masuk Dashboard
                      </button>
                  </form>
              </div>
          </div>
      )
  }

  // 3. View Dashboard Admin
  if (view === 'admin') {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
              {/* Header Admin */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                          <MonitorPlay size={20} />
                      </div>
                      <div>
                          <h1 className="font-bold text-slate-800 text-lg leading-tight">Admin Workshop</h1>
                          <p className="text-xs text-slate-500 font-medium">Rekapitulasi Pendaftar</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setView('register')} 
                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-4 py-2 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"
                  >
                      <LogOut size={16} /> Keluar
                  </button>
              </div>

              {/* Content Admin */}
              <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6">
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Peserta</p>
                              <h3 className="text-3xl font-black text-slate-800">{participants.length}</h3>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><User size={24}/></div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cybercampus</p>
                              <h3 className="text-3xl font-black text-cyan-600">{participants.filter(p => p.topic === 'Cybercampus').length}</h3>
                          </div>
                          <div className="bg-cyan-50 p-3 rounded-xl text-cyan-600"><MonitorPlay size={24}/></div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Hebat E-Learning</p>
                              <h3 className="text-3xl font-black text-indigo-600">{participants.filter(p => p.topic === 'Hebat ELearning').length}</h3>
                          </div>
                          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><Award size={24}/></div>
                      </div>
                  </div>

                  {/* Table Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                          <div className="relative w-full md:w-80">
                              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                type="text" 
                                placeholder="Cari nama, NIP, atau fakultas..." 
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                          <div className="flex gap-2">
                              <button onClick={fetchParticipants} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
                                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                              </button>
                              <button className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border border-emerald-200">
                                  <FileSpreadsheet size={16} /> Export Excel
                              </button>
                          </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-100 border-b border-slate-200">
                                  <tr>
                                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-12">No</th>
                                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Peserta & NIP</th>
                                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fakultas / Unit</th>
                                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Topik & Jadwal</th>
                                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {isLoading ? (
                                      <tr>
                                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                              <Loader2 className="animate-spin mx-auto mb-2" size={24}/>
                                              <span className="text-sm">Memuat data...</span>
                                          </td>
                                      </tr>
                                  ) : filteredParticipants.length === 0 ? (
                                      <tr>
                                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada data peserta ditemukan.</td>
                                      </tr>
                                  ) : (
                                      filteredParticipants.map((p, idx) => (
                                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                              <td className="px-6 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                                              <td className="px-6 py-4">
                                                  <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                                  <div className="text-xs text-slate-500 font-mono mt-0.5">{p.nip}</div>
                                              </td>
                                              <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                  {p.faculty || '-'}
                                              </td>
                                              <td className="px-6 py-4">
                                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${p.topic === 'Cybercampus' ? 'bg-cyan-100 text-cyan-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                      {p.topic}
                                                  </span>
                                                  <div className="text-xs text-slate-500 flex items-center gap-1">
                                                      <Calendar size={12} /> {p.sessionDate ? new Date(p.sessionDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}
                                                  </div>
                                              </td>
                                              <td className="px-6 py-4 text-center">
                                                  <button 
                                                    onClick={() => handleDeleteClick(p.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Hapus Peserta"
                                                  >
                                                      <Trash2 size={16} />
                                                  </button>
                                              </td>
                                          </tr>
                                      ))
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // 4. View Register (Default)
  return (
    <div className="min-h-screen bg-cyan-50 flex flex-col items-center justify-center p-4 relative font-sans text-slate-800">
      
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-down">
                <div className="text-center">
                    <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Peserta?</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setDeleteModal({isOpen: false, id: null})}
                            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-cyan-200/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-[80px]"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-fade-in-up">
        
        {/* Left Side: Info */}
        <div className="md:w-5/12 bg-gradient-to-br from-cyan-600 to-blue-700 p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10">
                <button 
                    onClick={onBack} 
                    className="mb-8 flex items-center gap-2 text-cyan-100 hover:text-white transition-colors text-sm font-bold"
                >
                    <ArrowLeft size={16} /> Kembali
                </button>
                
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 mb-6 shadow-lg">
                    <MonitorPlay size={32} className="text-cyan-100" />
                </div>
                
                <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/20">
                    Khusus Tenaga Pengajar
                </div>

                <h1 className="text-3xl font-extrabold mb-4 leading-tight">
                    Workshop &<br/>Pelatihan Dosen
                </h1>
                <p className="text-cyan-100 text-sm leading-relaxed opacity-90">
                    Tingkatkan kompetensi pengajaran digital melalui pelatihan teknis Cybercampus v2 dan Manajemen Kelas LMS Hebat.
                </p>
            </div>

            <div className="relative z-10 mt-12 space-y-4">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shadow-md">
                        <span className="font-bold text-xs">01</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Cybercampus v2</h4>
                        <p className="text-[10px] text-cyan-100">Input Nilai & Presensi</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                        <span className="font-bold text-xs">02</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Hebat E-Learning</h4>
                        <p className="text-[10px] text-cyan-100">Manajemen Materi & Kuis</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-7/12 p-8 md:p-12 bg-white relative">
            {/* Admin Login Trigger */}
            <button 
                onClick={() => setView('login')}
                className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors p-2"
                title="Login Admin"
            >
                <Lock size={16} />
            </button>

            <h2 className="text-2xl font-bold text-slate-800 mb-6">Formulir Pendaftaran</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Nama Lengkap & Gelar</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                        <input 
                            required
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                            placeholder="Contoh: Dr. Budi Santoso, M.Si."
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">NIP</label>
                        <div className="relative">
                            <Award className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                            <input 
                                required
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                placeholder="198xxxxxxx"
                                value={formData.nip}
                                onChange={(e) => setFormData({...formData, nip: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Fakultas / Unit</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                            <input 
                                required
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                placeholder="Contoh: FIB / PDB"
                                value={formData.faculty}
                                onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2">
                    <label className="text-sm font-bold text-slate-800 mb-3 block">Pilih Topik Pelatihan</label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.topic === 'Cybercampus' ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 hover:border-cyan-200 text-slate-500'}`}>
                            <input 
                                type="radio" 
                                name="topic" 
                                value="Cybercampus" 
                                checked={formData.topic === 'Cybercampus'} 
                                onChange={() => setFormData({...formData, topic: 'Cybercampus'})}
                                className="hidden" 
                            />
                            <span className="font-bold text-sm">Cybercampus</span>
                        </label>
                        <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.topic === 'Hebat ELearning' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 hover:border-blue-200 text-slate-500'}`}>
                            <input 
                                type="radio" 
                                name="topic" 
                                value="Hebat ELearning" 
                                checked={formData.topic === 'Hebat ELearning'} 
                                onChange={() => setFormData({...formData, topic: 'Hebat ELearning'})}
                                className="hidden" 
                            />
                            <span className="font-bold text-sm">Hebat E-Learning</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Pilih Tanggal Sesi</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                        <input 
                            required
                            type="date" 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-medium text-slate-800 cursor-pointer"
                            value={formData.sessionDate}
                            onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Memproses...
                        </>
                    ) : (
                        "Daftar Sekarang"
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default WorkshopApp;