import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Save, BarChart3, CheckCircle, Lock, Calendar, Users, List, PieChart, AlignLeft, CheckSquare, Trash2, ArrowRight, User, LogOut, X, AlertCircle, Power, Loader2, Building2, GripVertical, Circle, Square, ChevronUp } from 'lucide-react';
import { Lecturer } from '../types';

interface MonevAppProps {
  onBack: () => void;
}

// --- TYPES ---
interface Question {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'likert' | 'checkbox';
  options?: string[]; // For Choice/Checkbox
  config?: {
    chartType?: 'pie' | 'bar' | 'list';
    minLabel?: string; // For Likert (1)
    maxLabel?: string; // For Likert (5)
  };
}

interface Survey {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hasResponded?: boolean;
}

// --- API URL ---
const API_URL = 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php';

// --- CHART COLORS ---
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const MonevApp: React.FC<MonevAppProps> = ({ onBack }) => {
  const [view, setView] = useState<'login' | 'dashboard_lecturer' | 'fill_survey' | 'dashboard_admin' | 'create_survey' | 'view_results'>('login');
  
  // Auth State
  const [loginRole, setLoginRole] = useState<'lecturer' | 'admin'>('lecturer');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<Lecturer | null>(null);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]); // For Admin Whitelist

  // Verification State (New)
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{name: string, faculty: string} | null>(null);

  // Data State
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [surveyResults, setSurveyResults] = useState<any>(null);

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Creator State
  const [newSurvey, setNewSurvey] = useState<Partial<Survey>>({ title: '', description: '', startDate: '', endDate: '' });
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);
  const [selectedNips, setSelectedNips] = useState<Set<string>>(new Set());

  // Delete State
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);

  // Detail View State
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());

  // --- FETCH HELPERS ---
  const fetchLecturers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=fetch_all_simpdb`);
      const data = await res.json();
      const list = Array.isArray(data.lecturers) ? data.lecturers : [];
      setLecturers(list);
      return list; // Return for chaining
    } catch (e) { 
        console.error("Error fetching lecturers:", e);
        setLecturers([]);
        return [];
    }
  };

  const fetchSurveys = async (adminMode = false) => {
    try {
      // Pastikan NIP bersih dari spasi untuk query yang akurat
      const cleanNip = nip.trim(); 
      // TARGET: LECTURER
      const res = await fetch(`${API_URL}?action=monev_surveys&target=lecturer&nip=${cleanNip}&admin=${adminMode}`);
      const data = await res.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
          setSurveys(data);
      } else {
          console.error("Invalid surveys format:", data);
          setSurveys([]);
      }
    } catch (e) { 
        console.error("Error fetching surveys:", e);
        setSurveys([]);
    }
  };

  const fetchQuestions = async (surveyId: string) => {
    try {
      const res = await fetch(`${API_URL}?action=monev_questions&surveyId=${surveyId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
          setQuestions(data);
      } else {
          setQuestions([]);
      }
    } catch (e) { 
        console.error(e);
        setQuestions([]); 
    }
  };

  const fetchResults = async (surveyId: string) => {
    try {
      const res = await fetch(`${API_URL}?action=monev_results&surveyId=${surveyId}`);
      const data = await res.json();
      if (data && data.results) {
          setSurveyResults(data);
      } else {
          // Handle error response or empty data safely
          setSurveyResults({ totalRespondents: 0, results: [] });
      }
    } catch (e) { 
        console.error(e);
        setSurveyResults({ totalRespondents: 0, results: [] });
    }
  };

  // --- HANDLERS ---

  const handleVerifyNip = async () => {
      if (!nip.trim()) {
          setNotification({ message: "Masukkan NIP terlebih dahulu.", type: 'error' });
          setTimeout(() => setNotification(null), 2000);
          return;
      }

      setIsVerifying(true);
      // Fetch latest data to verify
      const list = await fetchLecturers();
      const found = list.find((l: any) => String(l.nip).trim() === nip.trim());
      
      setIsVerifying(false);
      
      if (found) {
          setIsVerified(true);
          setVerifiedData({
              name: found.name,
              faculty: found.expertise || '-' // Menggunakan kolom expertise sebagai Fakultas
          });
          setNotification({ message: "Data ditemukan.", type: 'success' });
      } else {
          setIsVerified(false);
          setVerifiedData(null);
          setNotification({ message: "NIP tidak ditemukan.", type: 'error' });
      }
      setTimeout(() => setNotification(null), 2000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginRole === 'admin') {
        if (password === '112233') {
            setIsAdmin(true);
            fetchLecturers();
            fetchSurveys(true);
            setView('dashboard_admin');
        } else {
            alert("Password admin salah.");
        }
    } else {
        if (!isVerified) {
            handleVerifyNip();
            return;
        }
        // Lecturer Login Logic - Proceed directly since verified
        setIsAdmin(false);
        fetchSurveys(false);
        setView('dashboard_lecturer');
    }
  };

  const startSurvey = (survey: Survey) => {
    setActiveSurvey(survey);
    fetchQuestions(survey.id);
    setAnswers({});
    setView('fill_survey');
  };

  const submitSurvey = async () => {
    if (!activeSurvey) return;
    
    // Validate required fields (optional, but good UX)
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
        setNotification({ message: `Mohon lengkapi semua pertanyaan (${unanswered.length} belum diisi).`, type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        return;
    }

    const payload = {
        surveyId: activeSurvey.id,
        nip: nip.trim(), // Pastikan NIP bersih
        answers: Object.keys(answers).map(qid => ({ questionId: qid, value: answers[qid] }))
    };

    try {
        const res = await fetch(`${API_URL}?table=monev&action=monev_submit`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if (result.status === 'success') {
            setNotification({ message: 'Kuesioner berhasil dikirim! Terima kasih atas partisipasi Anda.', type: 'success' });
            // Fetch surveys again to update "Sudah Diisi" status
            await fetchSurveys(false);
            setTimeout(() => {
                setNotification(null);
                setView('dashboard_lecturer');
            }, 2000);
        } else {
            setNotification({ message: result.message || 'Terjadi kesalahan.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        }
    } catch (e) {
        setNotification({ message: 'Gagal menghubungi server.', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
    }
  };

  // --- ADMIN HANDLERS (DELETE & STATUS) ---
  const handleToggleStatus = async (survey: Survey) => {
      const newStatus = !survey.isActive;
      // Optimistic update
      setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, isActive: newStatus } : s));

      try {
          // Use generic update endpoint
          const res = await fetch(`${API_URL}?table=monev_surveys&action=update`, {
              method: 'POST',
              body: JSON.stringify({
                  table: 'monev_surveys',
                  data: {
                      id: survey.id,
                      isActive: newStatus ? 1 : 0
                  }
              })
          });
          const result = await res.json();
          if (result.status === 'success') {
              setNotification({ message: `Survei berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`, type: 'success' });
          } else {
              throw new Error("Gagal update status");
          }
      } catch (e) {
          // Revert optimistic update
          setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, isActive: !newStatus } : s));
          setNotification({ message: 'Gagal mengubah status survei.', type: 'error' });
      }
      setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteSurvey = async () => {
      if (!surveyToDelete) return;
      const id = surveyToDelete.id;
      setSurveyToDelete(null); // Close modal

      // Optimistic remove
      const previousSurveys = [...surveys];
      setSurveys(prev => prev.filter(s => s.id !== id));

      try {
          const res = await fetch(`${API_URL}?action=monev_delete_survey`, {
              method: 'POST',
              body: JSON.stringify({ id: id })
          });
          const result = await res.json();
          
          if (result.status === 'success') {
              setNotification({ message: 'Survei dan hasil berhasil dihapus.', type: 'success' });
          } else {
              throw new Error(result.message || "Gagal menghapus");
          }
      } catch (e) {
          setSurveys(previousSurveys); // Revert
          setNotification({ message: 'Gagal menghapus survei.', type: 'error' });
      }
      setTimeout(() => setNotification(null), 3000);
  };

  // --- ADMIN CREATION LOGIC ---
  const addQuestion = (type: Question['type']) => {
    const q: Question = {
        id: `q-${Date.now()}`,
        text: '',
        type,
        options: type === 'choice' || type === 'checkbox' ? ['Option 1'] : undefined,
        config: {
            chartType: type === 'choice' ? 'pie' : 'bar',
            minLabel: type === 'likert' ? 'Sangat Tidak Setuju' : undefined,
            maxLabel: type === 'likert' ? 'Sangat Setuju' : undefined
        }
    };
    setNewQuestions([...newQuestions, q]);
  };

  // Handlers for Options in Choice/Checkbox Questions
  const updateOption = (qIdx: number, optIdx: number, val: string) => {
      const updated = [...newQuestions];
      if (updated[qIdx].options) {
          updated[qIdx].options![optIdx] = val;
          setNewQuestions(updated);
      }
  };

  const addOption = (qIdx: number) => {
      const updated = [...newQuestions];
      if (!updated[qIdx].options) updated[qIdx].options = [];
      updated[qIdx].options!.push(`Option ${updated[qIdx].options!.length + 1}`);
      setNewQuestions(updated);
  };

  const removeOption = (qIdx: number, optIdx: number) => {
      const updated = [...newQuestions];
      if (updated[qIdx].options && updated[qIdx].options!.length > 1) {
          updated[qIdx].options!.splice(optIdx, 1);
          setNewQuestions(updated);
      } else {
          alert("Minimal satu opsi jawaban harus tersedia.");
      }
  };

  const saveSurvey = async () => {
    if (!newSurvey.title || !newSurvey.startDate || !newSurvey.endDate) {
        alert("Lengkapi data survei."); return;
    }
    const payload = {
        ...newSurvey,
        id: `sur-${Date.now()}`,
        target: 'lecturer', // EXPLICIT TARGET
        questions: newQuestions,
        allowedNips: Array.from(selectedNips)
    };

    const res = await fetch(`${API_URL}?table=monev&action=monev_create_survey`, {
        method: 'POST',
        body: JSON.stringify({ data: payload })
    });
    
    if (res.ok) {
        alert("Survei berhasil dibuat!");
        fetchSurveys(true);
        setView('dashboard_admin');
    }
  };

  const toggleDetail = (id: string) => {
      const next = new Set(expandedDetails);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandedDetails(next);
  };

  // --- RENDERERS ---

  // NOTIFICATION OVERLAY
  const renderNotification = () => {
      if (!notification) return null;
      return (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-slide-down">
              <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
                  notification.type === 'success' 
                  ? 'bg-emerald-600 text-white border-emerald-700' 
                  : 'bg-rose-600 text-white border-rose-700'
              }`}>
                  {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                  <div className="flex flex-col">
                      <h4 className="font-bold text-sm uppercase">{notification.type === 'success' ? 'Sukses' : 'Gagal'}</h4>
                      <p className="text-sm font-medium opacity-90">{notification.message}</p>
                  </div>
                  <button onClick={() => setNotification(null)} className="ml-4 opacity-70 hover:opacity-100"><X size={18}/></button>
              </div>
          </div>
      );
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {renderNotification()}
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-center">
           <div className="w-16 h-16 bg-[#003B73] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-blue-200">
              <BarChart3 size={32} />
           </div>
           
           <div className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
              Khusus Dosen
           </div>

           <h1 className="text-2xl font-bold text-slate-800 mb-2">Kuesioner PDB</h1>
           <p className="text-slate-500 mb-6 text-sm">Sistem Monitoring & Evaluasi Perkuliahan</p>
           
           {/* Login Role Tabs */}
           <div className="flex p-1.5 bg-slate-100 rounded-xl mb-6">
               <button 
                 onClick={() => { setLoginRole('lecturer'); setNip(''); setPassword(''); setIsVerified(false); setVerifiedData(null); }}
                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${loginRole === 'lecturer' ? 'bg-white text-[#003B73] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Dosen
               </button>
               <button 
                 onClick={() => { setLoginRole('admin'); setNip(''); setPassword(''); }}
                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${loginRole === 'admin' ? 'bg-white text-[#003B73] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Admin
               </button>
           </div>

           <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              {loginRole === 'lecturer' ? (
                  <div className="text-left animate-fade-in space-y-4">
                      {/* NIP INPUT */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">NIP</label>
                          <div className="flex gap-2 mt-1">
                              <div className="relative flex-1">
                                  <input 
                                    type="text" 
                                    value={nip}
                                    onChange={e => {
                                        setNip(e.target.value);
                                        if (isVerified) {
                                            setIsVerified(false);
                                            setVerifiedData(null);
                                        }
                                    }}
                                    className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 focus:border-[#003B73] outline-none font-medium"
                                    placeholder="Masukkan NIP Anda"
                                    autoComplete="off"
                                  />
                                  <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                              </div>
                              {!isVerified && (
                                  <button 
                                    type="button"
                                    onClick={handleVerifyNip}
                                    disabled={isVerifying}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-sm transition-colors border border-blue-200"
                                  >
                                      {isVerifying ? <Loader2 size={18} className="animate-spin"/> : 'Verifikasi'}
                                  </button>
                              )}
                          </div>
                      </div>

                      {/* VERIFIED INFO */}
                      {isVerified && verifiedData && (
                          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl animate-slide-down">
                              <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                                  <CheckCircle size={14} /> Terverifikasi
                              </div>
                              <div className="space-y-3">
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</label>
                                      <div className="font-bold text-slate-800 text-sm">{verifiedData.name}</div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Fakultas / Unit</label>
                                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
                                          <Building2 size={12} className="text-slate-400"/> {verifiedData.faculty}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="space-y-4 animate-fade-in">
                      <div className="text-left">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                          <div className="relative mt-1">
                              <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 focus:border-[#003B73] outline-none font-medium"
                                placeholder="Password Admin"
                                autoComplete="new-password"
                              />
                              <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                          </div>
                      </div>
                  </div>
              )}
              
              <button 
                disabled={loginRole === 'lecturer' && !isVerified}
                className={`w-full py-3 font-bold rounded-xl transition-all shadow-md mt-2 ${
                    loginRole === 'lecturer' && !isVerified
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-[#FFC700] hover:bg-[#e6b300] text-[#003B73]'
                }`}
              >
                  {loginRole === 'lecturer' ? 'Masuk Kuesioner' : 'Masuk Dashboard Admin'}
              </button>
           </form>
           
           <button onClick={onBack} className="mt-6 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center gap-1 mx-auto">
               <ArrowLeft size={12} /> Kembali ke Portal
           </button>
        </div>
      </div>
    );
  }

  // ... (dashboard_lecturer & fill_survey views)
  if (view === 'dashboard_lecturer') {
      return (
          <div className="min-h-screen bg-[#FDFBF7] p-6">
              {renderNotification()}
              <div className="max-w-4xl mx-auto">
                  <header className="flex flex-row justify-between items-center mb-8">
                      <div>
                          <h1 className="text-2xl font-bold text-[#003B73]">Kuesioner Tersedia</h1>
                          <p className="text-slate-500 text-sm">Daftar survei Monev yang perlu Anda isi.</p>
                      </div>
                      <button onClick={onBack} className="p-2 bg-white rounded-lg border hover:bg-slate-50"><ArrowLeft size={20}/></button>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                      {Array.isArray(surveys) && surveys.length === 0 ? (
                          <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
                              Belum ada kuesioner aktif untuk Anda.
                          </div>
                      ) : Array.isArray(surveys) && surveys.map(s => (
                          <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-row justify-between items-center gap-4">
                              <div className="flex-1">
                                  <h3 className="font-bold text-lg text-slate-800">{s.title}</h3>
                                  <p className="text-slate-500 text-sm mb-2">{s.description}</p>
                                  <div className="flex gap-2 text-xs font-bold text-slate-400">
                                      <span className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                                          <Calendar size={12}/> Berakhir: {s.endDate}
                                      </span>
                                  </div>
                              </div>
                              {s.hasResponded ? (
                                  <button disabled className="px-6 py-2.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm cursor-not-allowed flex items-center gap-2">
                                      <CheckCircle size={16} /> Sudah Diisi
                                  </button>
                              ) : (
                                  <button onClick={() => startSurvey(s)} className="px-6 py-2.5 bg-[#003B73] text-white rounded-xl font-bold text-sm hover:bg-[#002b55] shadow-lg shadow-blue-100 transition-all active:scale-95">
                                      Isi Kuesioner
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // ... (Sisa kode sama, hanya perlu memastikan view_results dan lainnya tidak diubah jika tidak perlu)
  // ... (Gunakan versi yang sudah ada untuk fill_survey, dashboard_admin, create_survey, view_results)
  // ... (Hanya ganti pemanggilan API yang relevan jika ada yang kurang)

  if (view === 'fill_survey') {
      return (
          <div className="min-h-screen bg-[#FDFBF7] p-6 relative">
              {renderNotification()}
              <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="bg-[#003B73] p-8 text-white">
                      <button onClick={() => setView('dashboard_lecturer')} className="mb-4 text-white/70 hover:text-white flex items-center gap-1 text-xs font-bold uppercase tracking-wider"><ArrowLeft size={14}/> Kembali</button>
                      <h1 className="text-3xl font-bold mb-2">{activeSurvey?.title}</h1>
                      <p className="text-blue-100">{activeSurvey?.description}</p>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      {questions.map((q, idx) => (
                          <div key={q.id} className="animate-fade-in">
                              <label className="block font-bold text-slate-800 text-lg mb-3">
                                  <span className="text-slate-400 mr-2">{idx + 1}.</span>
                                  {q.text}
                              </label>
                              
                              {q.type === 'text' && (
                                  <textarea 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none h-32"
                                    placeholder="Tulis jawaban Anda..."
                                    value={answers[q.id] || ''}
                                    onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                  />
                              )}

                              {q.type === 'choice' && (
                                  <div className="space-y-2">
                                      {q.options?.map((opt, i) => (
                                          <label key={i} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                              <input 
                                                type="radio" 
                                                name={q.id} 
                                                value={opt}
                                                checked={answers[q.id] === opt}
                                                onChange={() => setAnswers({...answers, [q.id]: opt})}
                                                className="mr-3 w-4 h-4 accent-blue-600"
                                              />
                                              {opt}
                                          </label>
                                      ))}
                                  </div>
                              )}

                              {q.type === 'likert' && (
                                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-4">
                                          <span>{q.config?.minLabel || 'Sangat Tidak Setuju'}</span>
                                          <span>{q.config?.maxLabel || 'Sangat Setuju'}</span>
                                      </div>
                                      <div className="flex justify-between gap-2">
                                          {[1, 2, 3, 4, 5].map(val => (
                                              <button
                                                key={val}
                                                onClick={() => setAnswers({...answers, [q.id]: val})}
                                                className={`w-full py-3 rounded-lg font-bold border transition-all ${answers[q.id] === val ? 'bg-[#003B73] text-white border-[#003B73] shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                                              >
                                                  {val}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}

                      <div className="pt-8 border-t border-slate-100 flex justify-end">
                          <button onClick={submitSurvey} className="px-8 py-3 bg-[#FFC700] hover:bg-[#e6b300] text-[#003B73] font-bold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center gap-2">
                              Kirim Jawaban <CheckCircle size={18}/>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- ADMIN VIEWS ---
  if (view === 'dashboard_admin') {
      return (
          <div className="min-h-screen bg-slate-50 p-8">
              {renderNotification()}
              
              {/* DELETE CONFIRMATION MODAL */}
              {surveyToDelete && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-down">
                          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 border-4 border-red-50 mx-auto">
                              <Trash2 size={24} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Hapus Survei?</h3>
                          <p className="text-center text-sm text-slate-500 mb-6">
                              Anda akan menghapus <strong>"{surveyToDelete.title}"</strong> beserta seluruh hasil jawaban. Tindakan ini tidak dapat dibatalkan.
                          </p>
                          <div className="flex gap-3">
                              <button onClick={() => setSurveyToDelete(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm">
                                  Batal
                              </button>
                              <button onClick={handleDeleteSurvey} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-colors text-sm">
                                  Ya, Hapus
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              <div className="max-w-6xl mx-auto">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h1 className="text-2xl font-bold text-slate-800">Admin Monev Dashboard</h1>
                          <p className="text-slate-500">Kelola survei dan lihat hasil.</p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setView('create_survey')} className="flex items-center gap-2 px-4 py-2 bg-[#003B73] text-white rounded-xl font-bold shadow-lg hover:bg-[#002b55]">
                              <Plus size={18} /> Buat Survei Baru
                          </button>
                          <button onClick={onBack} className="p-2 bg-white border rounded-xl hover:bg-slate-100 text-slate-500"><LogOut size={20}/></button>
                      </div>
                  </div>

                  {/* GRID SYSTEM: Force 3 Columns to mimic PC view on mobile due to fixed viewport */}
                  <div className="grid grid-cols-3 gap-6">
                      {Array.isArray(surveys) && surveys.map(s => (
                          <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${s.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                      {s.isActive ? 'Aktif' : 'Non-Aktif'}
                                  </div>
                                  <div className="flex gap-1">
                                      <button 
                                        onClick={() => handleToggleStatus(s)} 
                                        className={`p-1.5 rounded-lg border transition-colors ${s.isActive ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100' : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'}`}
                                        title={s.isActive ? "Nonaktifkan Survei" : "Aktifkan Survei"}
                                      >
                                          <Power size={14} />
                                      </button>
                                      <button 
                                        onClick={() => setSurveyToDelete(s)} 
                                        className="p-1.5 rounded-lg text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                                        title="Hapus Survei"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">{s.title}</h3>
                              <p className="text-xs text-slate-500 font-mono mb-4">{s.startDate} s/d {s.endDate}</p>
                              
                              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-mono select-all">ID: {s.id.split('-')[1]}</span>
                                  <button onClick={() => { setActiveSurvey(s); fetchResults(s.id); setView('view_results'); }} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                      Lihat Hasil <ArrowRight size={12} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // Create Survey & Results View (sama persis dengan yang sebelumnya, hanya pastikan saveSurvey menargetkan 'lecturer' secara eksplisit di file backend atau frontend logic jika diperlukan, tapi backend defaultnya 'lecturer' jadi aman. Untuk student kita buat baru.)
  // (Potongan kode create_survey dan view_results sama dengan revisi sebelumnya)
  
  // Create Survey & Results View
  if (view === 'create_survey') {
      return (
          <div className="min-h-screen bg-slate-50 p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h2 className="font-bold text-xl text-slate-800">Buat Survei Baru</h2>
                      <button onClick={() => setView('dashboard_admin')}><X size={20} className="text-slate-400"/></button>
                  </div>
                  
                  <div className="p-8 space-y-6 h-[70vh] overflow-y-auto custom-scrollbar">
                      {/* Step 1: Info Dasar */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Judul Survei</label>
                              <input type="text" className="w-full p-2 border rounded-lg" value={newSurvey.title} onChange={e => setNewSurvey({...newSurvey, title: e.target.value})} />
                          </div>
                          <div className="col-span-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi</label>
                              <textarea className="w-full p-2 border rounded-lg h-20" value={newSurvey.description} onChange={e => setNewSurvey({...newSurvey, description: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Mulai</label>
                              <input type="date" className="w-full p-2 border rounded-lg" value={newSurvey.startDate} onChange={e => setNewSurvey({...newSurvey, startDate: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Selesai</label>
                              <input type="date" className="w-full p-2 border rounded-lg" value={newSurvey.endDate} onChange={e => setNewSurvey({...newSurvey, endDate: e.target.value})} />
                          </div>
                      </div>

                      {/* Step 2: Pertanyaan */}
                      <div className="border-t border-slate-100 pt-6">
                          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><List size={18}/> Daftar Pertanyaan</h3>
                          
                          {newQuestions.map((q, idx) => (
                              <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 relative group">
                                  <button onClick={() => setNewQuestions(newQuestions.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                  
                                  <div className="flex gap-4 mb-2">
                                      <span className="font-bold text-slate-400 py-2">{idx + 1}.</span>
                                      <input 
                                        type="text" 
                                        className="flex-1 p-2 border rounded-lg font-medium" 
                                        placeholder="Tulis pertanyaan..." 
                                        value={q.text}
                                        onChange={e => {
                                            const updated = [...newQuestions];
                                            updated[idx].text = e.target.value;
                                            setNewQuestions(updated);
                                        }}
                                      />
                                  </div>

                                  {/* CONFIG FOR CHOICE / CHECKBOX - NEW UI ADDED */}
                                  {(q.type === 'choice' || q.type === 'checkbox') && (
                                      <div className="pl-8 mt-3 space-y-2">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Opsi Jawaban:</label>
                                          {q.options?.map((opt, optIdx) => (
                                              <div key={optIdx} className="flex gap-2 items-center">
                                                  <div className="text-slate-400">{q.type === 'choice' ? <Circle size={14}/> : <Square size={14}/>}</div>
                                                  <input 
                                                    type="text" 
                                                    className="flex-1 p-1.5 text-sm border rounded bg-white"
                                                    value={opt}
                                                    onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                                    placeholder={`Opsi ${optIdx + 1}`}
                                                  />
                                                  <button 
                                                    onClick={() => removeOption(idx, optIdx)} 
                                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                                                    title="Hapus Opsi"
                                                  >
                                                      <Trash2 size={14} />
                                                  </button>
                                              </div>
                                          ))}
                                          <button 
                                            onClick={() => addOption(idx)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                                          >
                                              <Plus size={12} /> Tambah Opsi
                                          </button>
                                      </div>
                                  )}

                                  {/* CONFIG FOR LIKERT & CHART */}
                                  <div className="pl-8 mt-3 grid grid-cols-2 gap-4">
                                      {q.type === 'likert' && (
                                          <>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Label Kiri (1)</label>
                                                <input type="text" className="w-full p-1 text-sm border rounded" value={q.config?.minLabel} onChange={e => {
                                                    const updated = [...newQuestions];
                                                    updated[idx].config = { ...updated[idx].config, minLabel: e.target.value };
                                                    setNewQuestions(updated);
                                                }} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Label Kanan (5)</label>
                                                <input type="text" className="w-full p-1 text-sm border rounded" value={q.config?.maxLabel} onChange={e => {
                                                    const updated = [...newQuestions];
                                                    updated[idx].config = { ...updated[idx].config, maxLabel: e.target.value };
                                                    setNewQuestions(updated);
                                                }} />
                                            </div>
                                          </>
                                      )}
                                      
                                      <div className="col-span-2">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase">Visualisasi Hasil</label>
                                          <div className="flex gap-2 mt-1">
                                              {['bar', 'pie', 'list'].map(t => (
                                                  <button 
                                                    key={t}
                                                    onClick={() => {
                                                        const updated = [...newQuestions];
                                                        updated[idx].config = { ...updated[idx].config, chartType: t as any };
                                                        setNewQuestions(updated);
                                                    }}
                                                    className={`px-3 py-1 rounded text-xs border uppercase font-bold ${q.config?.chartType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500'}`}
                                                  >
                                                      {t}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}

                          <div className="flex gap-2">
                              <button onClick={() => addQuestion('text')} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50">+ Teks</button>
                              <button onClick={() => addQuestion('choice')} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50">+ Pilihan Ganda</button>
                              <button onClick={() => addQuestion('likert')} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50">+ Skala Likert</button>
                          </div>
                      </div>

                      {/* Step 3: Access Control (Allowlist) */}
                      <div className="border-t border-slate-100 pt-6">
                          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Lock size={18}/> Akses Dosen (Whitelist)</h3>
                          <div className="h-40 overflow-y-auto border rounded-xl p-2 bg-slate-50 grid grid-cols-2 gap-2">
                              <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                                  <input type="checkbox" onChange={(e) => {
                                      if (e.target.checked) setSelectedNips(new Set(lecturers.map(l => l.nip)));
                                      else setSelectedNips(new Set());
                                  }} />
                                  <span className="font-bold text-sm">Pilih Semua Dosen</span>
                              </label>
                              {lecturers.map(l => (
                                  <label key={l.id} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                                      <input type="checkbox" checked={selectedNips.has(l.nip)} onChange={(e) => {
                                          const next = new Set(selectedNips);
                                          if (e.target.checked) next.add(l.nip);
                                          else next.delete(l.nip);
                                          setSelectedNips(next);
                                      }} />
                                      <span className="text-xs truncate">{l.name}</span>
                                  </label>
                              ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">{selectedNips.size} Dosen terpilih.</p>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button onClick={saveSurvey} className="px-8 py-3 bg-[#003B73] text-white font-bold rounded-xl shadow-lg hover:bg-[#002b55]">
                          Simpan & Terbitkan
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // Admin Results View (REUSED from previous)
  if (view === 'view_results' && surveyResults) {
      return (
          <div className="min-h-screen bg-slate-50 p-8">
              <div className="max-w-5xl mx-auto">
                  <button onClick={() => setView('dashboard_admin')} className="mb-4 text-slate-500 font-bold text-xs flex items-center gap-1"><ArrowLeft size={12}/> Kembali</button>
                  <h1 className="text-2xl font-bold text-slate-800 mb-1">{activeSurvey?.title}</h1>
                  <p className="text-slate-500 mb-6">Total Responden: <span className="font-bold text-blue-600">{surveyResults.totalRespondents}</span></p>

                  {/* GRID SYSTEM: Force 2 Columns on all screens */}
                  <div className="grid grid-cols-2 gap-6">
                      {surveyResults.results && Array.isArray(surveyResults.results) && surveyResults.results.map((res: any, idx: number) => {
                          const { question, data = [], details = [] } = res;
                          const safeData = Array.isArray(data) ? data : [];
                          const safeDetails = Array.isArray(details) ? details : [];
                          
                          // Simple Chart Rendering Logic (CSS Based)
                          const total = safeData.reduce((acc:any, curr:any) => acc + parseInt(String(curr?.count || 0)), 0);
                          const chartType = question.config?.chartType || 'bar';
                          
                          if (!res || !res.question) return null;

                          return (
                              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm break-inside-avoid">
                                  <h3 className="font-bold text-slate-800 mb-4 text-sm">{question.text}</h3>
                                  
                                  {question.type === 'text' ? (
                                      <div className="h-40 overflow-y-auto custom-scrollbar space-y-2">
                                          {safeData.length > 0 ? safeData.map((d: any, i: number) => (
                                              <div key={i} className="p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100">"{d.value}"</div>
                                          )) : <div className="text-center text-xs text-slate-400 italic">Belum ada jawaban.</div>}
                                      </div>
                                  ) : (
                                      <div className="mt-4">
                                          {/* PIE CHART */}
                                          {chartType === 'pie' && (
                                              <div className="flex flex-col items-center">
                                                  <div className="relative w-40 h-40 rounded-full shadow-inner"
                                                      style={{
                                                          background: safeData.length > 0 ? `conic-gradient(${
                                                              safeData.map((d:any, i:number) => {
                                                                  const prevTotal = safeData.slice(0, i).reduce((p:any, c:any) => p + parseInt(c.count || 0), 0);
                                                                  const startPct = total > 0 ? (prevTotal / total) * 100 : 0;
                                                                  const currentPct = total > 0 ? (parseInt(d.count || 0) / total) * 100 : 0;
                                                                  const endPct = startPct + currentPct;
                                                                  return `${CHART_COLORS[i % CHART_COLORS.length]} ${startPct}% ${endPct}%`;
                                                              }).join(', ')
                                                          })` : '#f1f5f9'
                                                      }}
                                                  ></div>
                                                  <div className="mt-4 w-full grid grid-cols-2 gap-x-2 gap-y-2">
                                                      {safeData.map((d:any, i:number) => (
                                                          <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                                                              <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: CHART_COLORS[i % CHART_COLORS.length]}}></div>
                                                              <span className="truncate flex-1" title={d.value}>{d.value}</span>
                                                              <span className="font-bold">{d.count} ({total > 0 ? ((d.count/total)*100).toFixed(0) : 0}%)</span>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}

                                          {/* LIST VIEW */}
                                          {chartType === 'list' && (
                                              <div className="space-y-2">
                                                  {safeData.map((d:any, i:number) => {
                                                      const pct = total > 0 ? (parseInt(d.count || 0) / total) * 100 : 0;
                                                      return (
                                                          <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                              <span className="text-xs font-medium text-slate-700 truncate mr-2">{d.value}</span>
                                                              <div className="flex items-center gap-2 shrink-0">
                                                                  <span className="text-xs font-bold text-slate-500">{d.count}</span>
                                                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{pct.toFixed(1)}%</span>
                                                              </div>
                                                          </div>
                                                      )
                                                  })}
                                              </div>
                                          )}

                                          {/* BAR CHART (DEFAULT) */}
                                          {(chartType === 'bar') && (
                                              <div className="space-y-3">
                                                  {safeData.map((d: any, i: number) => {
                                                      const pct = total > 0 ? (d.count / total) * 100 : 0;
                                                      return (
                                                          <div key={i}>
                                                              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                                                  <span>{d.value}</span>
                                                                  <span>{d.count} ({pct.toFixed(1)}%)</span>
                                                              </div>
                                                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                  <div 
                                                                    className="h-2 rounded-full transition-all duration-1000" 
                                                                    style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                                                  ></div>
                                                              </div>
                                                          </div>
                                                      )
                                                  })}
                                              </div>
                                          )}
                                          
                                          {safeData.length === 0 && <p className="text-xs text-slate-400 italic text-center mt-2">Belum ada data.</p>}
                                      </div>
                                  )}

                                  {/* DETAIL RESPONDEN TOGGLE */}
                                  <div className="mt-4 pt-4 border-t border-slate-100">
                                      <button 
                                          onClick={() => {
                                              const next = new Set(expandedDetails);
                                              if (next.has(question.id)) next.delete(question.id);
                                              else next.add(question.id);
                                              setExpandedDetails(next);
                                          }}
                                          className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors w-full justify-center"
                                      >
                                          {expandedDetails.has(question.id) ? (
                                              <><ChevronUp size={14} /> Sembunyikan Detail Responden</>
                                          ) : (
                                              <><Users size={14} /> Lihat Detail Responden ({safeDetails.length})</>
                                          )}
                                      </button>

                                      {expandedDetails.has(question.id) && (
                                          <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                                              {safeDetails.length > 0 ? (
                                                  <table className="w-full text-xs text-left">
                                                      <thead className="text-slate-400 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0 bg-slate-50">
                                                          <tr>
                                                              <th className="py-2 pl-2">Nama Dosen</th>
                                                              <th className="py-2">Jawaban</th>
                                                          </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-200">
                                                          {safeDetails.map((d: any, i: number) => (
                                                              <tr key={i} className="hover:bg-white transition-colors">
                                                                  <td className="py-2 pl-2 font-bold text-slate-700">{d.respondentName}</td>
                                                                  <td className="py-2 text-slate-600">{d.value}</td>
                                                              </tr>
                                                          ))}
                                                      </tbody>
                                                  </table>
                                              ) : (
                                                  <div className="text-center text-xs text-slate-400 italic py-4">Tidak ada detail responden yang tersedia.</div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  return <div>Loading...</div>;
};

export default MonevApp;