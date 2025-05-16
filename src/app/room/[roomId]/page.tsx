
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
  // const { user } = useHydratedAuthStore(state => ({ user: state.user })); // User not directly causing the issue here

  // Room store states
  const roomFromStore = useRoomStore(state => state.rooms.find(r => r.id === roomId));
  const toggleRoomControl = useRoomStore(state => state.toggleRoomControl);
  const connectToRoomBLE = useRoomStore(state => state.connectToRoomBLE);
  const disconnectFromRoomBLE = useRoomStore(state => state.disconnectFromRoomBLE);
  const sendBLECommand = useRoomStore(state => state.sendBLECommand);
  const bleStates = useRoomStore(state => state.bleStates);

  const [bleState, setBleState] = useState<BLEDeviceState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (roomFromStore) {
      if (bleStates[roomFromStore.id]) {
        setBleState(bleStates[roomFromStore.id]);
      } else {
        // Fallback if BLE state for this room isn't initialized in store (should be by initializeRooms)
        setBleState({ connected: false, statusMessage: 'Disconnected' });
      }
    } else {
      // Room not found or still loading, reset BLE state
      setBleState(null);
    }
  }, [roomFromStore, bleStates]);


  const handleConnectBLE = async () => {
    if (!roomFromStore) return;
    setIsConnecting(true);
    toast({ title: "BLE", description: `Connecting to Room ${roomFromStore.number}...` });
    try {
      await connectToRoomBLE(roomFromStore.id);
      toast({ title: "BLE", description: `Connected to Room ${roomFromStore.number}.` });
    } catch (error) {
      toast({ title: "BLE Connection Failed", description: (error as Error).message || "Could not connect.", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectBLE = async () => {
    if (!roomFromStore) return;
    await disconnectFromRoomBLE(roomFromStore.id);
    toast({ title: "BLE", description: `Disconnected from Room ${roomFromStore.number}.` });
  };

  const handleOpenDoor = async () => {
    if (!roomFromStore || !bleState?.connected) {
      toast({ title: "BLE Error", description: "Connect to room device first to open door.", variant: "destructive" });
      return;
    }
    toast({ title: "Door Control", description: `Sending open command to Room ${roomFromStore.number}...` });
    await sendBLECommand(roomFromStore.id, 'OPEN_DOOR');
    // Success/failure toast can be handled within sendBLECommand or via its return if more detailed status is needed
    toast({ title: "Door Control", description: `Door for Room ${roomFromStore.number} opened.` });
  };

  const handleToggleControl = (control: keyof RoomType['currentControls']) => {
    if (!roomFromStore) return;
    if (!bleState?.connected && control !== 'power' && !roomFromStore.currentControls.power) { 
        toast({ title: "BLE Error", description: "Connect to room device to control amenities, or ensure main power is on.", variant: "destructive" });
        return;
    }
    toggleRoomControl(roomFromStore.id, control);
    // The toast will reflect the action, the actual state change comes from the store update
    const intendedNewStatus = !roomFromStore.currentControls[control];
    toast({ title: "Room Control", description: `${control.charAt(0).toUpperCase() + control.slice(1)} turned ${intendedNewStatus ? 'ON' : 'OFF'}.` });
  };


  if (!isClient) {
    // Show skeleton during server render or initial hydration phase
    // AuthGuard might also show its own skeleton, this is an additional fallback
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
  
  if (!roomFromStore) {
    // After client hydration, if roomFromStore is still not found, it means the room doesn't exist.
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
  
  // At this point, roomFromStore is available and contains the latest data including currentControls.
  return (
    <AuthGuard allowedRoles={['guest']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Room {roomFromStore.number} Controls</h1>
          <p className="text-muted-foreground">{roomFromStore.type}</p>
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
                  checked={roomFromStore.currentControls.light}
                  onCheckedChange={() => handleToggleControl('light')}
                  disabled={!roomFromStore.currentControls.power && !bleState?.connected } // Light needs power OR direct BLE connection if power is master
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-background shadow">
                <Label htmlFor="ac-switch" className="flex items-center text-lg">
                  <AirVent className="mr-3 h-6 w-6 text-blue-400" /> Air Conditioner
                </Label>
                <Switch
                  id="ac-switch"
                  checked={roomFromStore.currentControls.ac}
                  onCheckedChange={() => handleToggleControl('ac')}
                  disabled={!roomFromStore.currentControls.power && !bleState?.connected } // AC needs power OR direct BLE
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg bg-background shadow">
                <Label htmlFor="power-switch" className="flex items-center text-lg">
                  <Zap className="mr-3 h-6 w-6 text-green-500" /> Main Power
                </Label>
                <Switch
                  id="power-switch"
                  checked={roomFromStore.currentControls.power}
                  onCheckedChange={() => handleToggleControl('power')}
                  // Main power can ideally always be toggled locally, or via BLE if available
                />
              </div>
            </div>
            {!roomFromStore.currentControls.power && (
                <p className="text-sm text-destructive text-center mt-2">Main power is off. Light and AC might be disabled unless controlled directly via BLE (if connected).</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

