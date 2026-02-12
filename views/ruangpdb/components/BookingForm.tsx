import React, { useState } from 'react';
import { Room, Student } from '../../../types_pdb';
import { PDB_CLASSES, SUBJECTS } from '../../../constants_pdb';
// FIX: Added 'Users' to the import from lucide-react.
import { User, BookOpen, Hash, Phone, ArrowLeft, Send, Users } from 'lucide-react';

interface BookingFormProps {
  bookingDetails: {
    room: Room;
    date: string;
    timeSlot: string;
  };
  onSubmit: (studentData: Student) => void;
  onBack: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ bookingDetails, onSubmit, onBack }) => {
  const [student, setStudent] = useState<Student>({
    name: '',
    nim: '',
    pdbClass: '',
    subject: '',
    contact: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(student).some(val => val === '')) {
      alert('Mohon lengkapi semua data mahasiswa.');
      return;
    }
    onSubmit(student);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h2 className="text-xl font-bold text-slate-800">Formulir Peminjaman</h2>
            <p className="text-sm text-slate-500">Lengkapi data diri untuk menyelesaikan booking.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8">
        {/* Booking Summary */}
        <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl mb-8 space-y-3">
            <h3 className="font-bold text-purple-800 text-center mb-4">Detail Booking Anda</h3>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ruangan:</span>
                <span className="font-bold text-purple-900">{bookingDetails.room.name}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-bold text-purple-900">{bookingDetails.date}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Waktu:</span>
                <span className="font-bold text-purple-900">{bookingDetails.timeSlot}</span>
            </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField icon={User} name="name" label="Nama Lengkap" value={student.name} onChange={handleChange} placeholder="Nama sesuai KTM" />
                <InputField icon={Hash} name="nim" label="NIM" value={student.nim} onChange={handleChange} placeholder="Nomor Induk Mahasiswa" type="number" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField icon={Users} name="pdbClass" label="Kelas PDB" value={student.pdbClass} onChange={handleChange} placeholder="Contoh: PDB-01" />
                <InputField icon={Phone} name="contact" label="No. HP (WhatsApp)" value={student.contact} onChange={handleChange} placeholder="08..." type="tel" />
            </div>
            <div>
                <SelectField icon={BookOpen} name="subject" label="Mata Kuliah Relevan" value={student.subject} onChange={handleChange} options={SUBJECTS.map(s => s.name)} />
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95">
                    <Send size={18} />
                    Booking Sekarang
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};

// --- Helper Components for Form Fields ---

const InputField = ({ icon: Icon, name, label, ...props }: any) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon size={16} className="text-slate-400" />
            </div>
            <input 
              name={name} 
              required 
              {...props}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm font-medium" 
            />
        </div>
    </div>
);

const SelectField = ({ icon: Icon, name, label, options, ...props }: any) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon size={16} className="text-slate-400" />
            </div>
            <select 
                name={name}
                required
                {...props}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm font-medium appearance-none"
            >
                <option value="">-- Pilih {label} --</option>
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    </div>
);

export default BookingForm;