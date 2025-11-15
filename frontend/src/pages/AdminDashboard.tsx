import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bus, 
  Users, 
  Clock, 
  TrendingUp, 
  Plus,
  LogOut,
  Edit,
  Trash2
} from 'lucide-react'; // Removed 'Download'
import { toast } from 'sonner';
import lnmiitLogo from '@/assets/lnmiit-logo.png';
import apiFetch from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface BusData {
  id: string;
  busNumber: string;
  route: string;
  driver: string;
  totalSeats: number;
  bookedSeats: number;
  departureTime: string;
  arrivalTime: string;
}

interface StatsData {
  totalBuses: number;
  totalBookings: number;
  totalWaiting: number;
  totalCapacity: number;
  occupancyRate: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuth();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoadingBuses, setIsLoadingBuses] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [editingBus, setEditingBus] = useState<BusData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [newBus, setNewBus] = useState({
    busNumber: '',
    route: '',
    driver: '',
    totalSeats: 40,
    departureTime: '',
    arrivalTime: '',
  });

  const fetchBuses = async () => {
    setIsLoadingBuses(true);
    try {
      const data = await apiFetch('/buses');
      setBuses(data);
    } catch (error: any) {
      toast.error(`Failed to fetch buses: ${error.message}`);
    } finally {
      setIsLoadingBuses(false);
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await apiFetch('/admin/stats');
      setStats(data);
    } catch (error: any) {
      toast.error(`Failed to fetch stats: ${error.message}`);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchBuses();
    fetchStats();
  }, []);

  const handleAddBus = async () => {
    if (!newBus.busNumber || !newBus.route || !newBus.driver || !newBus.departureTime || !newBus.arrivalTime) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await apiFetch('/buses', {
        method: 'POST',
        body: newBus
      });
      toast.success('Bus added successfully!');
      setNewBus({
        busNumber: '',
        route: '',
        driver: '',
        totalSeats: 40,
        departureTime: '',
        arrivalTime: '',
      });
      fetchBuses();
      fetchStats();
    } catch (error: any) {
      toast.error(`Failed to add bus: ${error.message}`);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingBus) return;
    const { id, value, type } = e.target;
    
    setEditingBus({
      ...editingBus,
      [id]: type === 'number' ? parseInt(value) || 0 : value,
    });
  };

  const handleUpdateBus = async () => {
    if (!editingBus) return;
  
    if (!editingBus.busNumber || !editingBus.route || !editingBus.driver || !editingBus.departureTime || !editingBus.arrivalTime) {
      toast.error('All fields must be filled');
      return;
    }

    try {
      await apiFetch(`/buses/${editingBus.id}`, {
        method: 'PUT',
        body: {
          ...editingBus,
          totalSeats: Number(editingBus.totalSeats)
        }
      });
      toast.success('Bus updated successfully!');
      setIsEditModalOpen(false); 
      setEditingBus(null); 
      fetchBuses(); 
      fetchStats(); 
    } catch (error: any) {
      toast.error(`Failed to update bus: ${error.message}`);
    }
  };

  const handleDeleteBus = async (id: string) => {
    try {
      await apiFetch(`/buses/${id}`, {
        method: 'DELETE',
      });
      toast.success('Bus removed successfully!');
      fetchBuses();
      fetchStats();
    } catch (error: any) {
      toast.error(`Failed to delete bus: ${error.message}`);
    }
  };

  // --- REMOVED handleDownloadReport function ---

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const StatsCard = ({ title, value, icon, loading }: { title: string, value: string | number | undefined, icon: React.ReactNode, loading: boolean }) => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {loading ? <Skeleton className="h-8 w-1/3" /> : <p className="text-3xl font-bold text-primary">{value}</p>}
          {icon}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={lnmiitLogo} alt="LNMIIT Logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground">LNMIIT Bus Booking</h1>
                <p className="text-sm text-muted-foreground">Admin Portal</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Buses" value={stats?.totalBuses} icon={<Bus className="h-8 w-8 text-primary/40" />} loading={isLoadingStats} />
          <StatsCard title="Total Bookings" value={stats?.totalBookings} icon={<Users className="h-8 w-8 text-primary/40" />} loading={isLoadingStats} />
          <StatsCard title="Occupancy Rate" value={`${stats?.occupancyRate || 0}%`} icon={<TrendingUp className="h-8 w-8 text-primary/40" />} loading={isLoadingStats} />
          <StatsCard title="Waiting List" value={stats?.totalWaiting} icon={<Clock className="h-8 w-8 text-primary/40" />} loading={isLoadingStats} />
        </div>

        {/* Main Content Tabs */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <Tabs defaultValue="buses" className="space-y-6">
            {/* --- UPDATED TabsList --- */}
            <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
              <TabsTrigger value="buses">Manage Buses</TabsTrigger>
              <TabsTrigger value="add">Add Bus</TabsTrigger>
            </TabsList>
            {/* --- END OF UPDATE --- */}

            {/* Manage Buses Tab */}
            <TabsContent value="buses" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Active Buses</h2>
              </div>
              
              {isLoadingBuses ? (
                <div className="grid gap-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {buses.map((bus) => (
                    <Card key={bus.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{bus.busNumber}</CardTitle>
                              <Badge variant={bus.bookedSeats >= bus.totalSeats ? 'destructive' : 'default'}>
                                {bus.bookedSeats}/{bus.totalSeats} Seats
                              </Badge>
                            </div>
                            <CardDescription className="text-base">{bus.route}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingBus(bus)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete bus {bus.busNumber} and all its associated bookings. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteBus(bus.id)}>
                                    Yes, Delete Bus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Driver</p>
                            <p className="font-semibold">{bus.driver}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Departure</p>
                            <p className="font-semibold">{bus.departureTime}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Occupancy</p>
                            <p className="font-semibold">
                              {((bus.bookedSeats / bus.totalSeats) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                            style={{ width: `${(bus.bookedSeats / bus.totalSeats) * 100}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Add Bus Tab */}
            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Bus</CardTitle>
                  <CardDescription>Enter the details of the new bus to add to the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="busNumber">Bus Number</Label>
                      <Input 
                        id="busNumber" 
                        placeholder="CB-105"
                        value={newBus.busNumber}
                        onChange={(e) => setNewBus({...newBus, busNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="route">Route</Label>
                      <Input 
                        id="route" 
                        placeholder="West Campus - Main Campus"
                        value={newBus.route}
                        onChange={(e) => setNewBus({...newBus, route: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver">Driver Name</Label>
                      <Input 
                        id="driver" 
                        placeholder="John Doe"
                        value={newBus.driver}
                        onChange={(e) => setNewBus({...newBus, driver: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departureTime">Departure Time</Label>
                      <Input 
                        id="departureTime" 
                        placeholder="09:00 AM"
                        value={newBus.departureTime}
                        onChange={(e) => setNewBus({...newBus, departureTime: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="arrivalTime">Arrival Time</Label>
                      <Input 
                        id="arrivalTime" 
                        placeholder="09:45 AM"
                        value={newBus.arrivalTime}
                        onChange={(e) => setNewBus({...newBus, arrivalTime: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalSeats">Total Seats</Label>
                      <Input 
                        id="totalSeats" 
                        type="number"
                        value={newBus.totalSeats}
                        onChange={(e) => setNewBus({...newBus, totalSeats: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    onClick={handleAddBus}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bus
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- REPORTS TAB CONTENT REMOVED --- */}

          </Tabs>

          {/* Edit Bus Dialog Content */}
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Bus: {editingBus?.busNumber}</DialogTitle>
              <DialogDescription>
                Make changes to the bus details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="busNumber" className="text-right">Bus Number</Label>
                <Input id="busNumber" value={editingBus?.busNumber || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="route" className="text-right">Route</Label>
                <Input id="route" value={editingBus?.route || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="driver" className="text-right">Driver</Label>
                <Input id="driver" value={editingBus?.driver || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departureTime" className="text-right">Departure</Label>
                <Input id="departureTime" value={editingBus?.departureTime || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="arrivalTime" className="text-right">Arrival</Label>
                <Input id="arrivalTime" value={editingBus?.arrivalTime || ''} onChange={handleEditInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="totalSeats" className="text-right">Total Seats</Label>
                <Input id="totalSeats" type="number" value={editingBus?.totalSeats || 40} onChange={handleEditInputChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setEditingBus(null)}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateBus}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> 
      </main>
    </div>
  );
};

export default AdminDashboard;