import React, { useRef, useState } from 'react';
import { Booking } from '../../types_pdb';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ETicketProps {
  booking: Booking;
  onDownload?: () => void;
  onNewBooking: () => void;
}

export const ETicket: React.FC<ETicketProps> = ({ booking, onDownload, onNewBooking }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    
    setIsDownloading(true);
    try {
      // Tunggu sebentar untuk memastikan render stabil
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = ticketRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3, // High resolution text
        useCORS: true,
        backgroundColor: '#ffffff', // Pastikan background putih
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY, // Fix untuk posisi scroll saat capture
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.ticket-receipt') as HTMLElement;
            if (clonedElement) {
                // Reset transform agar posisi akurat
                clonedElement.style.transform = 'none';
                clonedElement.style.margin = '0 auto';
            }
        }
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `STRUK-PDB-${booking.student.nim}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onDownload) onDownload();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Gagal menyimpan struk. Silakan screenshot manual.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!booking.room) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in-up bg-gray-100 w-full">
      
      {/* RECEIPT CONTAINER */}
      <div 
        ref={ticketRef}
        className="ticket-receipt bg-white w-80 p-6 shadow-xl relative text-gray-800 font-mono text-xs leading-relaxed"
        style={{ 
           backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', 
           backgroundSize: '20px 20px' 
        }}
      >
        {/* Paper Background Override inside content */}
        <div className="absolute inset-0 bg-white z-0"></div>

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col items-center">
            
            {/* Header */}
            <div className="text-center mb-4">
                <h1 className="font-bold text-lg uppercase tracking-widest border-b-2 border-black pb-1 mb-1">
                    TIKET PDB
                </h1>
                <p className="text-[10px] text-gray-500">GEDUNG NANO LT. 8 - UNAIR</p>
                <p className="text-[10px] text-gray-500">{new Date().toLocaleString('id-ID')}</p>
            </div>

            {/* Dashed Divider */}
            <div className="w-full border-t border-dashed border-gray-400 my-2"></div>

            {/* Room Info */}
            <div className="w-full mb-2">
                <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-xl">{booking.room.name}</span>
                    <span className="text-[10px] bg-black text-white px-1 py-0.5 rounded">
                        CONFIRMED
                    </span>
                </div>
                <p className="text-gray-500 uppercase">{booking.room.location}</p>
            </div>

            {/* Booking Details */}
            <div className="w-full space-y-2 mb-4">
                <div className="flex justify-between">
                    <span>TANGGAL</span>
                    <span className="font-bold">{booking.date}</span>
                </div>
                <div className="flex justify-between">
                    <span>JAM</span>
                    <span className="font-bold">{booking.timeSlot}</span>
                </div>
            </div>

            {/* AI Message */}
            {booking.aiMessage && (
               <div className="w-full my-2 p-2 border border-dashed border-gray-300 rounded text-center italic text-[10px] text-gray-600">
                  {booking.aiMessage}
               </div>
            )}

            <div className="w-full border-t border-dashed border-gray-400 my-2"></div>

            {/* Student Info */}
            <div className="w-full space-y-1 mb-4">
                <p className="font-bold text-center mb-2 uppercase border-b border-gray-200 pb-1">Data Mahasiswa</p>
                <div className="flex justify-between">
                    <span>NAMA</span>
                    <span className="text-right max-w-[150px] uppercase">{booking.student.name}</span>
                </div>
                <div className="flex justify-between">
                    <span>NIM</span>
                    <span>{booking.student.nim}</span>
                </div>
                <div className="flex justify-between">
                    <span>KELAS</span>
                    <span>{booking.student.pdbClass}</span>
                </div>
                <div className="flex justify-between items-start mt-1">
                    <span className="whitespace-nowrap mr-2">MATKUL</span>
                    <span className="text-right leading-tight uppercase">{booking.student.subject.split('-')[1] || booking.student.subject}</span>
                </div>
            </div>

            <div className="w-full border-t border-dashed border-gray-400 my-2"></div>

            {/* Barcode Simulation */}
            <div className="w-full flex flex-col items-center justify-center pt-2">
                <div className="h-10 w-full max-w-[200px] mb-1 bg-black" style={{ 
                    maskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px)',
                    WebkitMaskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px)'
                }}></div>
                <p className="text-[10px] font-mono tracking-widest">{booking.id}</p>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center uppercase">
                <p className="text-[10px] font-extrabold text-black">TUNJUKKAN PADA PETUGAS DI</p>
                <p className="text-[10px] font-extrabold text-black">SEKRETARIAT PDB, GEDUNG NANO LT 8</p>
                <p className="mt-2 text-[9px] text-gray-400 font-normal">--- TERIMA KASIH ---</p>
            </div>
            
            {/* Cut Line */}
            <div className="absolute -bottom-1 left-0 w-full h-2 bg-gray-100" style={{ 
                maskImage: 'radial-gradient(circle, transparent 4px, black 4.5px)',
                maskSize: '10px 10px',
                maskPosition: 'bottom',
                WebkitMaskImage: 'radial-gradient(circle, transparent 4px, black 4.5px)',
                WebkitMaskSize: '10px 10px',
                WebkitMaskPosition: 'bottom'
            }}></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-lg shadow hover:bg-gray-50 transition-colors font-bold text-sm border border-gray-300 disabled:opacity-50"
        >
          {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>Download Struk</span>
        </button>
        <button 
          onClick={onNewBooking}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg shadow-lg hover:bg-gray-800 transition-all text-sm font-bold"
        >
          <CheckCircle2 size={16} />
          <span>Selesai</span>
        </button>
      </div>
    </div>
  );
};