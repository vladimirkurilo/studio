"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomStore } from '@/stores/roomStore';
import { INITIAL_ROOMS } from '@/lib/constants';


export default function Providers({ children }: { children: React.ReactNode }) {
  // This effect runs once on mount to ensure stores are hydrated if they use persist middleware
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useBookingStore.persist.rehydrate();
    // Room store is not persisted in this example, but if it were, rehydrate here.
    // It's initialized with static data, so rehydration for it might not be standard.
    // If it were persisted: useRoomStore.persist.rehydrate();

    // Initializing roomStore on client if not persisted or needs fresh init
     if (useRoomStore.getState().rooms.length === 0) {
        useRoomStore.getState().initializeRooms(INITIAL_ROOMS);
     }

  }, []);

  return <>{children}</>;
}
