"use client";

import { useRoomStore } from '@/stores/roomStore';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BarChart, Users, BedDouble, ZapOff, Zap } from 'lucide-react';
import type { Room } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer as RechartsResponsiveContainer } from '@/components/ui/chart'; // Assuming recharts components are exported this way
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';


const chartConfig = {
  available: { label: "Available", color: "hsl(var(--chart-2))" },
  occupied: { label: "Occupied", color: "hsl(var(--chart-1))" },
  maintenance: { label: "Maintenance", color: "hsl(var(--muted))" },
};

export default function AdminDashboardPage() {
  const roomsFromStore = useRoomStore(state => state.rooms);
  const toggleRoomControl = useRoomStore(state => state.toggleRoomControl);
  const updateRoomStatus = useRoomStore(state => state.updateRoomStatus); // For manual status override by admin
  const { toast } = useToast();

  // Local state to ensure client-side rendering for the chart
  const [rooms, setRooms] = useState<Room[]>([]);
  useEffect(() => {
    setRooms(roomsFromStore);
  }, [roomsFromStore]);


  const roomStatusCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {} as Record<Room['status'], number>);

  const chartData = [
    { status: 'Available', count: roomStatusCounts.available || 0, fill: "var(--color-available)" },
    { status: 'Occupied', count: roomStatusCounts.occupied || 0, fill: "var(--color-occupied)" },
    { status: 'Maintenance', count: roomStatusCounts.maintenance || 0, fill: "var(--color-maintenance)" },
  ];

  const handleRemoteTogglePower = (roomId: string, currentPowerState: boolean) => {
    toggleRoomControl(roomId, 'power');
    toast({
      title: "Remote Control",
      description: `Power for room ${rooms.find(r => r.id === roomId)?.number} turned ${!currentPowerState ? 'ON' : 'OFF'}.`,
    });
  };
  
  // Example of admin changing room status manually (e.g., after cleaning)
  const handleAdminSetRoomStatus = (roomId: string, newStatus: Room['status']) => {
    updateRoomStatus(roomId, newStatus);
     toast({
      title: "Room Status Update",
      description: `Room ${rooms.find(r => r.id === roomId)?.number} status set to ${newStatus}.`,
    });
  };


  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <BedDouble className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
              <p className="text-xs text-muted-foreground">All rooms in the hotel</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomStatusCounts.occupied || 0}</div>
              <p className="text-xs text-muted-foreground">Currently occupied by guests</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
              <BedDouble className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomStatusCounts.available || 0}</div>
              <p className="text-xs text-muted-foreground">Ready for booking</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart className="mr-2 h-5 w-5" />Room Status Overview</CardTitle>
            <CardDescription>Current distribution of room statuses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            {rooms.length > 0 ? ( // Render chart only if rooms data is loaded
              <RechartsResponsiveContainer width="100%" height="100%">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={4} />
                  </BarChart>
                </ChartContainer>
              </RechartsResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Room Management</CardTitle>
            <CardDescription>View and manage individual room statuses and controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Main Power</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.number}</TableCell>
                    <TableCell>{room.type}</TableCell>
                    <TableCell>
                      <Badge variant={
                        room.status === 'available' ? 'default' :
                        room.status === 'occupied' ? 'secondary' : // Use secondary for occupied
                        'destructive' // Use destructive for maintenance
                      }
                      className={
                        room.status === 'available' ? 'bg-green-500 hover:bg-green-600 text-white' :
                        room.status === 'occupied' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                        '' // Destructive already has styling
                      }
                      >
                        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`power-${room.id}`}
                          checked={room.currentControls.power}
                          onCheckedChange={() => handleRemoteTogglePower(room.id, room.currentControls.power)}
                        />
                        <Label htmlFor={`power-${room.id}`}>{room.currentControls.power ? <Zap className="text-green-500"/> : <ZapOff className="text-red-500"/>}</Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* Example: Admin manually sets room to available */}
                       {room.status !== 'available' && (
                        <Button variant="outline" size="sm" onClick={() => handleAdminSetRoomStatus(room.id, 'available')}>
                          Set Available
                        </Button>
                       )}
                       {room.status !== 'maintenance' && (
                        <Button variant="outline" size="sm" onClick={() => handleAdminSetRoomStatus(room.id, 'maintenance')}>
                          Set Maintenance
                        </Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
