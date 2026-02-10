import React, { useState, useRef } from 'react';
import { UploadCloud, Zap, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LeaveType, LeaveRequest, RequestStatus } from '../types';
import { api } from '../services/api';

interface LeaveFormProps {
  onSubmit: (request: LeaveRequest) => Promise<void>;
}

const COURSES = [
  { code: 'UAK25000001', name: 'Agama Islam I' },
  { code: 'UAK25000009', name: 'Bahasa Indonesia' },
  { code: 'UAK25000005', name: 'Agama Buddha 1' },
  { code: 'UAK25000004', name: 'Agama Hindu 1' },
  { code: 'UAK25000003', name: 'Agama Kristen Katolik 1' },
  { code: 'UAK25000002', name: 'Agama Kristen Protestan 1' },
  { code: 'UAK25000013', name: 'Inovasi dan Kolaborasi Bisnis' },
  { code: 'UAK25000010', name: 'Data dan Pustaka' },
  { code: 'UAK25000007', name: 'Pancasila' },
  { code: 'UAK25000008', name: 'Kewarganegaraan' },
  { code: 'UAK25000011', name: 'Logika dan Pemikiran Kritis' },
  { code: 'UAK25000012', name: 'Pengembangan Diri Kewirausahaan' },
  { code: 'UAR25000002', name: 'Komunikasi Kesehatan dan Layanan Dasar Kesehatan' },
  { code: 'UAR25000001', name: 'Etika dan Hukum Kesehatan' },
];

const LeaveForm: React.FC<LeaveFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    studentClass: '',
    courseName: '',
    lecturerName: '',
    date: new Date().toISOString().split('T')[0],
    type: LeaveType.SICK,
    reason: '',
  });

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceBase64, setEvidenceBase64] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'studentId') {
      const numericValue = value.replace(/\D/g, ''); 
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setUploadError(null);
      setEvidenceFile(null);
      const file = e.target.files[0];
      
      try {
        const compressedBase64 = await api.compressImage(file);
        setEvidenceBase64(compressedBase64);
        setEvidenceFile(file);
      } catch (err: any) {
        console.error("Compression error", err);
        setUploadError(err.message || "Gagal memproses gambar.");
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.studentClass || !formData.courseName || !evidenceBase64) {
        alert("DATA TIDAK LENGKAP: Harap isi Nama, Kelas, Matkul dan upload bukti.");
        return;
    }

    setIsSubmitting(true);

    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      ...formData,
      evidenceBase64: evidenceBase64, 
      status: RequestStatus.PENDING,
      createdAt: Date.now(),
    };

    await onSubmit(newRequest);
    
    // Reset
    setFormData({
      studentName: '',
      studentId: '',
      studentClass: '',
      courseName: '',
      lecturerName: '',
      date: new Date().toISOString().split('T')[0],
      type: LeaveType.SICK,
      reason: '',
    });
    setEvidenceFile(null);
    setEvidenceBase64('');
    setUploadError(null);
    setIsSubmitting(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#003B73]/10 flex items-center justify-center rounded-lg border border-[#003B73]/20">
          <Zap className="w-5 h-5 text-[#003B73]" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
          Input Permohonan
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Nama Lengkap</label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all text-sm font-medium"
              placeholder="Masukkan nama lengkap"
            />
          </div>
          <div className="flex gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">NIM</label>
              <input
                type="text"
                inputMode="numeric"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all text-sm font-medium"
                placeholder="NIM"
              />
            </div>
            <div className="space-y-1.5 w-1/3">
              <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Kelas</label>
              <input
                type="text"
                name="studentClass"
                value={formData.studentClass}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all text-sm font-medium"
                placeholder="Ex: A"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Mata Kuliah</label>
            <select
              name="courseName"
              value={formData.courseName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none appearance-none text-sm font-medium"
            >
              <option value="">-- PILIH MATKUL --</option>
              {COURSES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Dosen</label>
            <input
              type="text"
              name="lecturerName"
              value={formData.lecturerName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none transition-all text-sm font-medium"
              placeholder="Nama Dosen Pengampu"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Tanggal</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none text-sm font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Kategori</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none text-sm font-medium"
            >
              {Object.values(LeaveType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Alasan</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none text-sm font-medium resize-none"
            placeholder="Jelaskan alasan ketidakhadiran..."
          />
        </div>

        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed ${uploadError ? 'border-rose-400 bg-rose-50' : evidenceFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'} rounded-xl p-8 cursor-pointer transition-all text-center`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          {isUploading ? (
            <div className="flex flex-col items-center text-[#003B73]">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="font-bold text-xs">MEMPROSES GAMBAR...</span>
            </div>
          ) : uploadError ? (
            <div className="flex flex-col items-center text-rose-500">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <span className="font-bold text-sm text-center">{uploadError}</span>
              <span className="text-xs mt-1">Klik untuk coba file lain</span>
            </div>
          ) : evidenceFile ? (
            <div className="flex flex-col items-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <span className="font-bold text-sm">{evidenceFile.name} (SIAP)</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400 hover:text-blue-500 transition-colors">
              <UploadCloud className="w-8 h-8 mb-2" />
              <span className="font-bold text-xs uppercase tracking-wide text-slate-500">Upload Bukti Dokumen (Max 1MB)</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isUploading || isSubmitting || !!uploadError}
          className="w-full py-4 bg-[#003B73] text-white rounded-xl font-bold uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#002d5a] transition-all"
        >
          {isSubmitting ? "MENGIRIM DATA..." : "AJUKAN PERMOHONAN"}
        </button>

      </form>
    </div>
  );
};

export default LeaveForm;
