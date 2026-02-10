import React, { useState } from 'react';
import { LeaveRequest, RequestStatus, ComplaintRequest } from '../types';
import { Check, X, Eye, Loader2, RefreshCw, Trash2, AlertTriangle, AlertOctagon, FileImage, ExternalLink, ImageOff, MessageSquareX, MessageSquare, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface AdminDashboardProps {
  requests: LeaveRequest[];
  complaints?: ComplaintRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, reason?: string) => void;
  onUpdateComplaint: (id: string, note: string) => void;
  onRefresh: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteComplaint: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, complaints = [], onUpdateStatus, onUpdateComplaint, onRefresh, onDeleteRequest, onDeleteComplaint }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'complaints'>('requests');
  const [loadingProofId, setLoadingProofId] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'request' | 'complaint' | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintTargetId, setComplaintTargetId] = useState<string | null>(null);
  const [complaintNote, setComplaintNote] = useState('');

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleViewProof = async (req: LeaveRequest) => {
    setImgError(false);
    
    if (req.evidenceBase64) {
      setViewingProof(req.evidenceBase64);
      return;
    }
    setLoadingProofId(req.id);
    const base64 = await api.fetchEvidence(req.id);
    setLoadingProofId(null);
    
    if (base64) {
       setViewingProof(base64);
    } else {
       alert("Gagal mengambil data gambar.");
    }
  };

  const requestDelete = (id: string, type: 'request' | 'complaint') => {
    setConfirmDeleteId(id);
    setDeleteType(type);
  }

  const executeDelete = () => {
    if (!confirmDeleteId || !deleteType) return;
    
    if (deleteType === 'complaint') {
      onDeleteComplaint(confirmDeleteId);
    } else {
      onDeleteRequest(confirmDeleteId);
    }
    
    setConfirmDeleteId(null);
    setDeleteType(null);
  }

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const submitRejection = () => {
    if (rejectTargetId) {
      onUpdateStatus(rejectTargetId, RequestStatus.REJECTED, rejectReason || "Tidak ada alasan spesifik.");
      setRejectModalOpen(false);
      setRejectTargetId(null);
    }
  };

  const openComplaintModal = (id: string, currentNote?: string) => {
    setComplaintTargetId(id);
    setComplaintNote(currentNote || '');
    setComplaintModalOpen(true);
  };

  const submitComplaintResponse = () => {
    if (complaintTargetId) {
      onUpdateComplaint(complaintTargetId, complaintNote);
      setComplaintModalOpen(false);
      setComplaintTargetId(null);
    }
  }

  const renderReasonText = (text: any) => {
    if (text === null || text === undefined || text === '') return <span className="text-slate-400 italic">-</span>;
    const textStr = String(text);
    const cleanText = textStr.replace(/^"|"$/g, '').trim();
    const isImageLike = cleanText.startsWith('data:image') || (cleanText.length > 200 && !cleanText.includes(' ')) || cleanText.includes('base64,');

    if (isImageLike) {
      return (
        <span className="flex items-center gap-2 text-slate-400 italic select-none">
          <FileImage className="w-3 h-3 text-[#003B73]" />
          <span className="text-[10px]">(Gambar terdeteksi di kolom teks)</span>
        </span>
      );
    }
    return `"${textStr}"`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <h2 className="text-xl font-extrabold text-[#003B73] uppercase tracking-wide">Administrator Console</h2>
        <button onClick={handleManualRefresh} className={`p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}>
           <RefreshCw className="w-4 h-4 text-[#003B73]" />
        </button>
      </div>

      <div className="flex gap-2">
         <button onClick={() => setActiveTab('requests')} className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${activeTab === 'requests' ? 'border-[#003B73] text-[#003B73]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Izin Masuk</button>
         <button onClick={() => setActiveTab('complaints')} className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${activeTab === 'complaints' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Komplain</button>
      </div>

      {activeTab === 'requests' && (
        <div className="grid gap-4">
          {requests.slice().reverse().map((req) => (
             <div key={req.id} className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#003B73]/30 transition-all flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${req.status === RequestStatus.APPROVED ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : req.status === RequestStatus.REJECTED ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{req.studentId} • {req.studentClass}</span>
                   </div>
                   <h3 className="text-slate-900 font-bold truncate text-base">{req.studentName}</h3>
                   <p className="text-xs text-slate-500 font-medium mt-1 truncate">{req.courseName} • {req.type}</p>
                   
                   <div className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded border border-slate-100 max-h-20 overflow-hidden text-ellipsis break-all">
                      {renderReasonText(req.reason)}
                   </div>

                   {req.status === RequestStatus.REJECTED && req.rejectionReason && (
                     <div className="mt-2 flex items-start gap-2 bg-rose-50 border border-rose-100 p-2 rounded">
                        <MessageSquareX className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-600 italic font-medium">
                          "{req.rejectionReason}"
                        </p>
                     </div>
                   )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[120px]">
                   <button 
                      onClick={() => handleViewProof(req)}
                      disabled={loadingProofId === req.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-xs font-bold"
                    >
                      {loadingProofId === req.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Eye className="w-3 h-3"/>}
                      BUKTI
                   </button>
                   
                   {req.status === RequestStatus.PENDING && (
                     <>
                        <button onClick={() => onUpdateStatus(req.id, RequestStatus.APPROVED)} className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded text-xs font-bold">
                           <Check className="w-3 h-3" /> ACC
                        </button>
                        <button onClick={() => openRejectModal(req.id)} className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded text-xs font-bold">
                           <X className="w-3 h-3" /> TOLAK
                        </button>
                     </>
                   )}

                   <button 
                      onClick={() => requestDelete(req.id, 'request')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 rounded text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-3 h-3"/>
                      HAPUS
                   </button>
                </div>
             </div>
          ))}
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="grid gap-4">
           {complaints.slice().reverse().map((comp) => (
              <div key={comp.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 shadow-sm">
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                       <AlertTriangle className="w-3 h-3 text-amber-500" />
                       <span className="text-xs font-bold text-amber-600">{comp.category}</span>
                       <span className="text-[10px] text-slate-400 ml-auto">{new Date(comp.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-3">{comp.description}</p>
                    <p className="text-xs text-slate-400 mt-2">Oleh: {comp.studentName} ({comp.studentId} - {comp.studentClass})</p>

                    {comp.adminNote && (
                       <div className="mt-3 bg-[#003B73]/5 border border-[#003B73]/10 p-2.5 rounded flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#003B73] shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                             <span className="text-[10px] text-[#003B73] font-bold uppercase mb-0.5">Tanggapan Admin</span>
                             <p className="text-xs text-slate-600">"{comp.adminNote}"</p>
                          </div>
                       </div>
                    )}
                 </div>
                 
                 <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[130px]">
                   <button 
                      onClick={() => openComplaintModal(comp.id, comp.adminNote)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-bold transition-colors flex-1 md:flex-auto"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {comp.adminNote ? 'EDIT' : 'TANGGAPI'}
                   </button>
                   
                   <button 
                     onClick={() => requestDelete(comp.id, 'complaint')}
                     className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 rounded text-xs font-bold transition-colors flex-1 md:flex-auto"
                   >
                     <Trash2 className="w-3 h-3"/>
                     HAPUS
                   </button>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Image Viewer */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingProof(null)}>
           <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-slate-200">
                 <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileImage className="w-4 h-4" /> BUKTI DOKUMEN
                 </h3>
                 <div className="flex gap-2">
                   {viewingProof.startsWith('http') && (
                      <a href={viewingProof} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Buka di Tab Baru">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                   )}
                   <button onClick={() => setViewingProof(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                     <X className="w-4 h-4" />
                   </button>
                 </div>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-100 flex items-center justify-center min-h-[300px] relative rounded-b-xl">
                 {imgError ? (
                   <div className="text-center p-8">
                      <ImageOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-sm mb-4">Preview gambar tidak dapat dimuat.</p>
                      {viewingProof.startsWith('http') && (
                         <a href={viewingProof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-50 text-white rounded font-bold text-xs">
                           <ExternalLink className="w-3 h-3" /> BUKA GAMBAR ASLI
                         </a>
                      )}
                   </div>
                 ) : (
                   <img 
                     src={viewingProof} 
                     className="max-w-full max-h-[80vh] object-contain" 
                     onError={() => setImgError(true)}
                   />
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                  <MessageSquareX className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">TOLAK IZIN</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Alasan Penolakan</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm focus:border-rose-400 outline-none min-h-[100px] resize-none placeholder:text-slate-400"
                  placeholder="Contoh: Bukti tidak valid..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={() => { setRejectModalOpen(false); setRejectTargetId(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded transition-colors"
                >
                  BATAL
                </button>
                <button 
                  onClick={submitRejection}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                >
                  KONFIRMASI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Response Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">TANGGAPAN ADMIN</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Catatan / Status</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm focus:border-blue-400 outline-none min-h-[100px] resize-none placeholder:text-slate-400"
                  placeholder="Tulis tanggapan..."
                  value={complaintNote}
                  onChange={(e) => setComplaintNote(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={() => { setComplaintModalOpen(false); setComplaintTargetId(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded transition-colors"
                >
                  BATAL
                </button>
                <button 
                  onClick={submitComplaintResponse}
                  className="flex-1 py-2.5 bg-[#003B73] hover:bg-[#004b91] text-white text-xs font-bold rounded shadow-sm transition-colors"
                >
                  SIMPAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                <AlertOctagon className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">HAPUS DATA?</h3>
                <p className="text-sm text-slate-500">Data yang dihapus tidak dapat dikembalikan lagi.</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => { setConfirmDeleteId(null); setDeleteType(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded transition-colors"
                >
                  BATAL
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                >
                  YA, HAPUS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
