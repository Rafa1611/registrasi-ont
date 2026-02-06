import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Activity, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

const ONTManagement = ({ API, devices, selectedDevice }) => {
  const { user, hasPermission } = useAuth();
  const [onts, setOnts] = useState([]);
  const [detectedOnts, setDetectedOnts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showDetected, setShowDetected] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDescDialogOpen, setIsDescDialogOpen] = useState(false);
  const [selectedOntForDesc, setSelectedOntForDesc] = useState(null);
  const [tempDescription, setTempDescription] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
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
    gemport: '1',
    description: ''
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
      const response = await apiRequest(`${API}/ont/device/${selectedDevice.id}`);
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
      const response = await apiRequest(`${API}/ont`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const data = await response.json();
        toast.success('ONT berhasil didaftarkan!');
        setIsAddDialogOpen(false);
        
        // Show registration result
        setRegistrationResult(data);
        setIsResultDialogOpen(true);
        
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
          gemport: '1',
          description: ''
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

  const handleScanONT = async () => {
    if (!selectedDevice) {
      toast.error('Pilih device terlebih dahulu');
      return;
    }
    setIsScanning(true);
    try {
      const endpoint = selectedDevice.is_connected 
        ? `${API}/ont/detect/${selectedDevice.id}`
        : `${API}/ont/simulate-detect/${selectedDevice.id}`;
      
      const response = await fetch(endpoint, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setDetectedOnts(data.onts || []);
        setShowDetected(true);
        toast.success(`Terdeteksi ${data.detected_count} ONT baru!`);
      } else {
        toast.error('Gagal scan ONT');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoRegisterClick = (ont) => {
    setSelectedOntForDesc(ont);
    setTempDescription('');
    setIsDescDialogOpen(true);
  };

  const handleAutoRegisterConfirm = async () => {
    if (!selectedOntForDesc) return;
    try {
      const payload = {
        ...selectedOntForDesc,
        description: tempDescription,
        line_profile_id: 1,
        service_profile_id: 1,
        dba_profile_id: 1,
        gemport: '1',
        vlan: '41'
      };
      
      const response = await apiRequest(`${API}/ont/auto-register/${selectedDevice.id}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('ONT berhasil didaftarkan!');
        
        // Show registration result
        setRegistrationResult(data.ont);
        setIsResultDialogOpen(true);
        
        setDetectedOnts(prev => prev.filter(ont => ont.serial_number !== selectedOntForDesc.serial_number));
        loadONTs();
        setIsDescDialogOpen(false);
        setSelectedOntForDesc(null);
      } else {
        toast.warning(data.message || 'ONT sudah terdaftar');
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
        <div className="flex gap-2">
          <Button 
            className="bg-green-500 hover:bg-green-600" 
            onClick={handleScanONT}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Scan ONT Baru
              </>
            )}
          </Button>
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
              <div className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">📡 Konfigurasi Service & VLAN</h4>
                  <p className="text-xs text-blue-200 mb-3">
                    Setiap service (Internet, IPTV, VoIP) membutuhkan GEM Port dan VLAN tersendiri
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-blue-200">GEM Port</Label>
                      <Input 
                        name="gemport" 
                        value={formData.gemport} 
                        onChange={handleInputChange} 
                        placeholder="Contoh: 1" 
                        required 
                        className="bg-slate-700 border-slate-600 text-white" 
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        • Single: <span className="text-green-400">1</span><br/>
                        • Multiple: <span className="text-green-400">1,2,3</span> (pisah dengan koma)
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-blue-200">User VLAN</Label>
                      <Input 
                        name="vlan" 
                        value={formData.vlan} 
                        onChange={handleInputChange} 
                        placeholder="Contoh: 41" 
                        required 
                        className="bg-slate-700 border-slate-600 text-white" 
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        • Single Service: <span className="text-green-400">41</span><br/>
                        • Multi Service: <span className="text-green-400">41,42,50</span> (sesuai urutan GEM Port)
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                    <p className="text-xs font-semibold text-yellow-400 mb-1">💡 Contoh Konfigurasi:</p>
                    <div className="space-y-1 text-xs text-slate-300">
                      <div>• <span className="text-cyan-400">Internet saja:</span> GEM Port: <code className="text-green-400">1</code>, VLAN: <code className="text-green-400">41</code></div>
                      <div>• <span className="text-cyan-400">Internet + IPTV:</span> GEM Port: <code className="text-green-400">1,2</code>, VLAN: <code className="text-green-400">41,42</code></div>
                      <div>• <span className="text-cyan-400">Internet + IPTV + VoIP:</span> GEM Port: <code className="text-green-400">1,2,3</code>, VLAN: <code className="text-green-400">41,42,50</code></div>
                    </div>
                  </div>
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
              <div>
                <Label>Description (Opsional)</Label>
                <Input name="description" value={formData.description} onChange={handleInputChange} placeholder="Nama customer / lokasi / nomor kontrak" className="bg-slate-700 border-slate-600 text-white" />
                <p className="text-xs text-slate-400 mt-1">Untuk identifikasi customer (max 30 karakter)</p>
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">Register ONT</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {showDetected && detectedOnts.length > 0 && (
        <Card className="bg-green-900/30 border-green-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-green-400" />
                  ONT Terdeteksi (Belum Terdaftar)
                </CardTitle>
                <CardDescription className="text-green-200">
                  {detectedOnts.length} ONT baru ditemukan
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="border-green-500 text-green-400" onClick={() => setShowDetected(false)}>
                Tutup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-green-700">
                  <TableHead className="text-green-300">Serial Number</TableHead>
                  <TableHead className="text-green-300">Frame/Board/Port</TableHead>
                  <TableHead className="text-green-300">ONT ID</TableHead>
                  <TableHead className="text-green-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detectedOnts.map((ont, index) => (
                  <TableRow key={index} className="border-green-700">
                    <TableCell className="text-white font-mono text-sm">{ont.serial_number}</TableCell>
                    <TableCell className="text-green-200">{ont.frame}/{ont.board}/{ont.port}</TableCell>
                    <TableCell className="text-green-200">{ont.ont_id}</TableCell>
                    <TableCell>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleAutoRegisterClick(ont)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Register
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDescDialogOpen} onOpenChange={setIsDescDialogOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Input Description ONT</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedOntForDesc && `Serial: ${selectedOntForDesc.serial_number}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description (Opsional)</Label>
              <Input
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                placeholder="Nama customer / lokasi / nomor kontrak"
                className="bg-slate-700 border-slate-600 text-white"
                maxLength={30}
              />
              <p className="text-xs text-slate-400 mt-1">Max 30 karakter (opsional)</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAutoRegisterConfirm} className="flex-1 bg-blue-500 hover:bg-blue-600">
                Register ONT
              </Button>
              <Button onClick={() => setIsDescDialogOpen(false)} variant="outline" className="border-slate-600 text-white">
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <TableHead className="text-slate-300">Description</TableHead>
                  <TableHead className="text-slate-300">Registered By</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  {hasPermission('ont_management_delete') && (
                    <TableHead className="text-slate-300">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {onts.map((ont) => (
                  <TableRow key={ont.id} className="border-slate-700">
                    <TableCell className="text-white">{ont.ont_id}</TableCell>
                    <TableCell className="text-slate-300 font-mono text-sm">{ont.serial_number}</TableCell>
                    <TableCell className="text-slate-300">{ont.frame}/{ont.board}/{ont.port}</TableCell>
                    <TableCell className="text-slate-300">{ont.vlan}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{ont.description || '-'}</TableCell>
                    <TableCell className="text-blue-400 text-sm">{ont.registered_by || '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">
                        <Activity className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </TableCell>
                    {hasPermission('ont_management_delete') && (
                      <TableCell>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDeleteONT(ont.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
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
