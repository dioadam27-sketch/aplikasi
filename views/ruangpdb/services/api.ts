import { Room, Booking, Student } from '../../../types_pdb';

const API_URL = 'https://pkkii.pendidikan.unair.ac.id/aplikasi/aplikasiapi.php'; 

export const fetchRooms = async (): Promise<Room[]> => {
    const res = await fetch(`${API_URL}?action=fetch_pdb_rooms`);
    if (!res.ok) throw new Error('Gagal mengambil data ruangan dari server.');
    return res.json();
};

export const fetchBookings = async (): Promise<Booking[]> => {
    const res = await fetch(`${API_URL}?action=fetch_pdb_bookings`);
    if (!res.ok) throw new Error('Gagal mengambil data pemesanan dari server.');
    return res.json();
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'timestamp' | 'status'> & { room: Room }): Promise<Booking> => {
    const newBooking: Booking = {
        ...bookingData,
        id: `pdb-${Date.now()}`,
        timestamp: Date.now(),
        status: 'APPROVED',
    };

    const res = await fetch(`${API_URL}?action=pdb_create_booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
    });

    if (!res.ok) {
        let errorMsg = 'Gagal membuat pemesanan.';
        try {
            const err = await res.json();
            if (err.error) errorMsg = err.error;
        } catch (e) {
            // keep default error
        }
        throw new Error(errorMsg);
    }
    
    return newBooking;
};