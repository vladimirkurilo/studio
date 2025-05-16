
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, BedDouble, Users, Brain } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoomStore } from '@/stores/roomStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useHydratedAuthStore } from '@/stores/authStore';
import type { Room } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { roomAssignmentSuggestions, type RoomAssignmentInput, type RoomAssignmentOutput } from '@/ai/flows/room-assignment-suggestions';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import Image from 'next/image';

const bookingSchema = z.object({
  checkInDate: z.date({ required_error: "Check-in date is required." }),
  checkOutDate: z.date({ required_error: "Check-out date is required." }),
  roomType: z.string().optional(),
  guestPreferences: z.string().optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Check-out date must be after check-in date.",
  path: ["checkOutDate"],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const ANY_ROOM_TYPE_VALUE = "_any_room_type_";

export default function BookingPage() {
  const rooms = useRoomStore(state => state.rooms);
  const { addBooking } = useBookingStore();
  const { user } = useHydratedAuthStore(state => ({user: state.user}));
  const { toast } = useToast();
  const router = useRouter();

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<RoomAssignmentOutput | null>(null);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const { control, handleSubmit, watch, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      guestPreferences: user?.name ? `Repeat guest ${user.name}` : "New guest, prefers quiet room.",
      roomType: ANY_ROOM_TYPE_VALUE,
    },
  });

  const watchedCheckInDate = watch("checkInDate");
  const watchedCheckOutDate = watch("checkOutDate");
  const watchedRoomType = watch("roomType");

  useEffect(() => {
    if (watchedCheckInDate && watchedCheckOutDate) {
      const filtered = rooms.filter(room => 
        room.status === 'available' && 
        (!watchedRoomType || watchedRoomType === ANY_ROOM_TYPE_VALUE || room.type === watchedRoomType)
      );
      setAvailableRooms(filtered);
    }
  }, [watchedCheckInDate, watchedCheckOutDate, watchedRoomType, rooms]);

  const handleSearch = (data: BookingFormValues) => {
    toast({ title: "Searching Rooms", description: "Finding available rooms for your dates." });
  };

  const handleAISuggestion = async () => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in to get AI-powered room suggestions.", variant: "destructive" });
        router.push('/login');
        return;
    }
    
    setIsAISuggesting(true);
    setAiSuggestion(null);
    const formData = watch();
    const roomAvailability = availableRooms.map(r => `${r.number} (${r.type}) - ${r.status}`).join(', ');
    
    const input: RoomAssignmentInput = {
      guestPreferences: formData.guestPreferences || "No specific preferences.",
      roomAvailability: roomAvailability || "No rooms currently available for selection.",
      historicalData: "Mock historical data: similar guests often prefer higher floors.",
    };

    try {
      const suggestion = await roomAssignmentSuggestions(input);
      setAiSuggestion(suggestion);
      toast({ title: "AI Suggestion Ready", description: `AI suggests room ${suggestion.suggestedRoom}. Reason: ${suggestion.reasoning}` });
      const suggestedRoom = availableRooms.find(r => r.number === suggestion.suggestedRoom);
      if (suggestedRoom) {
          // Highlight or pre-select this room in the UI
      }

    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({ title: "AI Suggestion Error", description: "Could not get AI suggestion at this time.", variant: "destructive" });
    } finally {
      setIsAISuggesting(false);
    }
  };

  const handleBookRoom = async (room: Room) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to book a room.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setSelectedRoomForBooking(room); 
  };
  
  const confirmBooking = async () => {
    if (!selectedRoomForBooking || !user) return;
    
    setIsBooking(true);
    const { checkInDate, checkOutDate } = watch(); // Get current values for booking

    const bookingResult = await addBooking(user.id, user.name, selectedRoomForBooking, checkInDate, checkOutDate);
    setIsBooking(false);

    if (bookingResult) {
      toast({ title: "Booking Confirmed!", description: `Room ${selectedRoomForBooking.number} is yours from ${format(checkInDate, 'PPP')} to ${format(checkOutDate, 'PPP')}.` });
      setSelectedRoomForBooking(null); 
      router.push(`/my-booking`); 
    } else {
      toast({ title: "Booking Failed", description: "Could not book the room. It might no longer be available.", variant: "destructive" });
    }
  };

  const roomTypes = Array.from(new Set(rooms.map(r => r.type)));

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Find Your Perfect Stay</CardTitle>
          <CardDescription>Select your dates and preferences to find available rooms.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSearch)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <Controller
                name="checkInDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="checkInDate" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.checkInDate && <p className="text-sm text-destructive">{errors.checkInDate.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="checkOutDate">Check-out Date</Label>
              <Controller
                name="checkOutDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="checkOutDate" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.checkOutDate && <p className="text-sm text-destructive">{errors.checkOutDate.message}</p>}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="roomType">Room Type (Optional)</Label>
              <Controller
                name="roomType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ANY_ROOM_TYPE_VALUE}>
                    <SelectTrigger id="roomType">
                      <SelectValue placeholder="Any Room Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY_ROOM_TYPE_VALUE}>Any Room Type</SelectItem>
                      {roomTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-full">
                <Label htmlFor="guestPreferences">Guest Preferences (for AI)</Label>
                <Controller
                    name="guestPreferences"
                    control={control}
                    render={({ field }) => (
                        <Input id="guestPreferences" {...field} placeholder="e.g., quiet room, high floor, near elevator"/>
                    )}
                />
            </div>
            <Button type="button" onClick={handleAISuggestion} className="w-full lg:w-auto" disabled={isAISuggesting}>
              <Brain className="mr-2 h-4 w-4" /> {isAISuggesting ? 'Thinking...' : 'Get AI Room Suggestion'}
            </Button>
          </form>
          {errors.root && <p className="text-sm text-destructive mt-2">{errors.root.message}</p>}
           {aiSuggestion && (
            <Card className="mt-4 bg-accent/10 border-accent">
              <CardHeader>
                <CardTitle className="text-accent flex items-center"><Brain className="mr-2 h-5 w-5"/> AI Suggestion</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Suggested Room:</strong> {aiSuggestion.suggestedRoom}</p>
                <p><strong>Reasoning:</strong> {aiSuggestion.reasoning}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Rooms</h2>
        {availableRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRooms.map(room => (
              <Card key={room.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                 <div className="relative w-full h-48">
                    <Image src={`https://placehold.co/600x400.png?text=Room+${room.number}`} alt={room.type} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint="hotel room interior" />
                  </div>
                <CardHeader>
                  <CardTitle>{room.number} - {room.type}</CardTitle>
                  <CardDescription>${room.pricePerNight} per night. Amenities: {room.amenities.join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* Additional room details can go here */}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleBookRoom(room)}>
                    Book Room {room.number}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p>No rooms available for the selected criteria. Try adjusting your dates or room type.</p>
        )}
      </section>
      
      {selectedRoomForBooking && (
        <Dialog open={!!selectedRoomForBooking} onOpenChange={(isOpen) => !isOpen && setSelectedRoomForBooking(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Your Booking</DialogTitle>
                    <DialogDescription>
                        You are about to book Room {selectedRoomForBooking.number} ({selectedRoomForBooking.type})
                        from {format(watch("checkInDate"), "PPP")} to {format(watch("checkOutDate"), "PPP")}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p><strong>Room:</strong> {selectedRoomForBooking.number} - {selectedRoomForBooking.type}</p>
                    <p><strong>Price per night:</strong> ${selectedRoomForBooking.pricePerNight}</p>
                    <p><strong>Check-in:</strong> {format(watch("checkInDate"), "PPP")}</p>
                    <p><strong>Check-out:</strong> {format(watch("checkOutDate"), "PPP")}</p>
                    <p className="font-bold mt-2">Total Price: ${
                        Math.ceil((watch("checkOutDate").getTime() - watch("checkInDate").getTime()) / (1000 * 3600 * 24)) * selectedRoomForBooking.pricePerNight
                    }</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={() => setSelectedRoomForBooking(null)}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={confirmBooking} disabled={isBooking}>
                        {isBooking ? "Booking..." : "Confirm & Book"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
