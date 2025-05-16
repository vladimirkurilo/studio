"use client";

import type { Booking, Room } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useRoomStore } from './roomStore';

interface BookingState {
  bookings: Booking[];
  addBooking: (guestId: string, guestName: string, room: Room, checkInDate: Date, checkOutDate: Date) => Promise<Booking | null>;
  getGuestBookings: (guestId: string) => Booking[];
  getBookingById: (bookingId: string) => Booking | undefined;
  hydrated: boolean;
  setHydrated: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookings: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      addBooking: async (guestId, guestName, room, checkInDate, checkOutDate) => {
        // Simulate API call & validation
        await new Promise(resolve => setTimeout(resolve, 500));

        const roomStore = useRoomStore.getState();
        const targetRoom = roomStore.rooms.find(r => r.id === room.id);
        if (!targetRoom || targetRoom.status !== 'available') {
          console.error("Room not available for booking");
          return null;
        }
        
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
        if (nights <= 0) {
            console.error("Invalid booking dates");
            return null;
        }
        const totalPrice = nights * room.pricePerNight;

        const newBooking: Booking = {
          id: `booking-${Date.now()}`,
          roomId: room.id,
          roomNumber: room.number,
          guestId,
          guestName,
          checkInDate: checkInDate.toISOString().split('T')[0],
          checkOutDate: checkOutDate.toISOString().split('T')[0],
          totalPrice,
        };

        set(state => ({ bookings: [...state.bookings, newBooking] }));
        roomStore.updateRoomStatus(room.id, 'occupied');
        return newBooking;
      },
      getGuestBookings: (guestId) => {
        return get().bookings.filter(b => b.guestId === guestId);
      },
      getBookingById: (bookingId) => {
        return get().bookings.find(b => b.id === bookingId);
      }
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      }
    }
  )
);

export const useHydratedBookingStore = <T>(selector: (state: BookingState) => T) => {
  const state = useBookingStore(selector);
  const hydrated = useBookingStore((s) => s.hydrated);
  return hydrated ? state : (selector(useBookingStore.getState()) as T); 
};
