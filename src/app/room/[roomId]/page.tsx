"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoomStore } from '@/stores/roomStore';
import { useHydratedAuthStore } from '@/stores/authStore';
import type { Room as RoomType, BLEDeviceState } from '@/types';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Lightbulb, AirVent, Zap, Bluetooth, BluetoothConnected, BluetoothOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoomControlPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const { toast } = useToast();
  const { user } = useHydratedAuthStore(state => ({ user: state.user }));

  // Room store states
  const getRoomById = useRoomStore(state => state.getRoomById);
  const toggleRoomControl = useRoomStore(state => state.toggleRoomControl);
  const connectToRoomBLE = useRoomStore(state => state.connectToRoomBLE);
  const disconnectFromRoomBLE = useRoomStore(state => state.disconnectFromRoomBLE);
  const sendBLECommand = useRoomStore(state => state.sendBLECommand);
  const bleStates = useRoomStore(state => state.bleStates);
  const currentRoomControls = useRoomStore(state => state.rooms.find(r => r.id === roomId)?.currentControls);


  const [room, setRoom] = useState<RoomType | null | undefined>(undefined); // undefined for loading, null if not found
  const [bleState, setBleState] = useState<BLEDeviceState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const foundRoom = getRoomById(roomId);
    setRoom(foundRoom);
    if (foundRoom && bleStates[foundRoom.id]) {
      setBleState(bleStates[foundRoom.id]);
    } else if (foundRoom) {
      // Initialize BLE state if not present (should be handled by store init)
       setBleState({ connected: false, statusMessage: 'Disconnected' });
    }
  }, [roomId, getRoomById, bleStates]);
  
   // Effect to subscribe to room control changes
  useEffect(() => {
    if(room) {
        const roomFromStore = getRoomById(room.id);
        if (roomFromStore) {
            setRoom(prevRoom => ({...prevRoom!, currentControls: roomFromStore.currentControls}));
        }
    }
  }, [currentRoomControls, room, getRoomById]);



  const handleConnectBLE = async () => {
    if (!room) return;
    setIsConnecting(true);
    toast({ title: "BLE", description: `Connecting to Room ${room.number}...` });
    await connectToRoomBLE(room.id);
    toast({ title: "BLE", description: `Connected to Room ${room.number}.` });
    setIsConnecting(false);
  };

  const handleDisconnectBLE = async () => {
    if (!room) return;
    await disconnectFromRoomBLE(room.id);
    toast({ title: "BLE", description: `Disconnected from Room ${room.number}.` });
  };

  const handleOpenDoor = async () => {
    if (!room || !bleState?.connected) {
      toast({ title: "BLE Error", description: "Connect to room device first to open door.", variant: "destructive" });
      return;
    }
    toast({ title: "Door Control", description: `Sending open command to Room ${room.number}...` });
    await sendBLECommand(room.id, 'OPEN_DOOR');
    // Toast for success/failure can be triggered by sendBLECommand or a returned status
    toast({ title: "Door Control", description: `Door for Room ${room.number} opened.` });
  };

  const handleToggleControl = (control: keyof RoomType['currentControls']) => {
    if (!room) return;
    if (!bleState?.connected && control !== 'power') { // Allow power toggle even if not "connected" to simulate local switch
        // For specific controls like light/AC, require BLE connection
        toast({ title: "BLE Error", description: "Connect to room device to control amenities.", variant: "destructive" });
        return;
    }
    toggleRoomControl(room.id, control);
    const newStatus = !room.currentControls[control];
    toast({ title: "Room Control", description: `${control.charAt(0).toUpperCase() + control.slice(1)} turned ${newStatus ? 'ON' : 'OFF'}.` });
  };

  if (room === undefined) {
    return (
      <AuthGuard allowedRoles={['guest']}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-1/2" /></CardContent></Card>
          <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-1/2" /></CardContent></Card>
        </div>
      </AuthGuard>
    );
  }

  if (!room) {
    return (
      <AuthGuard allowedRoles={['guest']}>
        <div className="text-center py-10">
          <h1 className="text-2xl font-semibold">Room Not Found</h1>
          <p className="text-muted-foreground">The room you are looking for does not exist or is not accessible.</p>
          <Button onClick={() => router.push('/my-booking')} className="mt-4">Go to My Bookings</Button>
        </div>
      </AuthGuard>
    );
  }
  
  // Verify if the current user actually booked this room (simplified check)
  // In a real app, this would involve checking useBookingStore for a booking matching user.id and room.id
  // For this prototype, we assume if they navigated here, they have access.

  return (
    <AuthGuard allowedRoles={['guest']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Room {room.number} Controls</h1>
          <p className="text-muted-foreground">{room.type}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              {bleState?.connected ? <BluetoothConnected className="mr-2 h-6 w-6 text-green-500" /> : <BluetoothOff className="mr-2 h-6 w-6 text-red-500" />}
              BLE Device Status
            </CardTitle>
            <CardDescription>{bleState?.statusMessage || "Disconnected"}</CardDescription>
          </CardHeader>
          <CardContent>
            {bleState?.connected ? (
              <Button onClick={handleDisconnectBLE} variant="outline" className="w-full">
                Disconnect from Room Device
              </Button>
            ) : (
              <Button onClick={handleConnectBLE} className="w-full" disabled={isConnecting}>
                <Bluetooth className="mr-2 h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect to Room Device'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Access & Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={handleOpenDoor} className="w-full text-lg py-6" disabled={!bleState?.connected}>
              <KeyRound className="mr-3 h-6 w-6" /> Open Room Door
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-background shadow">
                <Label htmlFor="light-switch" className="flex items-center text-lg">
                  <Lightbulb className="mr-3 h-6 w-6 text-yellow-400" /> Light
                </Label>
                <Switch
                  id="light-switch"
                  checked={room.currentControls.light}
                  onCheckedChange={() => handleToggleControl('light')}
                  disabled={!bleState?.connected && !room.currentControls.power} // Light needs power
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-background shadow">
                <Label htmlFor="ac-switch" className="flex items-center text-lg">
                  <AirVent className="mr-3 h-6 w-6 text-blue-400" /> Air Conditioner
                </Label>
                <Switch
                  id="ac-switch"
                  checked={room.currentControls.ac}
                  onCheckedChange={() => handleToggleControl('ac')}
                  disabled={!bleState?.connected && !room.currentControls.power} // AC needs power
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg bg-background shadow">
                <Label htmlFor="power-switch" className="flex items-center text-lg">
                  <Zap className="mr-3 h-6 w-6 text-green-500" /> Main Power
                </Label>
                <Switch
                  id="power-switch"
                  checked={room.currentControls.power}
                  onCheckedChange={() => handleToggleControl('power')}
                  // Main power can always be toggled (simulates a physical master switch if BLE fails)
                />
              </div>
            </div>
            {!room.currentControls.power && (
                <p className="text-sm text-destructive text-center mt-2">Main power is off. Light and AC are disabled.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
