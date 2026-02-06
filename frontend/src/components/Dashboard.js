import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DeviceManagement from './DeviceManagement';
import ConfigurationPanel from './ConfigurationPanel';
import ONTManagement from './ONTManagement';
import TerminalPanel from './TerminalPanel';
import UserManagement from './UserManagement';
import { Activity, Settings, Server, Terminal, Wifi, LogOut, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = ({ API }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await fetch(`${API}/devices`);
      const data = await response.json();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0]);
      }
    } catch (error) {
      toast.error('Gagal memuat device');
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleDeviceUpdated = () => {
    loadDevices();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Rafa Hotspot Logo" className="h-16 w-16" />
              <div>
                <h1 className="text-4xl font-bold text-white">Rafa Hotspot</h1>
                <p className="text-blue-200 text-lg">ONT Registration Management System</p>
              </div>
            </div>
            
            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-white font-semibold">{user?.full_name}</div>
                <div className="text-blue-300 text-sm capitalize">{user?.role}</div>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-300" />
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-200">Total Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{devices.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-200">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {devices.filter(d => d.is_connected).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-200">Active ONTs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">-</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400 animate-pulse" />
                <span className="text-lg font-semibold text-white">Online</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <Tabs defaultValue={user?.permissions?.ont_management_view ? "ont" : "devices"} className="w-full">
              <TabsList className={`grid w-full bg-slate-800/50 ${
                user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-1'
              }`}>
                {user?.permissions?.devices && (
                  <TabsTrigger value="devices" className="data-[state=active]:bg-blue-500 text-white">
                    <Server className="w-4 h-4 mr-2" />
                    Devices
                  </TabsTrigger>
                )}
                {user?.permissions?.configuration && (
                  <TabsTrigger value="configuration" className="data-[state=active]:bg-blue-500 text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuration
                  </TabsTrigger>
                )}
                {user?.permissions?.ont_management_view && (
                  <TabsTrigger value="ont" className="data-[state=active]:bg-blue-500 text-white">
                    <Activity className="w-4 h-4 mr-2" />
                    ONT Management
                  </TabsTrigger>
                )}
                {user?.permissions?.terminal && (
                  <TabsTrigger value="terminal" className="data-[state=active]:bg-blue-500 text-white">
                    <Terminal className="w-4 h-4 mr-2" />
                    Terminal
                  </TabsTrigger>
                )}
                {user?.permissions?.user_management && (
                  <TabsTrigger value="users" className="data-[state=active]:bg-blue-500 text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </TabsTrigger>
                )}
              </TabsList>

              {user?.permissions?.devices && (
                <TabsContent value="devices" className="mt-6">
                  <DeviceManagement 
                    API={API}
                    devices={devices}
                    onDeviceSelect={handleDeviceSelect}
                    onDeviceUpdated={handleDeviceUpdated}
                    selectedDevice={selectedDevice}
                  />
                </TabsContent>
              )}

              {user?.permissions?.configuration && (
                <TabsContent value="configuration" className="mt-6">
                  <ConfigurationPanel 
                    API={API}
                    selectedDevice={selectedDevice}
                  />
                </TabsContent>
              )}

              {user?.permissions?.ont_management_view && (
                <TabsContent value="ont" className="mt-6">
                  <ONTManagement 
                    API={API}
                    devices={devices}
                    selectedDevice={selectedDevice}
                  />
                </TabsContent>
              )}

              {user?.permissions?.terminal && (
                <TabsContent value="terminal" className="mt-6">
                  <TerminalPanel 
                    API={API}
                    selectedDevice={selectedDevice}
                  />
                </TabsContent>
              )}

              {user?.permissions?.user_management && (
                <TabsContent value="users" className="mt-6">
                  <UserManagement API={API} />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-blue-200 text-sm">
          <p>© 2025 Rafa Hotspot - ONT Registration System v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
