import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';

const ONTManagement = ({ API, devices, selectedDevice }) => {
  const [onts, setOnts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    olt_device_id: '',
    ont_id: 0,
    serial_number: '',
    frame: 0,
    board: 1,
    port: 3,
    vlan: '41',
    line_profile_id: 1,
    service_profile_id: 1,
    dba_profile_id: 1,
    gemport: '1'
  });

  useEffect(() => {
    if (selectedDevice) {
      loadONTs();
      setFormData(prev => ({ ...prev, olt_device_id: selectedDevice.id }));
    }
  }, [selectedDevice]);

  const loadONTs = async () => {
    if (!selectedDevice) return;
    try {
      const response = await fetch(`${API}/ont/device/${selectedDevice.id}`);
      if (response.ok) {
        const data = await response.json();
        setOnts(data);
      }
    } catch (error) {
      console.error('Error loading ONTs:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['ont_id', 'frame', 'board', 'port', 'line_profile_id', 'service_profile_id', 'dba_profile_id'].includes(name) 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleAddONT = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/ont`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('ONT berhasil didaftarkan!');
        setIsAddDialogOpen(false);
        setFormData({
          olt_device_id: selectedDevice.id,
          ont_id: 0,
          serial_number: '',
          frame: 0,
          board: 1,
          port: 3,
          vlan: '41',
          line_profile_id: 1,
          service_profile_id: 1,
          dba_profile_id: 1,
          gemport: '1'
        });
        loadONTs();
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDeleteONT = async (ontId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ONT ini?')) return;
    try {
      const response = await fetch(`${API}/ont/${ontId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('ONT berhasil dihapus!');
        loadONTs();
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  if (!selectedDevice) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Pilih device terlebih dahulu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">ONT Management</h2>
          <p className="text-blue-200">Device: {selectedDevice.name}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Register ONT
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-slate-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register ONT Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddONT} className="space-y-4">
              <div>
                <Label>ONT ID</Label>
                <Input name="ont_id" type="number" value={formData.ont_id} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input name="serial_number" value={formData.serial_number} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Line Profile</Label>
                  <Input name="line_profile_id" type="number" value={formData.line_profile_id} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label>Service Profile</Label>
                  <Input name="service_profile_id" type="number" value={formData.service_profile_id} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label>DBA Profile</Label>
                  <Input name="dba_profile_id" type="number" value={formData.dba_profile_id} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GEM Port</Label>
                  <Input name="gemport" value={formData.gemport} onChange={handleInputChange} placeholder="1 atau 1,2,3" required className="bg-slate-700 border-slate-600 text-white" />
                  <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
                </div>
                <div>
                  <Label>VLAN (Single atau Multiple)</Label>
                  <Input name="vlan" value={formData.vlan} onChange={handleInputChange} placeholder="41 atau 40,42,50" required className="bg-slate-700 border-slate-600 text-white" />
                  <p className="text-xs text-slate-400 mt-1">Single: 41 | Multiple: 40,42,50</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Frame</Label>
                  <Input name="frame" type="number" value={formData.frame} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label>Board</Label>
                  <Input name="board" type="number" value={formData.board} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input name="port" type="number" value={formData.port} onChange={handleInputChange} required className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">Register ONT</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registered ONTs</CardTitle>
          <CardDescription className="text-slate-400">Total: {onts.length} ONT(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {onts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Belum ada ONT</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">ONT ID</TableHead>
                  <TableHead className="text-slate-300">Serial Number</TableHead>
                  <TableHead className="text-slate-300">Frame/Board/Port</TableHead>
                  <TableHead className="text-slate-300">VLAN</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onts.map((ont) => (
                  <TableRow key={ont.id} className="border-slate-700">
                    <TableCell className="text-white">{ont.ont_id}</TableCell>
                    <TableCell className="text-slate-300 font-mono text-sm">{ont.serial_number}</TableCell>
                    <TableCell className="text-slate-300">{ont.frame}/{ont.board}/{ont.port}</TableCell>
                    <TableCell className="text-slate-300">{ont.vlan}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500">
                        <Activity className="w-3 h-3 mr-1" />
                        {ont.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="border-red-600 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDeleteONT(ont.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ONTManagement;
