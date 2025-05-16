"use client";

import type { Room, BLEDeviceState } from '@/types';
import { create } from 'zustand';
import { INITIAL_ROOMS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast'; // Ensure useToast is available

interface RoomState {
  rooms: Room[];
  bleStates: Record<string, BLEDeviceState>; // BLE state per room ID
  getRoomById: (roomId: string) => Room | undefined;
  updateRoomStatus: (roomId: string, status: Room['status']) => void;
  toggleRoomControl: (roomId: string, control: keyof Room['currentControls']) => void;
  // BLE Simulation
  connectToRoomBLE: (roomId: string) => Promise<void>;
  disconnectFromRoomBLE: (roomId: string) => Promise<void>;
  sendBLECommand: (roomId: string, command: string) => Promise<void>;
  // Initialize rooms on store creation
  initializeRooms: (initialRooms: Room[]) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  bleStates: {},
  initializeRooms: (initialRooms) => {
    set({ rooms: initialRooms });
    const initialBleStates: Record<string, BLEDeviceState> = {};
    initialRooms.forEach(room => {
      initialBleStates[room.id] = { connected: false, statusMessage: 'Disconnected' };
    });
    set({ bleStates: initialBleStates });
  },
  getRoomById: (roomId) => get().rooms.find(room => room.id === roomId),
  updateRoomStatus: (roomId, status) => {
    set(state => ({
      rooms: state.rooms.map(room => 
        room.id === roomId ? { ...room, status } : room
      ),
    }));
  },
  toggleRoomControl: (roomId, control) => {
    set(state => ({
      rooms: state.rooms.map(room =>
        room.id === roomId
          ? {
              ...room,
              currentControls: {
                ...room.currentControls,
                [control]: !room.currentControls[control],
              },
            }
          : room
      ),
    }));
    // Simulate sending BLE command if connected
    const bleState = get().bleStates[roomId];
    if (bleState?.connected) {
      const room = get().rooms.find(r => r.id === roomId);
      if (room) {
         // toast is not available here directly. Effect should be handled in component.
        console.log(`Simulated BLE: Toggled ${control} for room ${room.number} to ${room.currentControls[control]}`);
      }
    }
  },
  connectToRoomBLE: async (roomId) => {
    set(state => ({
      bleStates: {
        ...state.bleStates,
        [roomId]: { connected: false, statusMessage: 'Connecting...' }
      }
    }));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate connection delay
    set(state => ({
      bleStates: {
        ...state.bleStates,
        [roomId]: { connected: true, statusMessage: 'Connected' }
      }
    }));
  },
  disconnectFromRoomBLE: async (roomId) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate disconnection delay
    set(state => ({
      bleStates: {
        ...state.bleStates,
        [roomId]: { connected: false, statusMessage: 'Disconnected' }
      }
    }));
  },
  sendBLECommand: async (roomId, command) => {
    const bleState = get().bleStates[roomId];
    if (!bleState?.connected) {
      console.warn(`BLE not connected for room ${roomId}`);
      // toast({ title: "BLE Error", description: "Not connected to room device.", variant: "destructive" });
      return;
    }
    set(state => ({
      bleStates: {
        ...state.bleStates,
        [roomId]: { ...bleState, statusMessage: `Sending: ${command}...` }
      }
    }));
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate command send
    set(state => ({
      bleStates: {
        ...state.bleStates,
        [roomId]: { ...bleState, statusMessage: `Command '${command}' sent.` }
      }
    }));
    if (command === 'OPEN_DOOR') {
      // toast({ title: "Door Control", description: `Door for room ${get().rooms.find(r=>r.id === roomId)?.number} opened.` });
      console.log(`Simulated BLE: Door opened for room ${roomId}`);
    }
  },
}));

// Initialize rooms when store is first created/imported
useRoomStore.getState().initializeRooms(INITIAL_ROOMS);
