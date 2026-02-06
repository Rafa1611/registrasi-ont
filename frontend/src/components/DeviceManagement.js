import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Power, PowerOff, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const DeviceManagement = ({ API, devices, onDeviceSelect, onDeviceUpdated, selectedDevice }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    port: 23,
    username: '',
    password: '',
    identifier: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 23 : value
    }));
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Device berhasil ditambahkan!');
        setIsAddDialogOpen(false);
        setFormData({ name: '', ip_address: '', port: 23, username: '', password: '', identifier: '' });
        onDeviceUpdated();
      } else {
        toast.error('Gagal menambahkan device');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEditDevice = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/devices/${editingDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Device berhasil diupdate!');
        setIsEditDialogOpen(false);
        setEditingDevice(null);
        onDeviceUpdated();
      } else {
        toast.error('Gagal mengupdate device');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus device ini?')) return;

    try {
      const response = await fetch(`${API}/devices/${deviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Device berhasil dihapus!');
        onDeviceUpdated();
      } else {
        toast.error('Gagal menghapus device');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleConnect = async (deviceId) => {
    try {
      const response = await fetch(`${API}/devices/${deviceId}/connect`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Berhasil terhubung ke device!');
        onDeviceUpdated();
      } else {
        toast.error('Gagal terhubung: ' + data.message);
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDisconnect = async (deviceId) => {
    try {
      const response = await fetch(`${API}/devices/${deviceId}/disconnect`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Device berhasil diputus!');
        onDeviceUpdated();
      } else {
        toast.error('Gagal memutus koneksi');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const openEditDialog = (device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      ip_address: device.ip_address,
      port: device.port,
      username: device.username,
      password: device.password,
      identifier: device.identifier || ''
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Device Management</h2>
          <p className="text-blue-200">Kelola OLT devices Anda</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600" data-testid="add-device-btn">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Device
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>Tambah OLT Device Baru</DialogTitle>
              <DialogDescription className="text-slate-400">
                Masukkan informasi OLT device yang akan ditambahkan
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Device</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="device-name-input"
                />
              </div>
              <div>
                <Label htmlFor="ip_address">IP Address</Label>
                <Input
                  id="ip_address"
                  name="ip_address"
                  value={formData.ip_address}
                  onChange={handleInputChange}
                  required
                  placeholder="10.11.104.2"
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="device-ip-input"
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  value={formData.port}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="device-port-input"
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="device-username-input"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="device-password-input"
                />
              </div>
              <div>
                <Label htmlFor="identifier">Identifier (Opsional)</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="device-identifier-input"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" data-testid="submit-device-btn">
                Tambah Device
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Edit OLT Device</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update informasi OLT device
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDevice} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Device</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-ip_address">IP Address</Label>
              <Input
                id="edit-ip_address"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleInputChange}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-port">Port</Label>
              <Input
                id="edit-port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleInputChange}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Password</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-identifier">Identifier (Opsional)</Label>
              <Input
                id="edit-identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
              Update Device
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Device List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 col-span-2">
            <CardContent className="p-8 text-center">
              <p className="text-slate-400">Belum ada device. Tambahkan device pertama Anda!</p>
            </CardContent>
          </Card>
        ) : (
          devices.map((device) => (
            <Card 
              key={device.id} 
              className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:border-blue-500 ${
                selectedDevice?.id === device.id ? 'border-blue-500 ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onDeviceSelect(device)}
              data-testid={`device-card-${device.id}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {device.name}
                      {device.is_connected ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {device.ip_address}:{device.port}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-300">
                  <p><span className="font-semibold">Username:</span> {device.username}</p>
                  <p><span className="font-semibold">Identifier:</span> {device.identifier || '-'}</p>
                  {device.last_connected && (
                    <p className="text-xs text-slate-400">
                      Last connected: {new Date(device.last_connected).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  {device.is_connected ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect(device.id);
                      }}
                      data-testid={`disconnect-btn-${device.id}`}
                    >
                      <PowerOff className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(device.id);
                      }}
                      data-testid={`connect-btn-${device.id}`}
                    >
                      <Power className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(device);
                    }}
                    data-testid={`edit-btn-${device.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDevice(device.id);
                    }}
                    data-testid={`delete-btn-${device.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DeviceManagement;
