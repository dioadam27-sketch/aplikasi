import React, { useState } from 'react';
import { Send, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { ComplaintRequest } from '../types';

interface ComplainFormProps {
  onSubmit: (request: ComplaintRequest) => Promise<void>;
}

const ComplainForm: React.FC<ComplainFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    studentClass: '',
    category: 'Fasilitas' as 'Fasilitas' | 'Akademik' | 'Pelayanan' | 'Lainnya',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'studentId') {
      const numericValue = value.replace(/\D/g, ''); 
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.description || !formData.studentClass) {
        alert("Mohon lengkapi data (Nama, Kelas, Deskripsi).");
        return;
    }

    setIsSubmitting(true);

    const newComplaint: ComplaintRequest = {
      id: Date.now().toString(),
      ...formData,
      createdAt: Date.now(),
    };

    await onSubmit(newComplaint);
    
    setFormData({
      studentName: '',
      studentId: '',
      studentClass: '',
      category: 'Fasilitas',
      description: '',
    });
    setIsSubmitting(false);
  };

  return (
    <div className="relative group">
      
      <div className="relative bg-white border border-[#FFC700] rounded-[1.8rem] overflow-hidden shadow-lg">
        
        {/* Header */}
        <div className="p-8 border-b border-amber-100 bg-amber-50">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Layanan <span className="text-amber-500">Komplain</span>
              </h2>
              <p className="text-slate-500 text-sm mt-1">Sampaikan keluhan atau saran Anda.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
             <p className="text-xs text-blue-700 leading-relaxed font-medium">
               Identitas pelapor akan dijaga kerahasiaannya jika diperlukan. Mohon sampaikan keluhan dengan bahasa yang baik.
             </p>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group/input">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Nama Lengkap</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400 text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 group/input flex-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">NIM</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                  placeholder="Hanya Angka"
                />
              </div>
              <div className="space-y-2 group/input w-1/3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Kelas</label>
                <input
                  type="text"
                  name="studentClass"
                  value={formData.studentClass}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                  placeholder="Ex: A"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2 group/input">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Kategori Masalah</label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-5 py-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none appearance-none text-sm"
              >
                <option value="Fasilitas">Fasilitas & Sarana</option>
                <option value="Akademik">Akademik & Perkuliahan</option>
                <option value="Pelayanan">Pelayanan Staff/Dosen</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 group/input">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Detail Keluhan</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={5}
              className="w-full px-5 py-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400 resize-none text-sm"
              placeholder="Jelaskan permasalahan secara rinci..."
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 bg-[#FFC700] hover:bg-[#e6b300] text-[#003B73] font-bold rounded-xl text-lg flex items-center justify-center gap-2 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed shadow-none' : 'shadow-md'}`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              <span className="tracking-wide">{isSubmitting ? "Mengirim..." : "Kirim Laporan"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ComplainForm;
