
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import LoginView from './LoginView';
import DataManager from './DataManager';
import ScheduleView from './ScheduleView';
import MonitoringView from './MonitoringView';
import AttendanceAdminView from './AttendanceAdminView';
import HonorView from './HonorView';
import LecturerPortal from './LecturerPortal';
import LecturerMonitoringView from './LecturerMonitoringView';
import SettingsView from './SettingsView';
import { 
  UserRole, ViewState, Course, Lecturer, Room, ClassName, ScheduleItem, TeachingLog, AppSetting 
} from '../types';
import { LayoutDashboard, Users, BookOpen, Building2, Calendar, AlertTriangle } from 'lucide-react';

interface SimpdbAppProps {
  onBackToPortal: () => void;
}

const SimpdbApp: React.FC<SimpdbAppProps> = ({ onBackToPortal }) => {
  // State
  const [sheetUrl, setSheetUrl] = useState<string>(localStorage.getItem('simpdb_api_url') || 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classNames, setClassNames] = useState<ClassName[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [teachingLogs, setTeachingLogs] = useState<TeachingLog[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);

  // --- API HANDLERS ---

  const fetchData = useCallback(async (url: string, forceRefresh = false) => {
    if (!url) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const separator = url.includes('?') ? '&' : '?';
      const cacheBuster = forceRefresh ? `${separator}nocache=true&t=${Date.now()}` : '';
      const finalUrl = `${url}${cacheBuster}`;

      const response = await fetch(finalUrl);
      if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
      }
      const json = await response.json();
      
      if (json.error) throw new Error(json.error);

      if (json.courses) setCourses(json.courses);
      if (json.lecturers) setLecturers(json.lecturers);
      if (json.rooms) setRooms(json.rooms);
      if (json.classes) setClassNames(json.classes);
      
      if (json.schedule) {
        const parsedSchedule = json.schedule.map((item: any) => {
            let ids = item.lecturerIds;
            if (typeof ids === 'string') {
                try {
                    // Normalize potential corrupted JSON string
                    const cleanIds = ids.replace(/^"|"$/g, '').replace(/\\"/g, '"');
                    if (cleanIds.startsWith('[') || cleanIds.startsWith('"')) {
                        ids = JSON.parse(cleanIds);
                    } else if (cleanIds === '') {
                        ids = [];
                    }
                } catch (e) {
                    ids = [];
                }
            }
            if (!Array.isArray(ids)) ids = [];
            return { ...item, lecturerIds: ids };
        });
        setSchedule(parsedSchedule);
      }

      if (json.teaching_logs) setTeachingLogs(json.teaching_logs);
      if (json.settings) setSettings(json.settings);

    } catch (error) {
      console.error("Fetch error:", error);
      setErrorMsg("Gagal mengambil data dari server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendToApi = async (table: string, action: string, data: any = {}, id?: string) => {
    if (!sheetUrl) return;
    
    try {
      const payload = { action, table, data, id };
      
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // FIX: Jangan refresh data jika table adalah 'schedule'.
      // ScheduleView sudah melakukan update tampilan secara lokal (Optimistic UI).
      // Jika kita refresh di sini, data lama dari server akan menimpa data baru di layar sebelum server selesai menyimpan.
      if (action !== 'delete' && table !== 'schedule') {
          fetchData(sheetUrl, true);
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  useEffect(() => {
    if (sheetUrl) {
      fetchData(sheetUrl);
    }
  }, [sheetUrl, fetchData]);

  // --- HANDLERS ---

  const handleLogin = (id: string, name: string, role: UserRole) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentUser({ id, name });
    setCurrentView(role === 'lecturer' ? 'portal' : 'dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('guest');
    setCurrentUser(null);
  };

  const handleSaveUrl = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem('simpdb_api_url', url);
    fetchData(url, true);
  };

  // --- RENDER ---

  if (!isLoggedIn) {
    return (
      <LoginView 
        lecturers={lecturers} 
        onLogin={handleLogin} 
        onSync={() => fetchData(sheetUrl, true)}
        sessionMessage={errorMsg}
        onBack={onBackToPortal}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        currentView={currentView}
        userRole={userRole}
        onChangeView={setCurrentView}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={handleLogout}
        onSync={() => fetchData(sheetUrl, true)}
        onChangePassword={() => alert("Fitur ganti password belum tersedia.")}
        onBackToPortal={onBackToPortal}
      />

      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* DASHBOARD VIEW */}
          {currentView === 'dashboard' && (
             <div className="space-y-6 animate-fade-in">
                <div>
                   <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                   <p className="text-slate-500">Ringkasan data sistem penjadwalan.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   <StatCard title="Total Dosen" value={lecturers.length} icon={Users} color="text-blue-600" />
                   <StatCard title="Mata Kuliah" value={courses.length} icon={BookOpen} color="text-emerald-600" />
                   <StatCard title="Ruangan" value={rooms.length} icon={Building2} color="text-orange-600" />
                   <StatCard title="Jadwal Aktif" value={schedule.length} icon={Calendar} color="text-purple-600" />
                </div>
             </div>
          )}

          {/* SCHEDULE VIEW */}
          {currentView === 'schedule' && (
             <ScheduleView 
                courses={courses}
                lecturers={lecturers}
                rooms={rooms}
                classNames={classNames}
                schedule={schedule}
                setSchedule={setSchedule} 
                onAddSchedule={(item) => sendToApi('schedule', 'add', item)}
                onEditSchedule={(item) => sendToApi('schedule', 'update', item)}
                onDeleteSchedule={(id) => sendToApi('schedule', 'delete', {}, id)}
                onImportSchedule={(items) => sendToApi('schedule', 'bulk_add', items)}
                onClearSchedule={() => sendToApi('schedule', 'clear')}
                onSync={() => fetchData(sheetUrl, true)}
                onLockAll={(isLocked) => sendToApi('schedule', 'lock_all_schedule', { isLocked })}
             />
          )}

          {/* MASTER DATA VIEWS */}
          {currentView === 'courses' && (
              <DataManager 
                  title="Mata Kuliah" 
                  data={courses} 
                  columns={[
                      { key: 'code', label: 'Kode MK' },
                      { key: 'name', label: 'Nama Mata Kuliah' },
                      { key: 'credits', label: 'SKS', type: 'number' }
                  ]}
                  onAdd={(item) => sendToApi('courses', 'add', { ...item, id: `course-${Date.now()}` })}
                  onEdit={(item) => sendToApi('courses', 'update', item)}
                  onDelete={(id) => sendToApi('courses', 'delete', {}, id)}
                  onImport={(items) => sendToApi('courses', 'bulk_add', items.map(i => ({ ...i, id: `course-${Date.now()}-${Math.random()}` })))}
                  onSync={() => fetchData(sheetUrl, true)}
                  onClear={() => sendToApi('courses', 'clear')}
              />
          )}

          {currentView === 'lecturers' && (
              <DataManager 
                  title="Dosen" 
                  data={lecturers} 
                  columns={[
                      { key: 'nip', label: 'NIP' },
                      { key: 'name', label: 'Nama Lengkap' },
                      { 
                          key: 'position', 
                          label: 'Jabatan Fungsional', 
                          type: 'select',
                          options: [
                              'Belum Punya Jabatan Fungsional',
                              'Asisten Ahli',
                              'Lektor',
                              'Lektor Kepala',
                              'Guru Besar',
                              'LB',
                              'LB Praktisi'
                          ]
                      },
                      { key: 'expertise', label: 'Fakultas' }
                  ]}
                  onAdd={(item) => sendToApi('lecturers', 'add', { ...item, id: `lec-${Date.now()}` })}
                  onEdit={(item) => sendToApi('lecturers', 'update', item)}
                  onDelete={(id) => sendToApi('lecturers', 'delete', {}, id)}
                  onImport={(items) => sendToApi('lecturers', 'bulk_add', items.map(i => ({ ...i, id: `lec-${Date.now()}-${Math.random()}` })))}
                  onSync={() => fetchData(sheetUrl, true)}
                  onClear={() => sendToApi('lecturers', 'clear')}
              />
          )}

          {currentView === 'rooms' && (
              <DataManager 
                  title="Ruangan" 
                  data={rooms} 
                  columns={[
                      { key: 'name', label: 'Nama Ruangan' },
                      { key: 'capacity', label: 'Kapasitas', type: 'number' },
                      { key: 'building', label: 'Gedung' },
                      { key: 'location', label: 'Lokasi' }
                  ]}
                  onAdd={(item) => sendToApi('rooms', 'add', { ...item, id: `room-${Date.now()}` })}
                  onEdit={(item) => sendToApi('rooms', 'update', item)}
                  onDelete={(id) => sendToApi('rooms', 'delete', {}, id)}
                  onImport={(items) => sendToApi('rooms', 'bulk_add', items.map(i => ({ ...i, id: `room-${Date.now()}-${Math.random()}` })))}
                  onSync={() => fetchData(sheetUrl, true)}
                  onClear={() => sendToApi('rooms', 'clear')}
              />
          )}

          {currentView === 'classes' && (
              <DataManager 
                  title="Kelas" 
                  data={classNames} 
                  columns={[
                      { key: 'name', label: 'Nama Kelas' }
                  ]}
                  onAdd={(item) => sendToApi('classes', 'add', { ...item, id: `cls-${Date.now()}` })}
                  onEdit={(item) => sendToApi('classes', 'update', item)}
                  onDelete={(id) => sendToApi('classes', 'delete', {}, id)}
                  onImport={(items) => sendToApi('classes', 'bulk_add', items.map(i => ({ ...i, id: `cls-${Date.now()}-${Math.random()}` })))}
                  onSync={() => fetchData(sheetUrl, true)}
                  onClear={() => sendToApi('classes', 'clear')}
              />
          )}

          {/* MONITORING & REPORTING */}
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
                  onAddLog={(log) => sendToApi('teaching_logs', 'add', { ...log, id: `log-${Date.now()}` })}
                  onRemoveLog={(scheduleId, lecturerId, week) => {
                      const log = teachingLogs.find(l => l.scheduleId === scheduleId && l.lecturerId === lecturerId && l.week === week);
                      if (log) sendToApi('teaching_logs', 'delete', {}, log.id);
                  }}
                  onSync={() => fetchData(sheetUrl, true)}
              />
          )}

          {currentView === 'honor' && userRole === 'admin' && (
              <HonorView 
                  lecturers={lecturers}
                  schedule={schedule}
                  courses={courses}
                  teachingLogs={teachingLogs}
              />
          )}

          {/* LECTURER PORTAL */}
          {currentView === 'portal' && (
              <LecturerPortal 
                  currentLecturerId={currentUser?.id}
                  userRole={userRole}
                  courses={courses}
                  lecturers={lecturers}
                  rooms={rooms}
                  classNames={classNames}
                  schedule={schedule}
                  setSchedule={setSchedule}
                  onUpdateLecturer={(scheduleId, lecturerIds, pjmkId) => {
                      const item = schedule.find(s => s.id === scheduleId);
                      if (item) {
                          const updated = { ...item, lecturerIds, pjmkLecturerId: pjmkId };
                          sendToApi('schedule', 'update', updated);
                      }
                  }}
                  onAddSchedule={(item) => sendToApi('schedule', 'add', item)} 
                  onSync={() => fetchData(sheetUrl, true)}
                  teachingLogs={teachingLogs}
                  onAddLog={(log) => sendToApi('teaching_logs', 'add', { ...log, id: `log-${Date.now()}` })}
                  onRemoveLog={(scheduleId, lecturerId, week) => {
                      const log = teachingLogs.find(l => l.scheduleId === scheduleId && l.lecturerId === lecturerId && l.week === week);
                      if (log) sendToApi('teaching_logs', 'delete', {}, log.id);
                  }}
              />
          )}

          {currentView === 'lecturer_monitoring' && currentUser && (
              <LecturerMonitoringView 
                  currentLecturerId={currentUser.id}
                  schedule={schedule}
                  courses={courses}
                  teachingLogs={teachingLogs}
              />
          )}

          {/* SETTINGS */}
          {currentView === 'settings' && userRole === 'admin' && (
              <SettingsView 
                  sheetUrl={sheetUrl} 
                  onSaveUrl={handleSaveUrl} 
              />
          )}

        </main>
      </div>
    </div>
  );
};

export default SimpdbApp;
