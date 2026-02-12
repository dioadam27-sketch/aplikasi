import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Calendar, Trash2, Plus, AlertCircle, Check, Search, UserMinus, X, Building2, Clock, CalendarPlus, FileSpreadsheet, Upload, RefreshCw, Users, BookOpen, AlertTriangle, Lock, Unlock, ToggleLeft, ToggleRight, Edit2, ChevronDown, CheckCircle, ArrowUpDown, Save, Layers } from 'lucide-react';
import { Course, Lecturer, Room, ScheduleItem, DayOfWeek, TIME_SLOTS, ClassName } from '../types';
import * as XLSX from 'xlsx';

interface ScheduleViewProps {
  courses: Course[];
  lecturers: Lecturer[];
  rooms: Room[];
  classNames: ClassName[];
  schedule: ScheduleItem[];
  setSchedule: (schedule: ScheduleItem[]) => void;
  onAddSchedule?: (item: ScheduleItem) => void;
  onEditSchedule?: (item: ScheduleItem) => void;
  onDeleteSchedule?: (id: string) => void;
  onImportSchedule?: (items: ScheduleItem[]) => void;
  onClearSchedule?: () => void;
  onSync?: () => void;
  onLockAll?: (isLocked: boolean) => void;
}

// --- INTERNAL COMPONENT: SEARCHABLE SELECT ---
const SearchableSelect = ({ label, options, value, onChange, placeholder }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Normalize Options
    const normalizedOptions = useMemo(() => {
        return options.map((opt: any) => {
            if (typeof opt === 'string') return { value: opt, label: opt };
            return opt;
        });
    }, [options]);

    const selectedLabel = useMemo(() => {
        const found = normalizedOptions.find((o: any) => String(o.value) === String(value));
        return found ? found.label : value || '';
    }, [value, normalizedOptions]);

    const filteredOptions = useMemo(() => {
        return normalizedOptions.filter((o: any) => 
            o.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [normalizedOptions, search]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-1.5 group relative" ref={containerRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors ml-1">{label}</label>
            <div 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer flex justify-between items-center hover:border-blue-300 transition-colors shadow-sm"
                onClick={() => { setIsOpen(!isOpen); if(!isOpen) setSearch(''); }}
            >
                <span className={`text-sm font-medium ${value ? 'text-slate-800' : 'text-slate-400'}`}>
                    {selectedLabel || placeholder || `Pilih ${label}`}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-zoom-in max-h-60 flex flex-col">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Cari..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt: any) => (
                                <div 
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between hover:bg-blue-50 transition-colors ${String(value) === String(opt.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                                >
                                    {opt.label}
                                    {String(value) === String(opt.value) && <Check size={14} className="text-blue-600"/>}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-center text-xs text-slate-400 italic">Tidak ditemukan.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- INTERNAL COMPONENT: EDIT FORM ---
const EditForm = ({ 
    editModal, 
    setEditModal, 
    handleSaveEdit, 
    editConflicts, 
    courses, 
    classNames, 
    rooms, 
    lecturers, 
    isPopover, 
    courseOptions, 
    lecturerOptions, 
    roomOptions, 
    classOptions 
}: any) => {
    
    const update = (key: string, value: any) => {
        setEditModal((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600"><Edit2 size={16}/></div>
                   Edit Jadwal
                </h3>
                <button onClick={() => setEditModal({...editModal, isOpen: false})} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className={`p-6 flex-1 ${isPopover ? 'overflow-y-auto custom-scrollbar' : ''}`}>
                <div className="space-y-4">
                     <div>
                        <SearchableSelect 
                            label="Mata Kuliah"
                            options={courseOptions}
                            value={editModal.courseId}
                            onChange={(val: string) => update('courseId', val)}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect 
                            label="Kelas"
                            options={classOptions}
                            value={editModal.className}
                            onChange={(val: string) => update('className', val)}
                        />
                         <SearchableSelect 
                            label="Ruangan"
                            options={roomOptions}
                            value={editModal.roomId}
                            onChange={(val: string) => update('roomId', val)}
                        />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect 
                            label="Dosen PJMK"
                            options={[{value: '', label: '-- Open Slot --'}, ...lecturerOptions]}
                            value={editModal.lecturerId}
                            onChange={(val: string) => update('lecturerId', val)}
                        />
                        <SearchableSelect 
                            label="Dosen Anggota"
                            options={[{value: '', label: '-- Kosong --'}, ...lecturerOptions]}
                            value={editModal.teamLecturerId}
                            onChange={(val: string) => update('teamLecturerId', val)}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hari</label>
                          <select 
                            value={editModal.day} 
                            onChange={(e) => update('day', e.target.value)} 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="">Hari</option>
                            {(Object.values(DayOfWeek) as string[]).map((d: string) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam</label>
                          <select 
                            value={editModal.time} 
                            onChange={(e) => update('time', e.target.value)} 
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="">Jam</option>
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                     </div>
                     
                     {editConflicts.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-pulse">
                            <div className="flex items-center gap-2 text-red-700 font-bold mb-1 text-xs">
                                <AlertTriangle size={14} />
                                <span>Konflik Jadwal</span>
                            </div>
                            <ul className="space-y-1">
                                {editConflicts.map((c: string, i: number) => (
                                    <li key={i} className="text-[10px] text-red-600 flex items-start gap-1">
                                        <div className="w-1 h-1 bg-red-400 rounded-full mt-1.5 shrink-0" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                     )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0 rounded-b-2xl">
                <button onClick={() => setEditModal({...editModal, isOpen: false})} className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">Batal</button>
                <button 
                    onClick={handleSaveEdit}
                    disabled={editConflicts.length > 0}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${editConflicts.length > 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}
                >
                    <Save size={16} /> Simpan
                </button>
            </div>
        </div>
    );
};

const ScheduleView: React.FC<ScheduleViewProps> = ({
  courses, lecturers, rooms, classNames, schedule, setSchedule, onAddSchedule, onEditSchedule, onDeleteSchedule, onImportSchedule, onClearSchedule, onSync, onLockAll
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Form State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>(''); // PJMK
  const [selectedTeamLecturerId, setSelectedTeamLecturerId] = useState<string>(''); // Team Member
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | ''>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const [sortBy, setSortBy] = useState<'time' | 'course' | 'class' | 'room'>('time');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
      isOpen: boolean;
      item: ScheduleItem | null;
      courseId: string;
      lecturerId: string;
      teamLecturerId: string;
      roomId: string;
      className: string;
      day: DayOfWeek | '';
      time: string;
  }>({
      isOpen: false,
      item: null,
      courseId: '',
      lecturerId: '',
      teamLecturerId: '',
      roomId: '',
      className: '',
      day: '',
      time: ''
  });

  // Dynamic Position State
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: ScheduleItem | null;
    duplicateCount: number;
    allIds: string[];
  }>({
    isOpen: false,
    item: null,
    duplicateCount: 0,
    allIds: []
  });

  // Clear All Modal
  const [clearAllModal, setClearAllModal] = useState(false);

  const getCourse = (id: string) => courses.find(c => c.id === id);
  const getCourseName = (id: string) => getCourse(id)?.name || id;
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;
  const getLecturerName = (id: string) => lecturers.find(l => l.id === id)?.name || id;

  // Option Mappers for Searchable Select (SORTED A-Z)
  const courseOptions = useMemo(() => courses
    .map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label)), 
  [courses]);

  const lecturerOptions = useMemo(() => lecturers
    .map(l => ({ value: l.id, label: l.name }))
    .sort((a, b) => a.label.localeCompare(b.label)), 
  [lecturers]);

  const roomOptions = useMemo(() => rooms
    .map(r => ({ value: r.id, label: `${r.name} ${r.building ? `(${r.building})` : ''}` }))
    .sort((a, b) => a.label.localeCompare(b.label)), 
  [rooms]);

  const classOptions = useMemo(() => classNames
    .map(c => ({ value: c.name, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label)), 
  [classNames]);

  // --- SMART DEDUPLICATION FOR ADMIN VIEW ---
  // Groups duplicates so Admin sees a clean list, but can operate on all duplicates.
  const groupedSchedule = useMemo(() => {
    const groups = new Map<string, { item: ScheduleItem, ids: string[] }>();
    
    schedule.forEach(item => {
        // Robust Key Generation: Trim values to handle messy input (e.g. "SENIN " vs "SENIN")
        const cId = String(item.courseId || '').trim();
        const cName = String(item.className || '').trim();
        const cDay = String(item.day || '').trim().toUpperCase();
        const cTime = String(item.timeSlot || '').trim();
        const cRoom = String(item.roomId || '').trim();

        const key = `${cId}-${cName}-${cDay}-${cTime}-${cRoom}`;
        
        if (!groups.has(key)) {
            groups.set(key, { item: item, ids: [item.id] });
        } else {
            const entry = groups.get(key)!;
            entry.ids.push(item.id);
            
            // Prefer item with lecturers assigned if current has none
            if ((!entry.item.lecturerIds || entry.item.lecturerIds.length === 0) && (item.lecturerIds && item.lecturerIds.length > 0)) {
                entry.item = item;
            }
        }
    });

    return Array.from(groups.values()).map(g => ({ ...g.item, _duplicateIds: g.ids }));
  }, [schedule]);


  // --- CONFLICT LOGIC (Used for Add) ---
  const currentConflicts = useMemo(() => {
    const conflicts: string[] = [];
    if (!selectedDay || !selectedTime) return conflicts;

    // 1. Cek Ruangan
    if (selectedRoomId) {
      const roomConflict = schedule.find(s => 
        s.day === selectedDay && 
        s.timeSlot === selectedTime && 
        s.roomId === selectedRoomId
      );
      if (roomConflict) conflicts.push(`RUANGAN: ${getRoomName(selectedRoomId)} terisi ${roomConflict.className}`);
    }

    // 2. Cek Kelas (PDB)
    if (selectedClassName) {
      const classConflict = schedule.find(s => 
        s.day === selectedDay && 
        s.timeSlot === selectedTime && 
        s.className === selectedClassName
      );
      if (classConflict) conflicts.push(`KELAS: ${selectedClassName} ada jadwal lain`);
    }

    // 3. Cek Dosen (PJMK dan Team)
    const activeLecturers = [selectedLecturerId, selectedTeamLecturerId].filter(id => id && id !== '');
    activeLecturers.forEach(lid => {
        const lecturerConflict = schedule.find(s => 
            s.day === selectedDay && 
            s.timeSlot === selectedTime && 
            (s.lecturerIds || []).includes(lid)
        );
        if (lecturerConflict) conflicts.push(`DOSEN: ${getLecturerName(lid)} sedang mengajar di kelas ${lecturerConflict.className}`);
    });

    return conflicts;
  }, [selectedDay, selectedTime, selectedRoomId, selectedClassName, selectedLecturerId, selectedTeamLecturerId, schedule, rooms, courses, lecturers]);

  // --- CONFLICT LOGIC (Used for Edit - Excludes current item) ---
  const editConflicts = useMemo(() => {
    const conflicts: string[] = [];
    if (!editModal.isOpen || !editModal.item || !editModal.day || !editModal.time) return conflicts;

    const { day, time, roomId, className, lecturerId, teamLecturerId, item } = editModal;

    // 1. Cek Ruangan
    if (roomId) {
      const roomConflict = schedule.find(s => 
        s.id !== item.id && // EXCLUDE SELF
        s.day === day && 
        s.timeSlot === time && 
        s.roomId === roomId
      );
      if (roomConflict) conflicts.push(`RUANGAN: ${getRoomName(roomId)} terisi ${roomConflict.className}`);
    }

    // 2. Cek Kelas
    if (className) {
      const classConflict = schedule.find(s => 
        s.id !== item.id && 
        s.day === day && 
        s.timeSlot === time && 
        s.className === className
      );
      if (classConflict) conflicts.push(`KELAS: ${className} ada jadwal lain`);
    }

    // 3. Cek Dosen (PJMK dan Team)
    const activeLecturers = [lecturerId, teamLecturerId].filter(id => id && id !== '');
    activeLecturers.forEach(lid => {
        const lecturerConflict = schedule.find(s => 
            s.id !== item.id &&
            s.day === day && 
            s.timeSlot === time && 
            (s.lecturerIds || []).includes(lid)
        );
        if (lecturerConflict) conflicts.push(`DOSEN: ${getLecturerName(lid)} sedang mengajar`);
    });

    return conflicts;
  }, [editModal, schedule]);

  const validateAndAdd = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (currentConflicts.length > 0) {
      setErrorMsg("Tidak dapat menyimpan karena terdeteksi bentrok jadwal.");
      return;
    }

    if (!selectedDay || !selectedTime || !selectedRoomId || !selectedCourseId || !selectedClassName) {
      setErrorMsg("Mohon lengkapi data wajib (MK, Kelas, Ruang, Hari, Jam).");
      return;
    }

    // Validate Lecturer Dupes
    if (selectedLecturerId && selectedTeamLecturerId && selectedLecturerId === selectedTeamLecturerId) {
        setErrorMsg("Dosen Utama dan Dosen Anggota tidak boleh sama.");
        return;
    }

    const lecturerIds = [selectedLecturerId, selectedTeamLecturerId].filter(id => id && id !== '');

    const newItem: ScheduleItem = {
      id: `sch-${Date.now()}`,
      courseId: selectedCourseId,
      lecturerIds: lecturerIds,
      pjmkLecturerId: selectedLecturerId || undefined,
      roomId: selectedRoomId,
      className: selectedClassName,
      day: selectedDay as DayOfWeek,
      timeSlot: selectedTime,
      isLocked: false
    };

    // UPDATE UI IMMEDIATELY (OPTIMISTIC)
    setSchedule([...schedule, newItem]);

    // SEND TO SERVER
    if (onAddSchedule) {
        onAddSchedule(newItem);
    } 

    // Reset Form
    setSelectedCourseId('');
    setSelectedLecturerId('');
    setSelectedTeamLecturerId('');
    setSelectedRoomId('');
    setSelectedClassName('');
    setSelectedDay('');
    setSelectedTime('');
    
    setSuccessMsg(`Berhasil menambahkan jadwal ${newItem.className}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleOpenEdit = (e: React.MouseEvent<HTMLButtonElement>, item: ScheduleItem) => {
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop && containerRef.current) {
        const buttonRect = e.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        const modalWidth = 600; 
        const modalHeightEstimate = 500;
        
        let top = buttonRect.top - containerRect.top;
        let left = buttonRect.left - containerRect.left - modalWidth - 16;
        
        if (buttonRect.left - modalWidth < 20) {
            left = buttonRect.left - containerRect.left + buttonRect.width + 16;
             if (left + modalWidth > containerRect.width) {
                 left = containerRect.width - modalWidth - 20; 
             }
        }

        const spaceBelow = window.innerHeight - buttonRect.bottom;
        if (spaceBelow < modalHeightEstimate && buttonRect.top > modalHeightEstimate) {
            top = top - modalHeightEstimate + buttonRect.height;
        }

        setPopoverStyle({
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            margin: 0,
            zIndex: 70
        });
    } else {
        setPopoverStyle({}); 
    }

    // Parse Lecturers: PJMK is Main, other is Team
    const currentLecturerIds = item.lecturerIds || [];
    let mainLec = item.pjmkLecturerId || '';
    let teamLec = '';

    // If no PJMK marked, try to guess or use order
    if (!mainLec && currentLecturerIds.length > 0) {
        mainLec = currentLecturerIds[0];
    }

    // Find the team member (someone who is in list but not main)
    const teamMember = currentLecturerIds.find(id => id !== mainLec);
    if (teamMember) teamLec = teamMember;

    setEditModal({
          isOpen: true,
          item: item,
          courseId: item.courseId,
          lecturerId: mainLec,
          teamLecturerId: teamLec,
          roomId: item.roomId,
          className: item.className,
          day: item.day,
          time: item.timeSlot
      });
  };

  const handleSaveEdit = () => {
      if (!editModal.item || !onEditSchedule) return;
      
      if (editModal.lecturerId && editModal.teamLecturerId && editModal.lecturerId === editModal.teamLecturerId) {
          alert("Dosen Utama dan Team tidak boleh sama.");
          return;
      }

      const newLecturerIds = [editModal.lecturerId, editModal.teamLecturerId].filter(id => id && id !== '');

      const updatedItem: ScheduleItem = {
          ...editModal.item,
          courseId: editModal.courseId,
          roomId: editModal.roomId,
          className: editModal.className,
          day: editModal.day as DayOfWeek,
          timeSlot: editModal.time,
          lecturerIds: newLecturerIds, 
          pjmkLecturerId: editModal.lecturerId || undefined
      };

      onEditSchedule(updatedItem);
      setEditModal({ ...editModal, isOpen: false });
  };

  // --- GLOBAL LOCK LOGIC ---
  const allLocked = schedule.length > 0 && schedule.every(s => s.isLocked);

  const handleGlobalLock = async () => {
      const newStatus = !allLocked;
      const updatedSchedule = schedule.map(s => ({ ...s, isLocked: newStatus }));
      
      // Optimistic UI update
      setSchedule(updatedSchedule);
      setToast({ message: `Semua jadwal ${newStatus ? 'DIKUNCI' : 'DIBUKA'}`, type: 'success' });

      // Call API (BULK UPDATE)
      if (onLockAll) {
          onLockAll(newStatus);
      }
      
      setTimeout(() => setToast(null), 3000);
  };

  // --- DELETE WITH DUPLICATE DETECTION ---
  const handleDeleteClick = (item: any) => {
    // Check for duplicates in the original schedule
    const ids = item._duplicateIds || [item.id];
    setDeleteModal({ 
        isOpen: true, 
        item: item,
        duplicateCount: ids.length,
        allIds: ids
    });
  };

  const confirmDelete = async () => {
    const { allIds } = deleteModal;
    if (allIds.length === 0) return;

    setIsDeleting(true);

    // 1. Optimistic Update (Immediate Feedback)
    // Remove from local state immediately so user sees them gone
    setSchedule(schedule.filter(s => !allIds.includes(s.id)));
    
    // Close modal immediately
    setDeleteModal({ isOpen: false, item: null, duplicateCount: 0, allIds: [] });
    setToast({ message: `${allIds.length} jadwal berhasil dihapus.`, type: 'success' });

    // 2. Perform API Calls in Background
    if (onDeleteSchedule) {
        // Sequentially delete to avoid overwhelming browser/backend limits
        for (const id of allIds) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Small throttle
            onDeleteSchedule(id);
        }
        
        // 3. Final Sync (Optional, handled by parent usually but good to ensure consistency)
        if (onSync) {
            setTimeout(onSync, 2000); // Sync after a delay
        }
    }
    
    setIsDeleting(false);
    setTimeout(() => setToast(null), 3000);
  };

  // --- CLEAR ALL SCHEDULE LOGIC ---
  const handleClearAll = async () => {
      setIsDeleting(true);
      setClearAllModal(false);
      
      // Optimistic
      setSchedule([]);
      setToast({ message: 'Seluruh jadwal berhasil dihapus.', type: 'success' });

      if (onClearSchedule) {
          await onClearSchedule();
          if (onSync) setTimeout(onSync, 1000);
      }
      
      setIsDeleting(false);
      setTimeout(() => setToast(null), 3000);
  };

  const exportScheduleExcel = () => {
    if (groupedSchedule.length === 0) return;
    const excelData = groupedSchedule.map(s => {
      const course = getCourse(s.courseId);
      const room = rooms.find(r => r.id === s.roomId);
      const lecturerNames = (s.lecturerIds || []).map(id => getLecturerName(id)).join(', ');
      return {
        "Hari": s.day,
        "Waktu": s.timeSlot,
        "Nama Kelas": s.className,
        "Mata Kuliah": course?.name || s.courseId,
        "Kode MK": course?.code || '-',
        "Dosen": lecturerNames || 'Open Slot',
        "Ruangan": room?.name || s.roomId,
        "Status": s.isLocked ? 'Terkunci' : 'Aktif'
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jadwal Kuliah");
    XLSX.writeFile(workbook, `Jadwal_Kuliah_SIMPDB.xlsx`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        if (jsonData.length === 0) { setErrorMsg("File Excel kosong."); return; }
        const newItems: ScheduleItem[] = [];
        jsonData.forEach((row: any) => {
          const day = row['Hari'] || row['Day'];
          const time = row['Waktu'] || row['Time'];
          const className = row['Nama Kelas'] || row['Class'];
          const course = courses.find(c => c.name.toLowerCase() === String(row['Mata Kuliah'] || '').toLowerCase());
          const room = rooms.find(r => r.name.toLowerCase() === String(row['Ruangan'] || '').toLowerCase());
          if (day && time && className && course && room) {
             newItems.push({
               id: `sch-imp-${Date.now()}-${Math.random()}`,
               day: day as DayOfWeek,
               timeSlot: time,
               className: String(className),
               courseId: course.id,
               lecturerIds: [],
               roomId: room.id,
               isLocked: false
             });
          }
        });
        if (onImportSchedule) onImportSchedule(newItems);
        setSuccessMsg(`Berhasil mengimpor ${newItems.length} jadwal.`);
      } catch (error) { setErrorMsg("Gagal membaca file Excel."); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const isPopover = Object.keys(popoverStyle).length > 0;

  return (
    <div ref={containerRef} className="space-y-8 relative animate-fade-in pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl animate-slide-down flex items-center gap-4 max-w-md">
            <div className="bg-green-500 p-2 rounded-full flex-shrink-0">
                <Check className="text-white" size={20} strokeWidth={3} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm text-white">Notifikasi Sistem</h4>
                <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 text-slate-400 hover:text-white transition-colors"><X size={18}/></button>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-slate-800">Penjadwalan Kuliah</h2>
          <div className="flex items-center gap-3 text-sm">
             <span className="text-slate-500">Kelola jadwal kuliah per sesi.</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
          {/* SORT CONTROL */}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 h-[46px]">
              <span className="text-sm font-medium text-slate-500 uppercase flex items-center gap-1"><ArrowUpDown size={14} /> Urutkan:</span>
              <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)} 
                  className="text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                  <option value="time">Waktu</option>
                  <option value="course">Mata Kuliah</option>
                  <option value="class">Kelas</option>
                  <option value="room">Ruangan</option>
              </select>
          </div>

          {/* GLOBAL LOCK BUTTON */}
          {onEditSchedule && schedule.length > 0 && (
              <button 
                onClick={handleGlobalLock}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-95 h-[46px] ${allLocked ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'}`}
                title={allLocked ? "Buka Semua Jadwal" : "Kunci Semua Jadwal"}
              >
                  {allLocked ? <Unlock size={18} /> : <Lock size={18} />} 
                  <span className="hidden sm:inline">{allLocked ? 'Buka Semua' : 'Kunci Semua'}</span>
              </button>
          )}

          {/* CLEAR ALL BUTTON */}
          {onClearSchedule && (
              <button 
                onClick={() => setClearAllModal(true)}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-4 py-2.5 rounded-xl border border-red-100 font-bold text-sm transition-all active:scale-95 h-[46px]"
                title="Hapus Semua Jadwal"
              >
                  <Trash2 size={18} /> <span className="hidden sm:inline">Hapus Semua</span>
              </button>
          )}
        </div>
      </div>

      {/* Add Schedule Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Plus size={16}/></div>
           Tambah Jadwal Baru
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <SearchableSelect 
                label="Mata Kuliah"
                options={courseOptions}
                value={selectedCourseId}
                onChange={setSelectedCourseId}
                placeholder="-- Pilih Mata Kuliah --"
              />
            </div>
            <div>
              <SearchableSelect 
                label="Kelas"
                options={classOptions}
                value={selectedClassName}
                onChange={setSelectedClassName}
                placeholder="-- Pilih Kelas --"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <SearchableSelect 
                label="Ruangan"
                options={roomOptions}
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                placeholder="-- Pilih Ruangan --"
              />
            </div>
            {/* Split Dosen Section */}
            <div className="grid grid-cols-1 gap-2">
                <div>
                    <SearchableSelect 
                        label="Dosen Inisiator (PJMK)"
                        options={[{value: '', label: '-- Open Slot --'}, ...lecturerOptions]}
                        value={selectedLecturerId}
                        onChange={setSelectedLecturerId}
                        placeholder="-- Open Slot --"
                    />
                </div>
                <div>
                    <SearchableSelect 
                        label="Dosen Anggota (Team)"
                        options={[{value: '', label: '-- Kosong --'}, ...lecturerOptions]}
                        value={selectedTeamLecturerId}
                        onChange={setSelectedTeamLecturerId}
                        placeholder="-- Kosong --"
                    />
                </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
             <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hari</label>
                  <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm">
                    <option value="">Hari</option>
                    {(Object.values(DayOfWeek) as string[]).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam</label>
                  <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm">
                    <option value="">Jam</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
             </div>
             <button 
                onClick={validateAndAdd}
                disabled={currentConflicts.length > 0}
                className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${currentConflicts.length > 0 ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
              >
                <CalendarPlus size={18} /> Simpan Jadwal
              </button>
          </div>
        </div>

        {/* REAL-TIME CONFLICT NOTIFICATION */}
        {currentConflicts.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl animate-shake">
            <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
              <AlertTriangle size={18} />
              <span className="text-sm">Terdeteksi Bentrok Jadwal!</span>
            </div>
            <ul className="space-y-1">
              {currentConflicts.map((c, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Schedule List - USING GROUPED SCHEDULE */}
      <div className="space-y-8">
        {(Object.values(DayOfWeek) as string[]).map((day) => {
          const dayItems = groupedSchedule // USE GROUPED DATA HERE
            .filter((s) => String(s.day || '').trim().toUpperCase() === String(day).toUpperCase()) // ROBUST FILTER
            .sort((a, b) => {
               if (sortBy === 'course') {
                   const cmp = getCourseName(a.courseId).localeCompare(getCourseName(b.courseId));
                   if (cmp !== 0) return cmp;
               } else if (sortBy === 'class') {
                   const cmp = a.className.localeCompare(b.className);
                   if (cmp !== 0) return cmp;
               } else if (sortBy === 'room') {
                   const cmp = getRoomName(a.roomId).localeCompare(getRoomName(b.roomId));
                   if (cmp !== 0) return cmp;
               }
               
               const timeCompare = TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot);
               if (timeCompare !== 0) return timeCompare;
               
               const nameA = getCourseName(a.courseId).toLowerCase();
               const nameB = getCourseName(b.courseId).toLowerCase();
               const courseCompare = nameA.localeCompare(nameB);
               if (courseCompare !== 0) return courseCompare;
               
               return a.className.localeCompare(b.className);
            });

          return (
             <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><Calendar className="text-blue-600" size={20}/> {day}</h3>
                   <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">{dayItems.length} Kelas</span>
                </div>
                <div className="divide-y divide-slate-100">
                   {dayItems.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2"><Calendar className="opacity-20" size={48} /><span className="text-sm">Kosong.</span></div>
                   ) : (
                      dayItems.map(item => (
                        <div key={item.id} className={`p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-4 group ${item.isLocked ? 'bg-slate-50/50' : ''}`}>
                           <div className="md:w-1/4 flex items-start gap-4">
                              <div className={`p-2.5 rounded-xl font-bold text-xs text-center min-w-[80px] ${item.isLocked ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                                  <Clock size={16} className="mx-auto mb-1 opacity-70"/>{item.timeSlot}
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Kelas</div>
                                <div className="flex items-center gap-2">
                                    <div className="text-lg font-black text-slate-800">{item.className}</div>
                                    {/* DUPLICATE BADGE */}
                                    {item._duplicateIds && item._duplicateIds.length > 1 && (
                                        <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-1">
                                            <Layers size={8} /> {item._duplicateIds.length}X Duplikat
                                        </span>
                                    )}
                                </div>
                              </div>
                           </div>
                           <div className="md:w-1/3">
                              <div className="flex items-center gap-2 mb-1">
                                  <BookOpen size={14} className="text-slate-400" />
                                  <span className="font-bold text-slate-800 text-sm line-clamp-1">{getCourseName(item.courseId)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Building2 size={12}/>
                                  <span>Ruang <span className="font-bold text-slate-700">{getRoomName(item.roomId)}</span></span>
                              </div>
                           </div>
                           <div className="md:flex-1">
                              <div className="flex flex-col gap-1">
                                {item.isLocked ? (
                                    <div className="flex items-center gap-2 text-red-500 text-xs font-bold border border-red-200 bg-red-50 w-fit px-2 py-1 rounded">
                                        <Lock size={12} /> JADWAL DIKUNCI
                                    </div>
                                ) : (
                                    (item.lecturerIds || []).length > 0 ? (
                                    (item.lecturerIds || []).map(lid => (
                                        <div key={lid} className="flex items-center gap-2 text-sm text-slate-600">
                                        <Users size={14} className={lid === item.pjmkLecturerId ? "text-amber-500" : "text-slate-400"} />
                                        <span className={lid === item.pjmkLecturerId ? "font-semibold text-slate-800" : ""}>{getLecturerName(lid)}</span>
                                        </div>
                                    ))
                                    ) : (
                                    <div className="flex items-center gap-2 text-amber-600 italic text-sm"><UserMinus size={16} /> Open Slot</div>
                                    )
                                )}
                              </div>
                           </div>
                           <div className="md:w-auto flex justify-end gap-2">
                              {onEditSchedule && (
                                <button onClick={(e) => handleOpenEdit(e, item)} className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all">
                                    <Edit2 size={18} />
                                </button>
                              )}
                              <button onClick={() => handleDeleteClick(item)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          );
        })}
      </div>

      {/* EDIT MODAL SYSTEM */}
      {editModal.isOpen && editModal.item && (
        <>
            {/* Backdrop */}
            <div className={`fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm animate-fade-in ${isPopover ? 'cursor-default' : 'flex items-center justify-center'}`} onClick={() => setEditModal({...editModal, isOpen: false})}>
                
                {!isPopover && (
                   <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-slide-down border border-slate-100 mx-4" onClick={e => e.stopPropagation()}>
                        <EditForm 
                           editModal={editModal} 
                           setEditModal={setEditModal} 
                           handleSaveEdit={handleSaveEdit} 
                           editConflicts={editConflicts} 
                           courses={courses} 
                           classNames={classNames} 
                           rooms={rooms} 
                           lecturers={lecturers}
                           isPopover={false}
                           courseOptions={courseOptions}
                           lecturerOptions={lecturerOptions}
                           roomOptions={roomOptions}
                           classOptions={classOptions}
                        />
                   </div>
                )}
            </div>

            {isPopover && (
                <div 
                   className="absolute bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-down border border-slate-100"
                   style={popoverStyle}
                >
                     <EditForm 
                        editModal={editModal} 
                        setEditModal={setEditModal} 
                        handleSaveEdit={handleSaveEdit} 
                        editConflicts={editConflicts} 
                        courses={courses} 
                        classNames={classNames} 
                        rooms={rooms} 
                        lecturers={lecturers}
                        isPopover={true}
                        courseOptions={courseOptions}
                        lecturerOptions={lecturerOptions}
                        roomOptions={roomOptions}
                        classOptions={classOptions}
                     />
                </div>
            )}
        </>
      )}

      {deleteModal.isOpen && deleteModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}></div>
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-slide-down">
              <div className="bg-red-50 p-6 flex items-center justify-between border-b border-red-100">
                 <h3 className="text-lg font-bold text-slate-800">Hapus Jadwal?</h3>
                 <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="text-slate-400"><X size={24} /></button>
              </div>
              <div className="p-8">
                <p className="text-slate-600 text-sm mb-4">Hapus jadwal <strong>{getCourseName(deleteModal.item.courseId)}</strong> untuk kelas <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-800">{deleteModal.item.className}</span>?</p>
                
                {deleteModal.duplicateCount > 1 && (
                    <div className="bg-red-100 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                        <strong>PERHATIAN:</strong> Ditemukan <strong>{deleteModal.duplicateCount}</strong> data duplikat (kembar) untuk jadwal ini. Menghapus satu akan menghapus semuanya sekaligus.
                    </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 flex gap-4 border-t border-slate-100">
                 <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 px-4 py-3 rounded-2xl text-slate-600 font-bold text-sm" disabled={isDeleting}>Batal</button>
                 <button onClick={confirmDelete} className="flex-1 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50" disabled={isDeleting}>
                    {isDeleting ? 'Menghapus...' : (deleteModal.duplicateCount > 1 ? 'Hapus Semua' : 'Hapus')}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRMATION MODAL */}
      {clearAllModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setClearAllModal(false)}></div>
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-slide-down border-4 border-red-100">
              <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-sm border border-red-200">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800">HAPUS SEMUA JADWAL?</h3>
                 <p className="text-red-600 text-sm font-bold mt-2 bg-red-100 px-3 py-1 rounded-full">TINDAKAN BERBAHAYA</p>
              </div>
              <div className="p-8">
                <p className="text-slate-600 text-sm leading-relaxed text-center">
                    Anda akan menghapus <strong>SELURUH DATA JADWAL</strong> yang ada di sistem. <br/><br/>
                    Data yang dihapus <strong>TIDAK DAPAT DIKEMBALIKAN</strong>. Pastikan Anda sudah melakukan backup (Export Excel) terlebih dahulu.
                </p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-4 border-t border-slate-100">
                 <button onClick={() => setClearAllModal(false)} className="flex-1 px-4 py-3 rounded-2xl text-slate-600 font-bold text-sm bg-white border border-slate-200 hover:bg-slate-100" disabled={isDeleting}>Batalkan</button>
                 <button onClick={handleClearAll} className="flex-1 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-200 active:scale-95 transition-all" disabled={isDeleting}>
                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus Semuanya'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default ScheduleView;