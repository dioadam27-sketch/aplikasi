import React, { useState, useEffect } from 'react';
import { TIME_SLOTS, SUBJECTS, PDB_CLASSES } from '../constants_pdb';
import { Room, Booking, AppState, Student, UserRole } from '../types_pdb';
import { ETicket } from '../arsip/components/ETicket';
import { 
  Building2, 
  CalendarDays, 
  ChevronRight, 
  Clock, 
  GraduationCap, 
  Users,
  Search,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MapPin,
  Lock,
  LogOut,
  UserCircle,
  ShieldCheck,
  ListChecks,
  Plus,
  Trash2,
  Layout,
  BookOpen,
  AlertTriangle,
  BookMarked,
  CheckCircle,
  WifiOff,
  Settings,
  Save,
  Globe,
  Info,
  Ban,
  X
} from 'lucide-react';

// --- HELPER FUNCTIONS FOR TIME OVERLAP ---
const getMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const checkOverlap = (slot1: string, slot2: string) => {
  try {
    const [start1Str, end1Str] = slot1.split(' - ');
    const [start2Str, end2Str] = slot2.split(' - ');
    
    if (!start1Str || !end1Str || !start2Str || !end2Str) return false;

    const start1 = getMinutes(start1Str);
    const end1 = getMinutes(end1Str);
    const start2 = getMinutes(start2Str);
    const end2 = getMinutes(end2Str);

    // Logic: (StartA < EndB) and (EndA > StartB)
    return Math.max(start1, start2) < Math.min(end1, end2);
  } catch (e) {
    console.error("Error parsing time slot", e);
    return false;
  }
};

