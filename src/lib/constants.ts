import type { Room } from '@/types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room101',
    number: '101',
    type: 'Standard Single',
    status: 'available',
    amenities: ['Wifi', 'TV', 'Desk'],
    pricePerNight: 80,
    currentControls: { light: false, ac: false, power: true },
  },
  {
    id: 'room102',
    number: '102',
    type: 'Standard Double',
    status: 'available',
    amenities: ['Wifi', 'TV', 'Mini-bar'],
    pricePerNight: 120,
    currentControls: { light: false, ac: false, power: true },
  },
  {
    id: 'room103',
    number: '103',
    type: 'Suite',
    status: 'occupied',
    amenities: ['Wifi', 'TV', 'Mini-bar', 'Jacuzzi'],
    pricePerNight: 200,
    currentControls: { light: true, ac: true, power: true },
  },
  {
    id: 'room201',
    number: '201',
    type: 'Deluxe King',
    status: 'maintenance',
    amenities: ['Wifi', 'Large TV', 'Balcony', 'Coffee Maker'],
    pricePerNight: 180,
    currentControls: { light: false, ac: false, power: false },
  },
  {
    id: 'room202',
    number: '202',
    type: 'Family Room',
    status: 'available',
    amenities: ['Wifi', 'TV', 'Bunk Beds', 'Kitchenette'],
    pricePerNight: 220,
    currentControls: { light: false, ac: false, power: true },
  },
];
