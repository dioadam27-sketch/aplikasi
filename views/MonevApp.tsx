import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Save, BarChart3, CheckCircle, Lock, Calendar, Users, List, PieChart, AlignLeft, CheckSquare, Trash2, ArrowRight, User, LogOut } from 'lucide-react';
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
}

// --- API URL ---
const API_URL = 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php';

const MonevApp: React.FC<MonevAppProps> = ({ onBack }) => {
  const [view, setView] = useState<'login' | 'dashboard_lecturer' | 'fill_survey' | 'dashboard_admin' | 'create_survey' | 'view_results'>('login');
  
  // Auth State
  const [loginRole, setLoginRole] = useState<'lecturer' | 'admin'>('lecturer');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<Lecturer | null>(null);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]); // For Admin Whitelist

  // Data State
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [surveyResults, setSurveyResults] = useState<any>(null);

  // Creator State
  const [newSurvey, setNewSurvey] = useState<Partial<Survey>>({ title: '', description: '', startDate: '', endDate: '' });
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);
  const [selectedNips, setSelectedNips] = useState<Set<string>>(new Set());

  // --- FETCH HELPERS ---
  const fetchLecturers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=fetch_all_simpdb`);
      const data = await res.json();
      setLecturers(Array.isArray(data.lecturers) ? data.lecturers : []);
    } catch (e) { 
        console.error("Error fetching lecturers:", e);
        setLecturers([]);
    }
  };

  const fetchSurveys = async (adminMode = false) => {
    try {
      const res = await fetch(`${API_URL}?action=monev_surveys&nip=${nip}&admin=${adminMode}`);
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
      setSurveyResults(data);
    } catch (e) { console.error(e); }
  };

  // --- HANDLERS ---

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
        if (!nip.trim()) {
            alert("Silakan masukkan NIP.");
            return;
        }
        // Lecturer Login Logic
        fetchLecturers().then(() => {
            setIsAdmin(false);
            fetchSurveys(false);
            setView('dashboard_lecturer');
        });
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
    // Validate required?
    const payload = {
        surveyId: activeSurvey.id,
        nip: nip,
        answers: Object.keys(answers).map(qid => ({ questionId: qid, value: answers[qid] }))
    };

    const res = await fetch(`${API_URL}?table=monev&action=monev_submit`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === 'success') {
        alert("Terima kasih! Kuesioner berhasil dikirim.");
        setView('dashboard_lecturer');
    } else {
        alert(result.message);
    }
  };

  // --- ADMIN CREATION LOGIC ---
  const addQuestion = (type: Question['type']) => {
    const q: Question = {
        id: `q-${Date.now()}`,
        text: '',
        type,
        options: type === 'choice' || type === 'checkbox' ? [''] : undefined,
        config: {
            chartType: type === 'choice' ? 'pie' : 'bar',
            minLabel: type === 'likert' ? 'Sangat Tidak Setuju' : undefined,
            maxLabel: type === 'likert' ? 'Sangat Setuju' : undefined
        }
    };
    setNewQuestions([...newQuestions, q]);
  };

  const saveSurvey = async () => {
    if (!newSurvey.title || !newSurvey.startDate || !newSurvey.endDate) {
        alert("Lengkapi data survei."); return;
    }
    const payload = {
        ...newSurvey,
        id: `sur-${Date.now()}`,
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

  // --- RENDERERS ---

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-center">
           <div className="w-16 h-16 bg-[#003B73] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-blue-200">
              <BarChart3 size={32} />
           </div>
           <h1 className="text-2xl font-bold text-slate-800 mb-2">Monev PDB</h1>
           <p className="text-slate-500 mb-6 text-sm">Sistem Monitoring & Evaluasi Perkuliahan</p>
           
           {/* Login Role Tabs */}
           <div className="flex p-1.5 bg-slate-100 rounded-xl mb-6">
               <button 
                 onClick={() => { setLoginRole('lecturer'); setNip(''); setPassword(''); }}
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

           <form onSubmit={handleLogin} className="space-y-4">
              {loginRole === 'lecturer' ? (
                  <div className="text-left animate-fade-in">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">NIP Dosen</label>
                      <div className="relative mt-1">
                          <input 
                            type="text" 
                            value={nip}
                            onChange={e => setNip(e.target.value)}
                            className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 focus:border-[#003B73] outline-none font-medium"
                            placeholder="Masukkan NIP Anda"
                          />
                          <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      </div>
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
                              />
                              <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                          </div>
                      </div>
                  </div>
              )}
              
              <button className="w-full py-3 bg-[#FFC700] hover:bg-[#e6b300] text-[#003B73] font-bold rounded-xl transition-all shadow-md mt-2">
                  {loginRole === 'lecturer' ? 'Masuk Portal Dosen' : 'Masuk Dashboard Admin'}
              </button>
           </form>
           
           <button onClick={onBack} className="mt-6 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center gap-1 mx-auto">
               <ArrowLeft size={12} /> Kembali ke Portal
           </button>
        </div>
      </div>
    );
  }

  if (view === 'dashboard_lecturer') {
      return (
          <div className="min-h-screen bg-[#FDFBF7] p-6">
              <div className="max-w-4xl mx-auto">
                  <header className="flex justify-between items-center mb-8">
                      <div>
                          <h1 className="text-2xl font-bold text-[#003B73]">Kuesioner Tersedia</h1>
                          <p className="text-slate-500 text-sm">Daftar survei Monev yang perlu Anda isi.</p>
                      </div>
                      <button onClick={onBack} className="p-2 bg-white rounded-lg border hover:bg-slate-50"><ArrowLeft size={20}/></button>
                  </header>

                  <div className="grid gap-4">
                      {Array.isArray(surveys) && surveys.length === 0 ? (
                          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
                              Belum ada kuesioner aktif untuk Anda.
                          </div>
                      ) : Array.isArray(surveys) && surveys.map(s => (
                          <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
                              <div>
                                  <h3 className="font-bold text-lg text-slate-800">{s.title}</h3>
                                  <p className="text-slate-500 text-sm mb-2">{s.description}</p>
                                  <div className="flex gap-2 text-xs font-bold text-slate-400">
                                      <span className="bg-slate-100 px-2 py-1 rounded">Berakhir: {s.endDate}</span>
                                  </div>
                              </div>
                              <button onClick={() => startSurvey(s)} className="px-6 py-2 bg-[#003B73] text-white rounded-xl font-bold text-sm hover:bg-[#002b55] shadow-lg shadow-blue-100">
                                  Isi Kuesioner
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'fill_survey') {
      return (
          <div className="min-h-screen bg-[#FDFBF7] p-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.isArray(surveys) && surveys.map(s => (
                          <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group">
                              <div className="flex justify-between items-start mb-4">
                                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                      {s.isActive ? 'Aktif' : 'Selesai'}
                                  </div>
                                  <button onClick={() => { setActiveSurvey(s); fetchResults(s.id); setView('view_results'); }} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1">
                                      Lihat Hasil <ArrowRight size={12} />
                                  </button>
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 mb-1">{s.title}</h3>
                              <p className="text-xs text-slate-500 font-mono mb-4">{s.startDate} s/d {s.endDate}</p>
                              
                              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                                  {/* Actions placeholder */}
                                  <span className="text-xs text-slate-400">ID: {s.id.split('-')[1]}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // Create Survey & Results View are complex, simplifying for code block size limit but implementing key custom requirements
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

                                  {/* Custom Config per Question */}
                                  <div className="pl-8 grid grid-cols-2 gap-4">
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

  // Admin Results View
  if (view === 'view_results' && surveyResults) {
      return (
          <div className="min-h-screen bg-slate-50 p-8">
              <div className="max-w-5xl mx-auto">
                  <button onClick={() => setView('dashboard_admin')} className="mb-4 text-slate-500 font-bold text-xs flex items-center gap-1"><ArrowLeft size={12}/> Kembali</button>
                  <h1 className="text-2xl font-bold text-slate-800 mb-1">{activeSurvey?.title}</h1>
                  <p className="text-slate-500 mb-6">Total Responden: <span className="font-bold text-blue-600">{surveyResults.totalRespondents}</span></p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {surveyResults.results.map((res: any, idx: number) => {
                          const { question, data } = res;
                          // Simple Chart Rendering Logic (CSS Based)
                          const total = data.reduce((acc:any, curr:any) => acc + parseInt(curr.count), 0);
                          
                          return (
                              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm break-inside-avoid">
                                  <h3 className="font-bold text-slate-800 mb-4 text-sm">{question.text}</h3>
                                  
                                  {question.type === 'text' ? (
                                      <div className="h-40 overflow-y-auto custom-scrollbar space-y-2">
                                          {data.map((d: any, i: number) => (
                                              <div key={i} className="p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100">"{d.value}"</div>
                                          ))}
                                      </div>
                                  ) : (
                                      <div className="space-y-3">
                                          {/* Render Bar Chart for Likert/Choice */}
                                          {data.map((d: any, i: number) => {
                                              const pct = total > 0 ? (d.count / total) * 100 : 0;
                                              return (
                                                  <div key={i}>
                                                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                                          <span>{d.value}</span>
                                                          <span>{d.count} ({pct.toFixed(1)}%)</span>
                                                      </div>
                                                      <div className="w-full bg-slate-100 rounded-full h-2">
                                                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                                      </div>
                                                  </div>
                                              )
                                          })}
                                          {data.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada data.</p>}
                                      </div>
                                  )}
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

// Simple icon for X (Close)
const X = ({size, className}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);

export default MonevApp;