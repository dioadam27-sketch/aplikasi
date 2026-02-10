import React, { useState } from 'react';
import { LeaveRequest, RequestStatus, ComplaintRequest } from '../types';
import { CheckCircle2, AlertTriangle, Search, User, BookOpen, X } from 'lucide-react';

interface HistoryProps {
  requests: LeaveRequest[];
  complaints?: ComplaintRequest[];
}

const History: React.FC<HistoryProps> = ({ requests, complaints = [] }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'complaints'>('requests');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED: 
        return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">DISETUJUI</span>;
      case RequestStatus.REJECTED: 
        return <span className="text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">DITOLAK</span>;
      default: 
        return <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">MENUNGGU</span>;
    }
  };

  const filteredRequests = requests.filter(req => {
    const term = searchTerm.toLowerCase();
    const dateStr = new Date(req.date).toLocaleDateString().toLowerCase();
    return (
      req.studentName.toLowerCase().includes(term) ||
      req.courseName.toLowerCase().includes(term) ||
      req.reason.toLowerCase().includes(term) ||
      dateStr.includes(term) ||
      req.status.toLowerCase().includes(term)
    );
  });

  const filteredComplaints = complaints.filter(comp => {
    const term = searchTerm.toLowerCase();
    const dateStr = new Date(comp.createdAt).toLocaleDateString().toLowerCase();
    return (
      comp.studentName.toLowerCase().includes(term) ||
      comp.category.toLowerCase().includes(term) ||
      comp.description.toLowerCase().includes(term) ||
      dateStr.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Tab Controls */}
        <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg w-fit shrink-0 shadow-sm">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'requests' ? 'bg-[#003B73] text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            PERMOHONAN ({filteredRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'complaints' ? 'bg-[#FFC700] text-[#003B73]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            LAPORAN ({filteredComplaints.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             type="text" 
             placeholder={activeTab === 'requests' ? "Cari nama, matkul..." : "Cari nama, keluhan..."}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-[#003B73] focus:ring-1 focus:ring-[#003B73] outline-none placeholder:text-slate-400 transition-all shadow-sm"
           />
           {searchTerm && (
             <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
               <X className="w-3 h-3" />
             </button>
           )}
        </div>
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-slate-400 text-sm font-medium">
                {searchTerm ? 'DATA TIDAK DITEMUKAN' : 'BELUM ADA DATA PERMOHONAN'}
              </p>
            </div>
          ) : (
            filteredRequests.slice().reverse().map((req) => (
              <div key={req.id} className="bg-white border border-slate-200 p-5 rounded-xl hover:border-[#003B73]/50 transition-colors shadow-sm">
                <div className="w-full">
                   {/* Row 1: Status & Date */}
                   <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                      {getStatusBadge(req.status)}
                      <span className="text-[10px] font-bold text-slate-400">{new Date(req.date).toLocaleDateString()}</span>
                   </div>
                   
                   {/* Row 2: Student Info */}
                   <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <User className="w-3 h-3 text-[#003B73]" />
                        {req.studentName}
                      </div>
                      <span className="text-slate-300 hidden sm:inline">|</span>
                      <span className="text-slate-500">{req.studentId}</span>
                      <span className="text-slate-300 hidden sm:inline">|</span>
                      <span className="text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100">
                        Kelas {req.studentClass}
                      </span>
                   </div>

                   {/* Row 3: Course Info */}
                   <div className="flex items-start gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <h3 className="font-bold text-slate-800 text-sm">{req.courseName}</h3>
                   </div>

                   {/* Row 4: Reason */}
                   <div className="pl-6">
                     <p className="text-xs font-medium text-slate-500 italic">"{req.reason}"</p>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="space-y-3">
           {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-slate-400 text-sm font-medium">
                {searchTerm ? 'DATA TIDAK DITEMUKAN' : 'BELUM ADA DATA KOMPLAIN'}
              </p>
            </div>
           ) : (
             filteredComplaints.slice().reverse().map((comp) => (
               <div key={comp.id} className="bg-white border border-slate-200 p-5 rounded-xl hover:border-amber-400 transition-colors shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded uppercase">{comp.category}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(comp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                   {/* Student Info */}
                   <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs bg-slate-50 p-2 rounded border border-slate-100 w-fit">
                      <span className="text-slate-900 font-bold">{comp.studentName}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">{comp.studentId}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-600 font-bold">Kelas {comp.studentClass}</span>
                   </div>

                  <div className="flex gap-3">
                     <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                     <p className="text-sm text-slate-700 leading-relaxed">{comp.description}</p>
                  </div>

                  {/* Display Admin Response if available */}
                  {comp.adminNote && (
                    <div className="mt-4 pt-3 border-t border-slate-100 ml-0 md:ml-7">
                        <div className="bg-[#003B73]/5 border border-[#003B73]/10 p-3 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-[#003B73] shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#003B73] font-bold uppercase mb-1 tracking-wider">Tanggapan Admin</span>
                                <p className="text-xs text-slate-700 leading-relaxed">"{comp.adminNote}"</p>
                            </div>
                        </div>
                    </div>
                  )}
               </div>
             ))
           )}
        </div>
      )}
    </div>
  );
};

export default History;
