import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DeviceManagement from './DeviceManagement';
import ConfigurationPanel from './ConfigurationPanel';
import ONTManagement from './ONTManagement';
import TerminalPanel from './TerminalPanel';
import { Activity, Settings, Server, Terminal, Wifi } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = ({ API }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Wifi className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Huawei OLT Management System</h1>
              <p className="text-blue-200 text-lg">Comprehensive GPON/EPON Management Platform</p>
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
            <Tabs defaultValue="devices" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                <TabsTrigger value="devices" className="data-[state=active]:bg-blue-500 text-white">
                  <Server className="w-4 h-4 mr-2" />
                  Devices
                </TabsTrigger>
                <TabsTrigger value="configuration" className="data-[state=active]:bg-blue-500 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="ont" className="data-[state=active]:bg-blue-500 text-white">
                  <Activity className="w-4 h-4 mr-2" />
                  ONT Management
                </TabsTrigger>
                <TabsTrigger value="terminal" className="data-[state=active]:bg-blue-500 text-white">
                  <Terminal className="w-4 h-4 mr-2" />
                  Terminal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="devices" className="mt-6">
                <DeviceManagement 
                  API={API}
                  devices={devices}
                  onDeviceSelect={handleDeviceSelect}
                  onDeviceUpdated={handleDeviceUpdated}
                  selectedDevice={selectedDevice}
                />
              </TabsContent>

              <TabsContent value="configuration" className="mt-6">
                <ConfigurationPanel 
                  API={API}
                  selectedDevice={selectedDevice}
                />
              </TabsContent>

              <TabsContent value="ont" className="mt-6">
                <ONTManagement 
                  API={API}
                  devices={devices}
                  selectedDevice={selectedDevice}
                />
              </TabsContent>

              <TabsContent value="terminal" className="mt-6">
                <TerminalPanel 
                  API={API}
                  selectedDevice={selectedDevice}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-blue-200 text-sm">
          <p>© 2025 Huawei OLT Management System - Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