const App = ({ onBack }: { onBack: () => void }) => {
  // --- CONFIGURATION STATE ---
  // Default ke URL pusat
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const saved = localStorage.getItem('pdb_api_url');
    if (saved && saved.startsWith('http')) return saved;
    return 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php';
  });

  // --- GLOBAL SETTINGS MODAL STATE ---
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempGlobalApiUrl, setTempGlobalApiUrl] = useState(apiUrl);

  // --- AUTH STATE ---
  const [userRole, setUserRole] = useState<UserRole>('GUEST');
  const [loginTab, setLoginTab] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- APP STATE ---
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedBooking, setGeneratedBooking] = useState<Booking | null>(null);
  
  // --- DELETE MODAL STATE ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const [showDeleteBookingModal, setShowDeleteBookingModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  // --- ROOM MANAGEMENT STATE ---
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  
  // --- CONNECTION STATE ---
  const [isBackendError, setIsBackendError] = useState(false);

  // --- DATA STORE ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // --- ADMIN STATE ---
  const [adminView, setAdminView] = useState<'DASHBOARD' | 'ROOMS' | 'SETTINGS'>('DASHBOARD');
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', location: '' });
  
  // Admin Settings Form State
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);

  // --- FORM STATE ---
  const [formData, setFormData] = useState<Student>({
    name: '',
    nim: '',
    pdbClass: '',
    subject: '',
    contact: ''
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[0]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Helper to ensure clean URL without trailing slash
  const getBaseUrl = () => apiUrl.replace(/\/+$/, '');

  // --- DATA FETCHING ---
  // Refetch data whenever apiUrl changes
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [apiUrl]);

  const fetchRooms = async () => {
    try {
      setIsBackendError(false);
      // Use query param action instead of path
      const res = await fetch(`${getBaseUrl()}?action=fetch_pdb_rooms`);
      if (res.ok) {
        const data = await res.json();
        // Check if array before setting
        if (Array.isArray(data)) {
            setRooms(data);
        } else {
            console.error("Fetch Rooms: Data is not an array", data);
            setRooms([]);
        }
      } else {
        throw new Error("Server responded with error");
      }
    } catch (error) {
      console.error("Failed to fetch rooms", error);
      setIsBackendError(true);
      setRooms([]);
    }
  };

  const fetchBookings = async () => {
    try {
      // Use query param action instead of path
      const res = await fetch(`${getBaseUrl()}?action=fetch_pdb_bookings`);
      if (res.ok) {
        const data = await res.json();
        // Check if array before setting
        if (Array.isArray(data)) {
            setAllBookings(data);
        } else {
            console.error("Fetch Bookings: Data is not an array", data);
            setAllBookings([]);
        }
      } else {
        setAllBookings([]);
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
      setAllBookings([]);
    }
  };

  // --- AUTH HANDLERS ---

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.nim && formData.pdbClass && formData.subject) {
      setUserRole('STUDENT');
      setAppState(AppState.HOME);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '112233') {
      setUserRole('ADMIN');
      setLoginError('');
      setAdminPassword('');
    } else {
      setLoginError('Password salah. Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    setUserRole('GUEST');
    setAppState(AppState.HOME);
    setGeneratedBooking(null);
    setFormData({
      name: '',
      nim: '',
      pdbClass: '',
      subject: '',
      contact: ''
    });
  };

  // --- SETTINGS HANDLERS ---
  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Remove trailing slash if exists to avoid double slash issues
    const urlToSave = tempApiUrl || tempGlobalApiUrl;
    const cleanUrl = urlToSave.replace(/\/$/, "");
    localStorage.setItem('pdb_api_url', cleanUrl);
    setApiUrl(cleanUrl);
    setShowConfigModal(false);
    alert("Konfigurasi API berhasil disimpan! Data akan dimuat ulang.");
  };

  // --- ADMIN ROOM MANAGEMENT ---

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Input
    if (!newRoom.name || !newRoom.capacity || !newRoom.location) {
        alert("Mohon lengkapi semua data ruangan (Nama, Kapasitas, dan Lokasi).");
        return;
    }

    const capacityInt = parseInt(newRoom.capacity);
    if (isNaN(capacityInt) || capacityInt <= 0) {
        alert("Kapasitas harus berupa angka yang valid.");
        return;
    }

    setIsSavingRoom(true);

    const room: Room = {
      id: 'ROOM-' + Date.now(),
      name: newRoom.name,
      capacity: capacityInt,
      location: newRoom.location,
      isAvailable: true
    };
    
    try {
      // Use query param action
      const res = await fetch(`${getBaseUrl()}?action=pdb_create_room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });

      if (res.ok) {
        setRooms([...rooms, room]);
        setNewRoom({ name: '', capacity: '', location: '' });
        
        // Show Success Notification
        setShowSuccessNotification(true);
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
      } else {
        // Handle API Error
        const errorData = await res.text();
        console.error("Server Error:", errorData);
        alert("Gagal menyimpan ruangan. Server merespon dengan error.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Gagal menghubungi server. Pastikan API URL benar pada menu Pengaturan.");
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setRoomToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteRoom = async () => {
    if (roomToDelete) {
      try {
        const res = await fetch(`${getBaseUrl()}?action=pdb_delete_room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: roomToDelete })
        });

        if (res.ok) {
          setRooms(rooms.filter(r => r.id !== roomToDelete));
          setShowDeleteModal(false);
          setRoomToDelete(null);
        } else {
          alert("Gagal menghapus ruangan. Silakan coba lagi.");
        }
      } catch (error) {
        alert("Gagal menghubungi server saat menghapus.");
      }
    }
  };

  // --- ADMIN BOOKING DELETE HANDLERS ---
  const handleDeleteBookingClick = (id: string) => {
    setBookingToDelete(id);
    setShowDeleteBookingModal(true);
  };

  const confirmDeleteBooking = async () => {
    if (bookingToDelete) {
      try {
        const res = await fetch(`${getBaseUrl()}?action=pdb_delete_booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bookingToDelete })
        });

        if (res.ok) {
          setAllBookings(allBookings.filter(b => b.id !== bookingToDelete));
          setShowDeleteBookingModal(false);
          setBookingToDelete(null);
        } else {
          alert("Gagal menghapus pemesanan. Silakan coba lagi.");
        }
      } catch (error) {
        alert("Gagal menghubungi server saat menghapus.");
      }
    }
  };

  // --- STUDENT BOOKING LOGIC ---

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    // Double check availability before submitting
    const isBooked = Array.isArray(allBookings) && allBookings.some(b => 
      b.room.id === selectedRoomId &&
      b.date === selectedDate &&
      checkOverlap(b.timeSlot, selectedTime)
    );

    if (isBooked) {
      alert("Maaf, ruangan ini baru saja dipesan oleh orang lain di jam yang sama.");
      // Refresh data
      fetchBookings();
      return;
    }

    setIsProcessing(true);

    try {
      const selectedRoom = rooms.find(r => r.id === selectedRoomId);
      if (!selectedRoom) throw new Error("Room not found");

      const bookingId = Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const aiMessage = "Semangat kuliahnya!";

      const newBooking: Booking = {
        id: bookingId,
        room: selectedRoom,
        student: { ...formData },
        date: selectedDate,
        timeSlot: selectedTime,
        timestamp: Date.now(),
        status: 'APPROVED',
        aiMessage
      };

      // Save to API
      const res = await fetch(`${getBaseUrl()}?action=pdb_create_booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });

      if (res.ok) {
        setAllBookings([newBooking, ...(Array.isArray(allBookings) ? allBookings : [])]);
        setGeneratedBooking(newBooking);
        setAppState(AppState.TICKET);
      } else {
        throw new Error("API Save failed");
      }
    } catch (error) {
      console.error("Booking error", error);
      alert("Terjadi kesalahan saat memproses booking. Periksa koneksi internet anda.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderBackendError = () => (
    <div className="bg-red-500 text-white p-4 text-center sticky top-0 z-[60] shadow-lg animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
      <div className="flex items-center gap-2">
        <WifiOff size={20} />
        <span>
            <strong>Gagal Terhubung ke Server!</strong>
        </span>
      </div>
      <div className="flex gap-2">
        <button 
            onClick={() => { setTempGlobalApiUrl(apiUrl); setShowConfigModal(true); }}
            className="px-3 py-1 bg-white/20 text-white border border-white/40 rounded-lg text-sm font-bold hover:bg-white/30 flex items-center gap-2"
        >
            <Settings size={14} /> Konfigurasi Server
        </button>
        <button 
            onClick={() => { fetchRooms(); fetchBookings(); }}
            className="px-3 py-1 bg-white text-red-600 rounded-lg text-sm font-bold hover:bg-gray-100"
        >
            Coba Lagi
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4 py-8">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl animate-fade-in-up flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Back button specific for login */}
        <button 
            onClick={onBack} 
            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-gray-600 font-bold text-xs hover:bg-white hover:text-blue-600 transition-all shadow-sm group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Portal</span>
        </button>

        {/* Left Side (Branding) - THEME UPDATE */}
        <div className="w-full md:w-5/12 bg-[#003B73] p-8 md:p-12 flex flex-col justify-center items-center text-center relative">
           {/* Decorative Background Circles */}
           <div className="absolute top-0 left-0 w-32 h-32 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 translate-x-1/2 translate-y-1/2"></div>

           <div className="relative z-10">
              <div className="mx-auto bg-[#FFC107] w-24 h-24 rounded-2xl flex items-center justify-center mb-6 text-[#003B73] shadow-xl shadow-blue-950/20">
                <Building2 size={48} strokeWidth={2} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Selamat Datang</h1>
              <p className="text-blue-200 text-lg font-medium leading-relaxed">
                Sistem Pemesanan<br/>Ruang PDB
              </p>
           </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-7/12 flex flex-col h-full bg-white">
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setLoginTab('STUDENT')}
              className={`flex-1 py-5 text-sm font-bold transition-all flex items-center justify-center gap-2
                ${loginTab === 'STUDENT' ? 'text-[#003B73] border-b-2 border-[#003B73] bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            >
              <UserCircle size={18} /> Mahasiswa
            </button>
            <button 
               onClick={() => setLoginTab('ADMIN')}
               className={`flex-1 py-5 text-sm font-bold transition-all flex items-center justify-center gap-2
                ${loginTab === 'ADMIN' ? 'text-[#003B73] border-b-2 border-[#003B73] bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            >
              <ShieldCheck size={18} /> Admin
            </button>
          </div>

          <div className="p-8 md:p-10 flex-1 overflow-y-auto">
            {loginTab === 'STUDENT' ? (
              <form onSubmit={handleStudentLogin} className="space-y-5">
                {/* Pemberitahuan Penting */}
                <div className="bg-[#FFC107]/10 border border-[#FFC107]/30 rounded-xl p-4 flex gap-3 items-start shadow-sm">
                    <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="font-bold text-amber-900 text-sm mb-1">Pemberitahuan Penting</h3>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Aplikasi ini khusus digunakan untuk mengajukan Ganti Jadwal Perkuliahan (Kuliah Pengganti) bagi mata kuliah yang tidak dapat dilaksanakan sesuai jadwal reguler.
                      </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah PDB</label>
                    <div className="relative">
                      <select 
                        required
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#003B73] outline-none appearance-none bg-white text-gray-800 transition-shadow focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Pilih Mata Kuliah</option>
                        {SUBJECTS.map((sub) => (
                          <option key={sub.code} value={`${sub.code} - ${sub.name}`}>
                            {sub.code} - {sub.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-3.5 text-gray-400 pointer-events-none">
                        <BookMarked size={18} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas PDB</label>
                    <div className="relative">
                      <select 
                        required
                        value={formData.pdbClass}
                        onChange={e => setFormData({...formData, pdbClass: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#003B73] outline-none appearance-none bg-white text-gray-800 transition-shadow focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Pilih Kelas</option>
                        {PDB_CLASSES.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-3.5 text-gray-400 pointer-events-none">
                        <Users size={18} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input 
                      required
                      type="text"
                      placeholder="Masukkan nama anda"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#003B73] outline-none bg-white text-gray-900 transition-shadow focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
                    <input 
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="Masukkan NIM anda"
                      value={formData.nim}
                      onChange={e => setFormData({...formData, nim: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#003B73] outline-none bg-white text-gray-900 transition-shadow focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <button className="w-full py-4 bg-[#FFC107] hover:bg-[#FDB913] text-[#003B73] font-bold rounded-xl mt-6 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2">
                  <span>Masuk Sistem</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-6 flex flex-col justify-center h-full">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Login Administrator</h3>
                  <p className="text-gray-500 text-sm">Masuk untuk mengelola ruangan dan jadwal</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Admin</label>
                  <div className="relative">
                    <input 
                      required
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#003B73] outline-none pl-10 bg-white text-gray-900 transition-shadow focus:ring-4 focus:ring-blue-50"
                      placeholder="Masukkan password"
                    />
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  </div>
                  {loginError && <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded-lg">{loginError}</p>}
                </div>
                <button className="w-full py-4 bg-[#003B73] hover:bg-[#002b55] text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200">
                  Login Admin
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Admin Nav Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          onClick={() => setAdminView('DASHBOARD')}
          className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all ${adminView === 'DASHBOARD' ? 'bg-[#003B73] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          Dashboard Pemesanan
        </button>
        <button 
          onClick={() => setAdminView('ROOMS')}
          className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all ${adminView === 'ROOMS' ? 'bg-[#003B73] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          Kelola Ruangan
        </button>
        <button 
          onClick={() => setAdminView('SETTINGS')}
          className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${adminView === 'SETTINGS' ? 'bg-[#003B73] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          <Settings size={16} /> Pengaturan
        </button>
      </div>

      {adminView === 'DASHBOARD' && (
        // DASHBOARD VIEW
        <>
          <div className="bg-blue-100 text-blue-900 px-6 py-4 rounded-xl font-bold mb-6 flex justify-between items-center border border-blue-200">
             <span>Daftar Pemesanan Masuk</span>
             <span className="bg-white px-3 py-1 rounded-lg text-sm">{Array.isArray(allBookings) ? allBookings.length : 0} Total</span>
          </div>

          {!Array.isArray(allBookings) || allBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
               <ListChecks size={48} className="mx-auto text-gray-300 mb-4" />
               <p className="text-gray-500">Belum ada pemesanan yang masuk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group">
                   <div className="flex justify-between items-start mb-4">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">
                        {booking.room.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono">#{booking.id.split('-')[0]}</span>
                        <button 
                            onClick={() => handleDeleteBookingClick(booking.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            title="Hapus Pemesanan"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                   </div>
                   
                   <h3 className="font-bold text-lg text-gray-800 mb-1">{booking.student.name}</h3>
                   <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold">
                          <Users size={12} /> {booking.student.pdbClass}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600 font-medium truncate" title={booking.student.subject}>
                          <BookMarked size={12} /> {booking.student.subject}
                      </div>
                   </div>
                   
                   <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <GraduationCap size={14} />
                        <span>{booking.student.nim}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays size={14} />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} />
                        <span>{booking.timeSlot}</span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {adminView === 'ROOMS' && (
        // ROOM MANAGEMENT VIEW
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Add Room Form */}
           <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
                 
                 {/* Success Notification */}
                 {showSuccessNotification && (
                    <div className="mb-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                       <CheckCircle size={20} />
                       <span className="font-medium text-sm">Ruangan berhasil disimpan!</span>
                    </div>
                 )}

                 <h3 className="font-bold text-xl text-[#003B73] mb-4 flex items-center gap-2">
                    <Plus size={20}/> Tambah Ruangan
                 </h3>
                 <form onSubmit={handleAddRoom} className="space-y-4">
                    <div>
                       <label className="text-sm font-medium text-gray-700">Nama Ruangan</label>
                       <input 
                          required
                          type="text"
                          placeholder="Contoh: Nano 8.01"
                          value={newRoom.name}
                          onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none bg-white text-gray-900"
                       />
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">Kapasitas (Orang)</label>
                       <input 
                          required
                          type="number"
                          placeholder="50"
                          value={newRoom.capacity}
                          onChange={e => setNewRoom({...newRoom, capacity: e.target.value})}
                          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none bg-white text-gray-900"
                       />
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">Lokasi / Lantai</label>
                       <input 
                          required
                          type="text"
                          placeholder="Contoh: Lantai 8 Sayap Barat"
                          value={newRoom.location}
                          onChange={e => setNewRoom({...newRoom, location: e.target.value})}
                          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none bg-white text-gray-900"
                       />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSavingRoom}
                      className="w-full bg-[#FFC107] hover:bg-[#FDB913] text-[#003B73] font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                       {isSavingRoom ? (
                         <>
                           <Loader2 size={20} className="animate-spin" />
                           <span>Menyimpan...</span>
                         </>
                       ) : (
                         "Simpan Ruangan"
                       )}
                    </button>
                 </form>
              </div>
           </div>

           {/* Room List */}
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map(room => (
                 <div key={room.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between group">
                    <div>
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xl font-bold text-gray-800">{room.name}</h4>
                          <span className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-md font-mono">
                             ID: {room.id.split('-').pop()}
                          </span>
                       </div>
                       <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                          <MapPin size={14}/> {room.location}
                       </p>
                       <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg inline-block">
                          <Users size={16} />
                          <span className="font-semibold">{room.capacity} Kursi</span>
                       </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                       <button 
                          onClick={() => handleDeleteClick(room.id)}
                          className="text-red-400 hover:text-red-600 flex items-center gap-1 text-sm font-medium transition-colors"
                       >
                          <Trash2 size={16} /> Hapus
                       </button>
                    </div>
                 </div>
              ))}
              {rooms.length === 0 && (
                 <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <Layout size={32} className="mx-auto mb-2 opacity-50"/>
                    <p>Belum ada ruangan yang dibuat.</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {adminView === 'SETTINGS' && (
         <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
               <h3 className="font-bold text-xl text-[#003B73] mb-6 flex items-center gap-2">
                  <Settings size={22} /> Konfigurasi Sistem
               </h3>
               
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-sm text-blue-900 mb-1 flex items-center gap-2">
                    <Globe size={16}/> API Endpoint
                  </h4>
                  <p className="text-sm text-blue-800">
                    Tentukan URL backend tempat file <code>api.php</code> berada. URL ini digunakan untuk menyimpan dan mengambil data ruangan serta pemesanan.
                  </p>
               </div>

               <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      API URL (Backend PHP)
                    </label>
                    <div className="relative">
                      <input 
                        type="url" 
                        required
                        value={tempApiUrl}
                        onChange={(e) => setTempApiUrl(e.target.value)}
                        placeholder="Contoh: https://domain-anda.com/api.php"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#003B73] focus:ring-2 focus:ring-blue-100 outline-none text-gray-800"
                      />
                      <Globe className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Pastikan URL lengkap termasuk protokol (http/https) dan nama file (api.php) jika diperlukan.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                     <button 
                        type="submit"
                        className="bg-[#003B73] hover:bg-[#002b55] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                     >
                        <Save size={18} /> Simpan Konfigurasi
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );

  const renderStudentHome = () => (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in flex flex-col items-center text-center">
        <div className="mb-8 p-6 bg-white rounded-full shadow-xl shadow-blue-100 border border-blue-50">
          <Building2 size={64} className="text-[#003B73]" strokeWidth={1.5} />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-[#003B73] mb-6 tracking-tight">
          Sistem Pemesanan Ruang PDB
        </h2>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Halo, <span className="font-bold text-[#003B73]">{formData.name}</span>!
        </p>
        <div className="flex flex-col md:flex-row gap-2 justify-center items-center mb-10 text-sm text-gray-600">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">{formData.pdbClass}</span>
            <span className="hidden md:inline">•</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">{formData.subject.split('-')[1] || formData.subject}</span>
        </div>

        <button
          onClick={() => setAppState(AppState.BOOKING)}
          className="group relative px-8 py-4 bg-[#FFC107] hover:bg-[#FDB913] text-[#003B73] text-lg font-bold rounded-2xl shadow-lg shadow-amber-200 transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center gap-3"
        >
          <span>Mulai Pemesanan</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="mt-12 p-6 bg-[#003B73]/5 rounded-2xl max-w-2xl text-sm text-[#003B73] leading-relaxed border border-[#003B73]/10">
           <h3 className="font-bold mb-2 flex items-center justify-center gap-2"><MapPin size={16}/> Informasi Gedung Nano</h3>
           <p>Gunakan ruangan yang sesuai dengan kapasitas kelas Anda. Pastikan menjaga kebersihan ruangan selama penggunaan.</p>
        </div>
      </div>
  );

  const renderBookingForm = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <button 
        onClick={() => setAppState(AppState.HOME)}
        className="mb-6 flex items-center text-gray-500 hover:text-[#003B73] transition-colors"
      >
        <ChevronRight className="rotate-180 mr-1" size={20} />
        Kembali
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Left Column: Form Details */}
         <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h3 className="font-bold text-[#003B73] mb-4 flex items-center gap-2">
                  <CalendarDays size={18} /> Waktu & Tanggal
               </h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Tanggal</label>
                    <input 
                      required
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        setSelectedDate(e.target.value);
                        setSelectedRoomId(''); // Reset selection on date change
                      }}
                      onClick={(e) => {
                         try {
                           if ('showPicker' in e.currentTarget) {
                             (e.currentTarget as HTMLInputElement).showPicker();
                           }
                         } catch (error) {
                           // Ignore
                         }
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-white text-gray-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Waktu</label>
                    <select
                      value={selectedTime}
                      onChange={e => {
                        setSelectedTime(e.target.value);
                        setSelectedRoomId(''); // Reset selection on time change
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-white text-gray-900"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
               </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
               <h3 className="font-bold text-blue-900 mb-2">Data Pemohon</h3>
               <div className="space-y-2 text-sm text-blue-800">
                  <p><span className="opacity-60 block text-xs">Nama:</span> {formData.name}</p>
                  <p><span className="opacity-60 block text-xs">NIM:</span> {formData.nim}</p>
                  <p><span className="opacity-60 block text-xs">Kelas:</span> {formData.pdbClass}</p>
                  <p className="border-t border-blue-200 pt-1 mt-1"><span className="opacity-60 block text-xs">Mata Kuliah:</span> {formData.subject}</p>
               </div>
            </div>
         </div>

         {/* Right Column: Room Selection */}
         <div className="md:col-span-2">
            <h3 className="font-bold text-2xl text-[#003B73] mb-6">Pilih Ruangan</h3>
            
            {rooms.length === 0 ? (
               <div className="bg-white p-8 rounded-2xl text-center border border-gray-200">
                  <p className="text-gray-500">Belum ada ruangan yang tersedia. Silakan hubungi Admin untuk menambah ruangan atau periksa koneksi API.</p>
               </div>
            ) : (
               <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                     {rooms.map(room => {
                        // Check if room is booked for the selected date and time (including overlaps)
                        const isBooked = Array.isArray(allBookings) && allBookings.some(b => 
                           b.room.id === room.id &&
                           b.date === selectedDate &&
                           checkOverlap(b.timeSlot, selectedTime)
                        );

                        return (
                        <label 
                           key={room.id} 
                           className={`relative flex items-center p-4 rounded-xl border-2 transition-all
                              ${isBooked 
                                ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed' 
                                : selectedRoomId === room.id 
                                   ? 'border-[#FFC107] bg-[#FFC107]/10 ring-2 ring-[#FFC107]/30 ring-opacity-50 cursor-pointer' 
                                   : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50 cursor-pointer'
                              }`}
                        >
                           <input 
                              type="radio" 
                              name="room" 
                              value={room.id}
                              checked={selectedRoomId === room.id}
                              onChange={() => setSelectedRoomId(room.id)}
                              disabled={isBooked}
                              className="absolute opacity-0"
                           />
                           <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                 <span className={`font-bold text-lg ${isBooked ? 'text-gray-500' : 'text-gray-800'}`}>{room.name}</span>
                                 <div className="flex gap-2">
                                     <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isBooked ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'}`}>
                                        <Users size={12} /> {room.capacity}
                                     </span>
                                     {isBooked && (
                                         <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold flex items-center gap-1">
                                             <Ban size={12} /> IN USE
                                         </span>
                                     )}
                                 </div>
                              </div>
                              <p className={`text-sm flex items-center gap-1 ${isBooked ? 'text-gray-400' : 'text-gray-500'}`}>
                                 <MapPin size={14} className={isBooked ? 'text-gray-400' : 'text-blue-400'}/> {room.location}
                              </p>
                           </div>
                           <div className={`w-6 h-6 rounded-full border-2 ml-4 flex items-center justify-center shrink-0
                              ${isBooked 
                                ? 'border-gray-300 bg-gray-200'
                                : selectedRoomId === room.id ? 'border-[#FFC107] bg-[#FFC107]' : 'border-gray-300'}`}>
                              {selectedRoomId === room.id && !isBooked && <div className="w-2 h-2 bg-white rounded-full"></div>}
                           </div>
                        </label>
                     )})}
                  </div>

                  <div className="pt-4 border-t border-gray-200 mt-6">
                     <button 
                        type="submit"
                        disabled={!selectedRoomId || isProcessing}
                        className="w-full py-4 bg-[#003B73] hover:bg-[#002b55] text-white rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                     >
                        {isProcessing ? (
                           <>
                              <Loader2 size={24} className="animate-spin" />
                              <span>Memproses Tiket...</span>
                           </>
                        ) : (
                           <>
                              <span>Konfirmasi Pemesanan</span>
                              <ArrowRight size={20} />
                           </>
                        )}
                     </button>
                  </div>
               </form>
            )}
         </div>
      </div>
    </div>
  );

  if (userRole === 'GUEST') {
    return renderLogin();
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans selection:bg-amber-200">
      {/* Backend Error Banner with Configuration Trigger */}
      {isBackendError && renderBackendError()}

      {/* Global Config Modal */}
      {showConfigModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-blue-900">
                          <Settings size={20} className="text-amber-500"/> Konfigurasi Server API
                      </h3>
                      <button onClick={() => setShowConfigModal(false)}><X size={20} className="text-gray-400 hover:text-black"/></button>
                  </div>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-600 mb-2">URL Endpoint API (PHP)</label>
                          <input 
                            type="url" 
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                            value={tempGlobalApiUrl}
                            onChange={(e) => setTempGlobalApiUrl(e.target.value)}
                            placeholder="https://domain.com/path/to/api.php"
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            Pastikan URL mengarah ke file <code>api.php</code> atau <code>phlapi.php</code> di server yang benar.
                          </p>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                          <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                          <button type="submit" className="px-6 py-2 bg-blue-900 text-white text-sm font-bold rounded-lg hover:bg-blue-800 flex items-center gap-2 shadow-lg shadow-blue-200">
                              <Save size={16} /> Simpan & Muat Ulang
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Navbar - THEME UPDATE */}
      <header className="bg-[#003B73] border-b border-[#002b55] sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppState(AppState.HOME)}>
            <div className="bg-[#FFC107] p-1.5 rounded-lg text-[#003B73]">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight text-white">PDB</h1>
              <p className="text-[10px] text-[#FFC107] font-bold uppercase tracking-wide">
                {userRole === 'ADMIN' ? 'Administrator' : 'Mahasiswa'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={onBack}
                className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors mr-1"
                title="Kembali ke Portal"
             >
                <ArrowLeft size={20} />
             </button>
             <button 
                onClick={() => { setTempGlobalApiUrl(apiUrl); setShowConfigModal(true); }}
                className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
                title="Pengaturan Koneksi"
             >
                <Settings size={20} />
             </button>
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm bg-[#002b55] hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
             >
                <LogOut size={16} />
                <span className="hidden sm:inline">Keluar</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        {userRole === 'ADMIN' && renderAdminView()}
        
        {userRole === 'STUDENT' && (
          <>
            {appState === AppState.HOME && renderStudentHome()}
            {appState === AppState.BOOKING && renderBookingForm()}
            {appState === AppState.TICKET && generatedBooking && (
              <ETicket 
                booking={generatedBooking} 
                onDownload={() => {}} 
                onNewBooking={() => {
                   setGeneratedBooking(null);
                   setAppState(AppState.HOME);
                   setSelectedRoomId('');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Room Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-transform">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Ruangan?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Apakah Anda yakin ingin menghapus ruangan ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDeleteRoom}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Delete Confirmation Modal */}
      {showDeleteBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-transform">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Pemesanan?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Apakah Anda yakin ingin menghapus data pemesanan ini? Slot ruangan akan kembali tersedia.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowDeleteBookingModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDeleteBooking}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} PDB System. Gedung Nano Lantai 8.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;