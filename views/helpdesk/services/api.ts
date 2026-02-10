import { LeaveRequest, ComplaintRequest, RequestStatus } from '../types';

const STORAGE_KEY = 'helpdesk_data_v1';

export const api = {
  isConfigured: () => true,

  getLocalData: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { requests: [], complaints: [] };
  },

  fetchAll: async () => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    return api.getLocalData();
  },

  createRequest: async (req: LeaveRequest) => {
    const data = api.getLocalData();
    data.requests.push(req);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  },

  createComplaint: async (req: ComplaintRequest) => {
    const data = api.getLocalData();
    data.complaints.push(req);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  },

  updateStatus: async (id: string, status: RequestStatus, reason?: string) => {
    const data = api.getLocalData();
    const idx = data.requests.findIndex((r: LeaveRequest) => r.id === id);
    if (idx !== -1) {
      data.requests[idx].status = status;
      if (reason) data.requests[idx].rejectionReason = reason;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    }
    return false;
  },

  updateComplaint: async (id: string, note: string) => {
    const data = api.getLocalData();
    const idx = data.complaints.findIndex((c: ComplaintRequest) => c.id === id);
    if (idx !== -1) {
      data.complaints[idx].adminNote = note;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    }
    return false;
  },

  deleteRequest: async (id: string) => {
    const data = api.getLocalData();
    data.requests = data.requests.filter((r: LeaveRequest) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  },

  deleteComplaint: async (id: string) => {
    const data = api.getLocalData();
    data.complaints = data.complaints.filter((c: ComplaintRequest) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  },

  fetchEvidence: async (id: string) => {
    // Evidence is stored inline for now
    const data = api.getLocalData();
    const req = data.requests.find((r: LeaveRequest) => r.id === id);
    return req ? req.evidenceBase64 : null;
  },

  compressImage: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL(file.type, 0.7)); 
          } else {
              reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }
};
