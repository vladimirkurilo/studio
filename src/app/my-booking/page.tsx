"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHydratedAuthStore } from '@/stores/authStore';
import { useHydratedBookingStore } from '@/stores/bookingStore';
import type { Booking } from '@/types';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeyRound, CalendarDays, BedDouble, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBookingPage() {
  const { user } = useHydratedAuthStore(state => ({user: state.user}));
  const { getGuestBookings } = useHydratedBookingStore(state => ({getGuestBookings: state.getGuestBookings}));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const guestBookings = getGuestBookings(user.id);
      setBookings(guestBookings);
    }
  }, [user, getGuestBookings]);

  if (!user) {
    // AuthGuard will handle redirection, but this prevents premature rendering.
    // Or, you could show a specific "Please log in" message here.
    return <AuthGuard allowedRoles={['guest']}><div>Loading bookings...</div></AuthGuard>;
  }
  
  const now = new Date();
  const currentBookings = bookings.filter(b => new Date(b.checkOutDate) >= now && new Date(b.checkInDate) <= now);
  const upcomingBookings = bookings.filter(b => new Date(b.checkInDate) > now);
  const pastBookings = bookings.filter(b => new Date(b.checkOutDate) < now);


  const BookingCard = ({ booking, status }: { booking: Booking, status: "current" | "upcoming" | "past" }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Room {booking.roomNumber}</span>
          {status === "current" && <Badge variant="default" className="bg-green-500 text-white">Active</Badge>}
          {status === "upcoming" && <Badge variant="secondary">Upcoming</Badge>}
          {status === "past" && <Badge variant="outline">Past</Badge>}
        </CardTitle>
        <CardDescription>Booking ID: {booking.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center">
          <CalendarDays className="mr-2 h-5 w-5 text-primary" />
          <span>{format(new Date(booking.checkInDate), 'PPP')} - {format(new Date(booking.checkOutDate), 'PPP')}</span>
        </div>
        <div className="flex items-center">
          <UserCircle className="mr-2 h-5 w-5 text-primary" />
          <span>Guest: {booking.guestName}</span>
        </div>
        <p className="font-semibold">Total Price: ${booking.totalPrice}</p>
      </CardContent>
      {status === "current" && (
        <CardFooter>
          <Link href={`/room/${booking.roomId}`} passHref legacyBehavior>
            <Button className="w-full">
              <KeyRound className="mr-2 h-4 w-4" /> Access Room Controls
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <AuthGuard allowedRoles={['guest']}>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>

        {bookings.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-lg text-muted-foreground">You have no bookings yet.</p>
              <Button onClick={() => router.push('/')} className="mt-4">
                Book a Room
              </Button>
            </CardContent>
          </Card>
        )}

        {currentBookings.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Current Stay</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentBookings.map(booking => <BookingCard key={booking.id} booking={booking} status="current" />)}
            </div>
          </section>
        )}

        {upcomingBookings.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Upcoming Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} status="upcoming" />)}
            </div>
          </section>
        )}
        
        {pastBookings.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Past Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} status="past" />)}
            </div>
          </section>
        )}
      </div>
    </AuthGuard>
  );
}
