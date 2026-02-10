import { AIParsedData } from "../types";

// Removed Gemini AI import and usage.
// This service now provides static or dummy data as AI functionality is removed.

export const analyzeLetterContent = async (text: string): Promise<AIParsedData> => {
  // Return dummy data since AI is disabled
  console.warn("AI analysis is disabled.");
  return {
    judul: "Dokumen Tanpa Judul (AI Disabled)",
    kategori: "Lainnya",
    tahun: new Date().getFullYear().toString(),
    deskripsi: "Deskripsi otomatis tidak tersedia karena fitur AI dinonaktifkan.",
    tags: ["manual"]
  };
};

export const generateTicketMessage = async (studentData: any, roomName: string): Promise<string> => {
  // Static message since AI is disabled
  return "Semangat kuliahnya!";
};