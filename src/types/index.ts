export interface Room {
  id: string;
  number: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance';
  amenities: string[];
  pricePerNight: number;
  currentControls: {
    light: boolean;
    ac: boolean;
    power: boolean;
  };
}

export interface Booking {
  id: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'admin';
}

export interface BLEDeviceState {
  connected: boolean;
  statusMessage: string;
}
