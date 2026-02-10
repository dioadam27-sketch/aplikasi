import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Menu, BookOpen, Users, Building2, Calendar, FileSpreadsheet, Wifi } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import DataManager from './DataManager';
import ScheduleView from './ScheduleView';
import MonitoringView from './MonitoringView';
import LecturerPortal from './LecturerPortal';
import LecturerMonitoringView from './LecturerMonitoringView'; 
import HonorView from './HonorView'; 
import LoginView from './LoginView';
import SettingsView from './SettingsView';
import AttendanceAdminView from './AttendanceAdminView'; 
import { Course, Lecturer, Room, ScheduleItem, ViewState, User, UserRole, ClassName, AppSetting, TeachingLog } from '../types';
import * as XLSX from 'xlsx';

// UPDATED BACKEND URL (PHP API)
const DEFAULT_SHEET_URL = 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php';
const CACHE_KEY = 'simpdb_data_cache_v5_api_php'; // Updated cache key
const POLLING_INTERVAL = 3000; // Poll every 3 seconds for real-time sync

interface SimpdbAppProps {
  onBackToPortal: () => void;
}

const SimpdbApp: React.FC<SimpdbAppProps> = ({ onBackToPortal }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // --- ROUTING LOGIC (HASH BASED) ---
  const getViewFromHash = (): ViewState => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash as ViewState;
    }
    return 'dashboard';
  };

  const [currentView, setCurrentView] = useState<ViewState>(getViewFromHash);

  // --- DOCUMENT TITLE UPDATE ---
  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      schedule: 'Jadwal Kuliah',
      courses: 'Mata Kuliah',
      lecturers: 'Data Dosen',
      rooms: 'Data Ruangan',
      classes: 'Data Kelas',
      monitoring: 'Monitoring',
      attendance: 'Presensi Dosen',
      honor: 'Honor Mengajar',
      portal: 'Portal Dosen',
      lecturer_monitoring: 'Monitoring Saya',
      settings: 'Pengaturan'
    };
    
    document.title = `${titles[currentView] || 'Aplikasi'} - SIMPDB`;
  }, [currentView]);

  // --- HASH LISTENER ---
  useEffect(() => {
    const handleHashChange = () => {
      const newView = getViewFromHash();
      setCurrentView(newView);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [errorSync, setErrorSync] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [realtimeNotification, setRealtimeNotification] = useState<boolean>(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [classNames, setClassNames] = useState<ClassName[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [teachingLogs, setTeachingLogs] = useState<TeachingLog[]>([]);

  // Refs for State Comparison (Optimized Realtime)
  const previousDataRef = useRef<string>('');

  const [passModalOpen, setPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
  const [passMsg, setPassMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isScheduleLocked = settings.some(s => s.key === 'schedule_lock' && String(s.value).toLowerCase() === 'true');

  // Dashboard Stats Toggle State
  const [statsMode, setStatsMode] = useState<'all' | 'active'>('active');
  const [coordDetailOpen, setCoordDetailOpen] = useState(false);

  // Initialize URL - Force update if it doesn't match the new default
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const stored = localStorage.getItem('simpdb_api_url');
    // If stored is old google script or empty, update to new API
    if (!stored || stored.includes('script.google.com')) {
       localStorage.setItem('simpdb_api_url', DEFAULT_SHEET_URL);
       return DEFAULT_SHEET_URL;
    }
    return stored;
  });

  // --- STATS & DATA CALCULATION ---
  const lecturerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    const total = lecturers.length;
    
    lecturers.forEach(l => {
      let pos = l.position && l.position.trim() !== '' ? l.position.trim() : 'Lainnya';
      if (pos.toLowerCase() === 'belum punya jabfung') pos = 'Belum Punya Jabfung';
      stats[pos] = (stats[pos] || 0) + 1;
    });

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => {
         let colorClass = 'bg-slate-400';
         if (label.includes('Guru Besar')) colorClass = 'bg-purple-500';
         else if (label.includes('Lektor Kepala')) colorClass = 'bg-indigo-500';
         else if (label.includes('Lektor')) colorClass = 'bg-blue-500';
         else if (label.includes('Asisten')) colorClass = 'bg-emerald-500';
         else if (label.includes('LB') || label.includes('Praktisi')) colorClass = 'bg-amber-500';
         else if (label.includes('Belum Punya')) colorClass = 'bg-slate-500';
         
         return { label, count, percentage: total > 0 ? (count / total) * 100 : 0, colorClass };
      });
  }, [lecturers]);

  const activeLecturerStats = useMemo(() => {
    const plottedIds = new Set<string>();
    schedule.forEach(s => {
       if (s.lecturerIds && Array.isArray(s.lecturerIds)) s.lecturerIds.forEach(id => plottedIds.add(id));
    });

    const stats: Record<string, number> = {};
    let totalActive = 0;
    
    lecturers.forEach(l => {
       if (plottedIds.has(l.id)) {
           let pos = l.position && l.position.trim() !== '' ? l.position.trim() : 'Lainnya';
           if (pos.toLowerCase() === 'belum punya jabfung') pos = 'Belum Punya Jabfung';
           stats[pos] = (stats[pos] || 0) + 1;
           totalActive++;
       }
    });

    return Object.entries(stats)
     .sort((a, b) => b[1] - a[1])
     .map(([label, count]) => {
        let colorClass = 'bg-slate-400';
        if (label.includes('Guru Besar')) colorClass = 'bg-purple-500';
        else if (label.includes('Lektor Kepala')) colorClass = 'bg-indigo-500';
        else if (label.includes('Lektor')) colorClass = 'bg-blue-500';
        else if (label.includes('Asisten')) colorClass = 'bg-emerald-500';
        else if (label.includes('LB') || label.includes('Praktisi')) colorClass = 'bg-amber-500';
        else if (label.includes('Belum Punya')) colorClass = 'bg-slate-500';
        return { label, count, percentage: totalActive > 0 ? (count / totalActive) * 100 : 0, colorClass };
     });
 }, [lecturers, schedule]);

  const coordinatorStats = useMemo(() => {
    const uniqueCoordinatorIds = Array.from(new Set(courses.map(c => c.coordinatorId).filter(id => id && id && id.trim() !== '')));
    const details = uniqueCoordinatorIds.map(coordId => {
        const lecturer = lecturers.find(l => l.id === coordId);
        const name = lecturer?.name || 'Unknown';
        const mySchedules = schedule.filter(s => (s.lecturerIds || []).includes(coordId!));
        const scheduleDetails = mySchedules.map(s => {
            const course = courses.find(c => c.id === s.courseId);
            const room = rooms.find(r => r.id === s.roomId);
            const teamNames = (s.lecturerIds || []).map(lid => lecturers.find(lx => lx.id === lid)?.name || lid);
            const isCoordinatedByMe = course?.coordinatorId === coordId;
            return {
                id: s.id,
                className: s.className,
                courseName: course?.name || s.courseId,
                courseCode: course?.code || '',
                day: s.day,
                time: s.timeSlot,
                room: room?.name || s.roomId,
                building: room?.building || '',
                team: teamNames,
                isCoordinatedByMe
            };
        }).sort((a, b) => a.className.localeCompare(b.className));

        return {
            id: coordId,
            name: name,
            scheduleCount: scheduleDetails.length,
            schedules: scheduleDetails,
            isTeachingAnything: scheduleDetails.length > 0
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const totalCoordinators = uniqueCoordinatorIds.length;
    const activeCoordinators = details.filter(d => d.isTeachingAnything).length;
    const inactiveCoordinators = totalCoordinators - activeCoordinators;
    const percentageTeaching = totalCoordinators > 0 ? (activeCoordinators / totalCoordinators) * 100 : 0;

    return { totalCoordinators, activeCoordinators, inactiveCoordinators, percentageTeaching, details };
  }, [courses, schedule, lecturers, rooms]);

  const plottingStats = useMemo(() => {
     const plottedIds = new Set<string>();
     schedule.forEach(s => {
        if (s.lecturerIds && Array.isArray(s.lecturerIds)) s.lecturerIds.forEach(id => plottedIds.add(id));
     });
     const total = lecturers.length;
     const plotted = plottedIds.size;
     const unplotted = total - plotted;
     const percentage = total > 0 ? (plotted / total) * 100 : 0;
     return { total, plotted, unplotted, percentage };
  }, [lecturers, schedule]);

  const downloadCoordinatorReport = () => {
    if (!coordinatorStats.details || coordinatorStats.details.length === 0) return;
    try {
        const data: any[] = [];
        coordinatorStats.details.forEach(coord => {
            if (coord.schedules.length === 0) {
                data.push({ "Nama Koordinator": coord.name, "Status Mengajar": "Tidak Mengajar", "Mata Kuliah": "-", "Kelas": "-", "Hari": "-", "Jam": "-", "Ruangan": "-", "Tim Pengajar": "-", "Posisi di MK": "-" });
            } else {
                coord.schedules.forEach(sch => {
                    data.push({ "Nama Koordinator": coord.name, "Status Mengajar": "Aktif", "Mata Kuliah": sch.courseName, "Kelas": sch.className, "Hari": sch.day, "Jam": sch.time, "Ruangan": sch.room, "Tim Pengajar": sch.team.join(", "), "Posisi di MK": sch.isCoordinatedByMe ? "Koordinator (PJMK)" : "Dosen Pengajar" });
                });
            }
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sebaran Koordinator");
        XLSX.writeFile(workbook, "Laporan_Sebaran_Koordinator.xlsx");
    } catch (e) { console.error("Download failed", e); }
  };

  const saveToCache = (data: any) => {
    const cacheData = { timestamp: new Date().toISOString(), data: data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    setLastSyncTime(new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}));
  };

  const loadFromCache = useCallback(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const data = parsed.data;
        if (data.courses) setCourses(data.courses);
        if (data.lecturers) setLecturers(data.lecturers);
        if (data.rooms) setRooms(data.rooms);
        if (data.schedule) setSchedule(data.schedule);
        if (data.classes) setClassNames(data.classes);
        if (data.settings) setSettings(data.settings);
        if (data.teaching_logs) setTeachingLogs(data.teaching_logs);
        if (parsed.timestamp) setLastSyncTime(new Date(parsed.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}));
        
        // Initialize Ref with cached data to prevent initial reload trigger
        previousDataRef.current = JSON.stringify(data);
        return true; 
      } catch (e) { return false; }
    }
    return false;
  }, []);

  const fetchFromSheets = async (url: string, forceRefresh = false, silent = false) => {
    if (!url) return;
    if (!silent) setIsSyncing(true);
    if (!silent) setErrorSync(null); 
    
    // CRITICAL FIX: Ensure previousDataRef is cleared to FORCE React re-render
    if (forceRefresh) {
        previousDataRef.current = '';
    }

    try {
      let cleanUrl = url.trim();
      const separator = cleanUrl.includes('?') ? '&' : '?';
      const nocacheParam = forceRefresh ? '&nocache=true' : '';
      const fetchUrl = `${cleanUrl}${separator}t=${new Date().getTime()}${nocacheParam}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      
      if (data) {
        const normalizedData = {
          courses: data.courses?.map((c: any) => ({ ...c, id: String(c.id), credits: Number(c.credits) || 0, coordinatorId: String(c.coordinatorId || '') })) || [],
          lecturers: data.lecturers?.map((l: any) => ({ ...l, id: String(l.id), nip: String(l.nip) })) || [],
          rooms: data.rooms?.map((r: any) => ({ ...r, id: String(r.id), capacity: Number(r.capacity) || 0 })) || [],
          schedule: data.schedule?.map((s: any) => {
            let parsedIds: string[] = [];
            try {
              if (Array.isArray(s.lecturerIds)) { parsedIds = s.lecturerIds.map(String); } 
              else if (s.lecturerIds && typeof s.lecturerIds === 'string') {
                 try { const raw = JSON.parse(s.lecturerIds); if (Array.isArray(raw)) parsedIds = raw.map(String); else parsedIds = [String(s.lecturerIds)]; } 
                 catch { if (s.lecturerIds.includes(',')) parsedIds = s.lecturerIds.split(',').map((i: string) => i.trim()); else parsedIds = [s.lecturerIds]; }
              } else if (s.lecturerIds) { parsedIds = [String(s.lecturerIds)]; } 
              else if (s.lecturerId) { parsedIds = [String(s.lecturerId)]; }
            } catch(e) { if (typeof s.lecturerIds === 'string') parsedIds = [s.lecturerIds]; }

            return { 
              ...s, 
              id: String(s.id), 
              lecturerIds: parsedIds,
              pjmkLecturerId: String(s.pjmkLecturerId || ''),
              courseId: String(s.courseId).trim(), 
              roomId: String(s.roomId).trim(),
              className: String(s.className || '').trim(),
              timeSlot: String(s.timeSlot || '').trim()
            };
          }) || [],
          classes: data.classes || [],
          settings: data.settings || [],
          teaching_logs: data.teaching_logs?.map((l: any) => ({
             id: String(l.id),
             scheduleId: String(l.scheduleId),
             lecturerId: String(l.lecturerId),
             week: Number(l.week) || 0,
             timestamp: String(l.timestamp || ''),
             date: String(l.date || '')
          })) || []
        };

        // --- REALTIME OPTIMIZATION: DEEP COMPARISON ---
        // Only update state if data physically changed to avoid re-renders
        const currentString = JSON.stringify(normalizedData);
        if (currentString !== previousDataRef.current) {
            
            // If it's a silent poll (auto-refresh) and data changed, show toast
            if (silent && previousDataRef.current !== '') {
                setRealtimeNotification(true);
                setTimeout(() => setRealtimeNotification(false), 5000);
            }

            setCourses(normalizedData.courses);
            setLecturers(normalizedData.lecturers);
            setRooms(normalizedData.rooms);
            setSchedule(normalizedData.schedule);
            setClassNames(normalizedData.classes);
            setSettings(normalizedData.settings);
            setTeachingLogs(normalizedData.teaching_logs);
            
            previousDataRef.current = currentString;
            saveToCache(normalizedData);
        }
        
        setApiConnected(true);
      } else {
        throw new Error("Data format invalid");
      }
    } catch (err) {
      console.error("Sync Error:", err);
      if (!silent) setErrorSync(err instanceof Error ? err.message : 'Gagal terhubung ke database');
      setApiConnected(false);
    } finally {
      if (!silent) setIsLoading(false);
      if (!silent) setIsSyncing(false);
    }
  };

  // --- AUTO POLLING FOR REAL-TIME SYNC ---
  useEffect(() => {
    if (!sheetUrl) return;

    const intervalId = setInterval(() => {
      // Only poll if window is visible (save resources) and not currently syncing manually
      if (!document.hidden && !isSyncing) {
         fetchFromSheets(sheetUrl, true, true); 
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [sheetUrl, isSyncing]);

  // Initial Load
  useEffect(() => {
     const loaded = loadFromCache();
     if(!loaded) fetchFromSheets(sheetUrl);
     else {
        setIsLoading(false);
        fetchFromSheets(sheetUrl, true, true); // Background refresh
     }
  }, []); // eslint-disable-line

  // --- API MUTATION HELPER (FIXED: OPTIMISTIC UPDATE & DELAY) ---
  const sendToApi = async (table: string, action: string, data: any = {}, id: string | null = null) => {
      if (!sheetUrl) return;
      
      // 1. OPTIMISTIC UPDATE: Update local state immediately for better UX
      if (action === 'add' || action === 'update' || action === 'delete') {
          if (table === 'schedule') {
              if (action === 'add') setSchedule(prev => [...prev, data]);
              if (action === 'update') setSchedule(prev => prev.map(item => item.id === (id || data.id) ? { ...item, ...data } : item));
              if (action === 'delete') setSchedule(prev => prev.filter(item => item.id !== (id || data.id)));
          }
          // (Add other tables if needed, but Schedule is the main concern)
      }

      setIsSyncing(true);
      try {
          const payload = { action, table, data, id };
          
          // 2. Send to API
          await fetch(sheetUrl, {
              method: 'POST',
              body: JSON.stringify(payload)
          });

          // 3. WAIT DELAY: Wait for DB transaction to fully commit before reading back
          await new Promise(resolve => setTimeout(resolve, 800));

          // 4. Force Fetch Authoritative Data
          await fetchFromSheets(sheetUrl, true);
      } catch (e) {
          console.error(e);
          setErrorSync("Gagal menyimpan data ke server.");
          // Rollback logic could go here, but usually a re-fetch fixes it
          fetchFromSheets(sheetUrl, true); 
      } finally {
          setIsSyncing(false);
      }
  };

  // --- HANDLERS ---
  const handleLogin = (id: string, name: string, role: UserRole) => {
    setCurrentUser({ id, name, role });
    setSessionMessage(null);
    if (role === 'admin') {
      if (currentView === 'portal' || currentView === 'lecturer_monitoring') {
        setCurrentView('dashboard');
        window.location.hash = 'dashboard';
      }
    } else {
      setCurrentView('portal');
      window.location.hash = 'portal';
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    window.location.hash = 'dashboard';
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };

  // --- VIEW RENDERING ---
  if (!currentUser) {
      return <LoginView 
        lecturers={lecturers} 
        onLogin={handleLogin} 
        onSync={() => fetchFromSheets(sheetUrl, true)} 
        sessionMessage={sessionMessage} 
        onBack={onBackToPortal}
      />;
  }

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        userRole={currentUser.role}
        onChangeView={(view) => { setCurrentView(view); window.location.hash = view; }} 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onSync={() => fetchFromSheets(sheetUrl, true)}
        onChangePassword={() => setPassModalOpen(true)}
        onBackToPortal={onBackToPortal}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative md:ml-64 transition-all duration-300">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 flex justify-between items-center md:hidden z-20">
             <div className="font-bold text-slate-800 flex items-center gap-2">
                <img src="https://ppk2ipe.unair.ac.id/gambar/UNAIR_BRANDMARK_2025-02.png" className="w-8 h-8 object-contain" alt="Logo" />
                SIMPDB
             </div>
             <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg"><Menu size={20}/></button>
        </header>

        {/* Realtime Notification Toast */}
        {realtimeNotification && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#003B73] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in text-xs font-bold border border-[#FFC107]">
                <Wifi size={14} className="text-[#FFC107]" />
                Data diperbarui secara realtime
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
            {currentView === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                        <p className="text-slate-500">Ringkasan data perkuliahan PDB.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Mata Kuliah" value={courses.length} icon={BookOpen} color="text-blue-500" />
                        <StatCard title="Total Dosen" value={lecturers.length} icon={Users} color="text-emerald-500" />
                        <StatCard title="Ruangan" value={rooms.length} icon={Building2} color="text-orange-500" />
                        <StatCard title="Jadwal Kelas" value={schedule.length} icon={Calendar} color="text-purple-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Lecturer Stats */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="font-bold text-slate-800">Statistik Jabatan Dosen</h3>
                                 <div className="flex bg-slate-100 p-1 rounded-lg">
                                     <button onClick={() => setStatsMode('all')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statsMode === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Semua</button>
                                     <button onClick={() => setStatsMode('active')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statsMode === 'active' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Aktif Mengajar</button>
                                 </div>
                             </div>
                             <div className="space-y-4">
                                 {(statsMode === 'all' ? lecturerStats : activeLecturerStats).map((stat, idx) => (
                                     <div key={idx} className="group">
                                         <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-600">
                                             <span>{stat.label}</span>
                                             <span>{stat.count} Orang ({stat.percentage.toFixed(1)}%)</span>
                                         </div>
                                         <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                             <div className={`h-full rounded-full transition-all duration-1000 ${stat.colorClass}`} style={{ width: `${stat.percentage}%` }}></div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        {/* Plotting Ratio */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                             <div className="w-40 h-40 rounded-full border-[12px] border-slate-100 flex items-center justify-center relative mb-4">
                                  <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                                      <circle cx="50%" cy="50%" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-blue-500 transition-all duration-1000" strokeDasharray="440" strokeDashoffset={440 - (440 * plottingStats.percentage) / 100} />
                                  </svg>
                                  <div className="z-10">
                                      <span className="text-3xl font-black text-slate-800 block">{plottingStats.percentage.toFixed(0)}%</span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">Terplotting</span>
                                  </div>
                             </div>
                             <h3 className="font-bold text-slate-800 mb-1">Rasio Plotting Dosen</h3>
                             <p className="text-xs text-slate-500 px-4">
                                Dari total <span className="font-bold text-slate-700">{plottingStats.total}</span> dosen, sebanyak <span className="font-bold text-blue-600">{plottingStats.plotted}</span> telah mendapatkan jadwal.
                             </p>
                        </div>
                    </div>

                    {/* Coordinator Stats */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                             <div>
                                 <h3 className="font-bold text-slate-800">Sebaran Koordinator MK</h3>
                                 <p className="text-xs text-slate-500 mt-1">Total {coordinatorStats.totalCoordinators} Koordinator terdaftar.</p>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => setCoordDetailOpen(!coordDetailOpen)} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                                    {coordDetailOpen ? 'Tutup Detail' : 'Lihat Detail'}
                                </button>
                                <button onClick={downloadCoordinatorReport} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-1">
                                    <FileSpreadsheet size={14}/> Excel
                                </button>
                             </div>
                        </div>
                        {coordDetailOpen && (
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-500">Nama Koordinator</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 text-center">Status Mengajar</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 text-center">Jumlah Kelas</th>
                                            <th className="p-4 text-xs font-bold text-slate-500">Detail Kelas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {coordinatorStats.details.map((coord, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="p-4 text-sm font-bold text-slate-700">{coord.name}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${coord.isTeachingAnything ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {coord.isTeachingAnything ? 'Aktif' : 'Tidak Mengajar'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-600">{coord.scheduleCount}</td>
                                                <td className="p-4">
                                                    {coord.schedules.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {coord.schedules.map((s, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 mb-1 last:mb-0">
                                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.isCoordinatedByMe ? 'bg-amber-500' : 'bg-slate-300'}`} title={s.isCoordinatedByMe ? 'Koordinator MK ini' : 'Pengajar'}></span>
                                                                    <div className="flex flex-col leading-tight">
                                                                        <span className="font-bold text-slate-700 text-[11px]">{s.courseName || 'MK Tidak Ditemukan'}</span>
                                                                        <div className="flex items-center gap-1">
                                                                             <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-200">{s.className}</span>
                                                                             <span className="text-[9px] text-slate-400">{s.day}, {s.time.split(' - ')[0]}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-slate-400 italic text-xs">Belum ada kelas diambil</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {currentView === 'courses' && (
                <DataManager 
                    title="Mata Kuliah" 
                    data={courses} 
                    columns={[
                        { key: 'code', label: 'Kode MK' },
                        { key: 'name', label: 'Nama Mata Kuliah' },
                        { key: 'credits', label: 'SKS', type: 'number' },
                        { key: 'coordinatorId', label: 'Koordinator', type: 'select', options: lecturers.map(l => ({ value: l.id, label: l.name })) }
                    ]}
                    onAdd={(item) => sendToApi('courses', 'add', { ...item, id: `course-${Date.now()}` })}
                    onEdit={(item) => sendToApi('courses', 'update', item)}
                    onDelete={(id) => sendToApi('courses', 'delete', {}, id)}
                    onImport={(items) => sendToApi('courses', 'bulk_add', items.map(i => ({ ...i, id: `course-${Date.now()}-${Math.random()}`, coordinatorId: '' })))}
                    onSync={() => fetchFromSheets(sheetUrl, true)}
                />
            )}
            
            {currentView === 'lecturers' && (
                <DataManager 
                    title="Dosen" 
                    data={lecturers} 
                    columns={[
                        { key: 'nip', label: 'NIP' },
                        { key: 'name', label: 'Nama Lengkap' },
                        { key: 'position', label: 'Jabatan Fungsional' },
                        { key: 'expertise', label: 'Bidang Keahlian' }
                    ]}
                    onAdd={(item) => sendToApi('lecturers', 'add', { ...item, id: `lec-${Date.now()}` })}
                    onEdit={(item) => sendToApi('lecturers', 'update', item)}
                    onDelete={(id) => sendToApi('lecturers', 'delete', {}, id)}
                    onImport={(items) => sendToApi('lecturers', 'bulk_add', items.map(i => ({ ...i, id: `lec-${Date.now()}-${Math.random()}` })))}
                    onSync={() => fetchFromSheets(sheetUrl, true)}
                    onClear={() => sendToApi('lecturers', 'clear')}
                />
            )}

            {currentView === 'rooms' && (
                <DataManager 
                    title="Ruangan" 
                    data={rooms} 
                    columns={[
                        { key: 'name', label: 'Nama Ruangan' },
                        { key: 'building', label: 'Gedung / Lokasi' },
                        { key: 'capacity', label: 'Kapasitas', type: 'number' }
                    ]}
                    onAdd={(item) => sendToApi('rooms', 'add', { ...item, id: `room-${Date.now()}` })}
                    onEdit={(item) => sendToApi('rooms', 'update', item)}
                    onDelete={(id) => sendToApi('rooms', 'delete', {}, id)}
                    onImport={(items) => sendToApi('rooms', 'bulk_add', items.map(i => ({ ...i, id: `room-${Date.now()}-${Math.random()}` })))}
                    onSync={() => fetchFromSheets(sheetUrl, true)}
                />
            )}

            {currentView === 'classes' && (
                <DataManager 
                    title="Data Kelas" 
                    data={classNames} 
                    columns={[{ key: 'name', label: 'Nama Kelas' }]}
                    onAdd={(item) => sendToApi('classes', 'add', { ...item, id: `cls-${Date.now()}` })}
                    onEdit={(item) => sendToApi('classes', 'update', item)}
                    onDelete={(id) => sendToApi('classes', 'delete', {}, id)}
                    onImport={(items) => sendToApi('classes', 'bulk_add', items.map(i => ({ ...i, id: `cls-${Date.now()}-${Math.random()}` })))}
                    onSync={() => fetchFromSheets(sheetUrl, true)}
                />
            )}

            {currentView === 'schedule' && (
                <ScheduleView 
                    courses={courses}
                    lecturers={lecturers}
                    rooms={rooms}
                    classNames={classNames}
                    schedule={schedule}
                    setSchedule={setSchedule}
                    onAddSchedule={(item) => sendToApi('schedule', 'add', item)}
                    onEditSchedule={(item) => sendToApi('schedule', 'update', { ...item, lecturerIds: JSON.stringify(item.lecturerIds) })}
                    onDeleteSchedule={(id) => sendToApi('schedule', 'delete', {}, id)}
                    onImportSchedule={(items) => sendToApi('schedule', 'bulk_add', items.map(i => ({...i, lecturerIds: JSON.stringify(i.lecturerIds)})))}
                    onSync={() => fetchFromSheets(sheetUrl, true)}
                    isLocked={isScheduleLocked}
                    onToggleLock={() => {
                        const newStatus = (!isScheduleLocked).toString();
                        const setting = settings.find(s => s.key === 'schedule_lock');
                        if (setting) {
                            sendToApi('settings', 'update', { ...setting, value: newStatus });
                        } else {
                            sendToApi('settings', 'add', { id: `st-${Date.now()}`, key: 'schedule_lock', value: newStatus });
                        }
                    }}
                />
            )}

            {currentView === 'monitoring' && (
                <MonitoringView 
                    rooms={rooms}
                    courses={courses}
                    lecturers={lecturers}
                    schedule={schedule}
                    teachingLogs={teachingLogs}
                />
            )}

            {currentView === 'attendance' && (
                <AttendanceAdminView 
                    schedule={schedule}
                    courses={courses}
                    lecturers={lecturers}
                    rooms={rooms}
                    teachingLogs={teachingLogs}
                    onAddLog={(log) => sendToApi('teaching_logs', 'add', log)}
                    onRemoveLog={(scheduleId, lecturerId, week) => {
                       // Find ID for delete
                       const log = teachingLogs.find(l => l.scheduleId === scheduleId && l.lecturerId === lecturerId && l.week === week);
                       if(log) sendToApi('teaching_logs', 'delete', {}, log.id);
                    }}
                    onSync={() => fetchFromSheets(sheetUrl, true)}
                />
            )}
            
            {currentView === 'honor' && (
                 <HonorView 
                    lecturers={lecturers}
                    schedule={schedule}
                    courses={courses}
                    teachingLogs={teachingLogs}
                 />
            )}

            {currentView === 'portal' && (
                <LecturerPortal 
                    currentLecturerId={currentUser.role === 'lecturer' ? currentUser.id : undefined}
                    userRole={currentUser.role}
                    courses={courses}
                    lecturers={lecturers}
                    rooms={rooms}
                    schedule={schedule}
                    setSchedule={setSchedule}
                    onUpdateLecturer={(scheduleId, lecturerIds, pjmkId) => {
                        sendToApi('schedule', 'update', { 
                            id: scheduleId, 
                            lecturerIds: JSON.stringify(lecturerIds), 
                            pjmkLecturerId: pjmkId 
                        });
                    }}
                    onSync={() => fetchFromSheets(sheetUrl, true)}
                    isLocked={isScheduleLocked}
                    teachingLogs={teachingLogs}
                    onAddLog={(log) => sendToApi('teaching_logs', 'add', log)}
                    onRemoveLog={(scheduleId, lecturerId, week) => {
                       const log = teachingLogs.find(l => l.scheduleId === scheduleId && l.lecturerId === lecturerId && l.week === week);
                       if(log) sendToApi('teaching_logs', 'delete', {}, log.id);
                    }}
                />
            )}

            {currentView === 'lecturer_monitoring' && (
                 <LecturerMonitoringView 
                    currentLecturerId={currentUser.id}
                    schedule={schedule}
                    courses={courses}
                    teachingLogs={teachingLogs}
                 />
            )}

            {currentView === 'settings' && (
                <SettingsView 
                    sheetUrl={sheetUrl}
                    onSaveUrl={(url) => {
                        setSheetUrl(url);
                        localStorage.setItem('simpdb_api_url', url);
                        fetchFromSheets(url, true);
                    }}
                />
            )}
        </main>
      </div>
      
      {/* Password Change Modal */}
      {passModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-[#003B73]/60 backdrop-blur-sm" onClick={() => setPassModalOpen(false)}></div>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 animate-slide-down border border-[#FFC107]">
                  <h3 className="text-lg font-bold text-[#003B73] mb-4">Ganti Password</h3>
                  <div className="space-y-3">
                      <input 
                        type="password" 
                        placeholder="Password Lama" 
                        className="w-full px-4 py-2 border rounded-xl" 
                        value={passForm.old} 
                        onChange={e => setPassForm({...passForm, old: e.target.value})}
                      />
                      <input 
                        type="password" 
                        placeholder="Password Baru" 
                        className="w-full px-4 py-2 border rounded-xl"
                        value={passForm.new} 
                        onChange={e => setPassForm({...passForm, new: e.target.value})}
                      />
                      <input 
                        type="password" 
                        placeholder="Konfirmasi Password Baru" 
                        className="w-full px-4 py-2 border rounded-xl"
                        value={passForm.confirm} 
                        onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                      />
                  </div>
                  {passMsg && <p className={`text-xs mt-2 ${passMsg.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>{passMsg.text}</p>}
                  <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setPassModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Batal</button>
                      <button 
                        onClick={() => {
                            // Validate and API Call
                            const me = lecturers.find(l => l.id === currentUser.id);
                            if(me) {
                                const oldPass = me.password || me.nip;
                                if(passForm.old !== oldPass) {
                                    setPassMsg({type: 'error', text: 'Password lama salah.'});
                                    return;
                                }
                                if(passForm.new !== passForm.confirm) {
                                    setPassMsg({type: 'error', text: 'Konfirmasi password tidak cocok.'});
                                    return;
                                }
                                sendToApi('lecturers', 'update', { ...me, password: passForm.new });
                                setPassMsg({type: 'success', text: 'Password berhasil diubah.'});
                                setTimeout(() => {
                                    setPassModalOpen(false); 
                                    setPassMsg(null);
                                    setPassForm({old:'', new:'', confirm:''});
                                }, 1500);
                            }
                        }} 
                        className="px-4 py-2 bg-[#003B73] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#002b55]"
                      >
                          Simpan
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SimpdbApp;