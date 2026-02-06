import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Activity, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ONTManagement = ({ API, devices, selectedDevice }) => {
  const [onts, setOnts] = useState([]);
  const [detectedOnts, setDetectedOnts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showDetected, setShowDetected] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [autoOntId, setAutoOntId] = useState(true);
  const [nextOntId, setNextOntId] = useState(0);
  const [formData, setFormData] = useState({
    olt_device_id: '',
    ont_id: -1,
    serial_number: '',
    frame: 0,
    board: 1,
    port: 3,
    vlan: 41
  });

  useEffect(() => {
    if (selectedDevice) {
      loadONTs();
      setFormData(prev => ({ ...prev, olt_device_id: selectedDevice.id }));
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (isAddDialogOpen && autoOntId) {
      fetchNextOntId();
    }
  }, [isAddDialogOpen, formData.frame, formData.board, formData.port, autoOntId]);

  const fetchNextOntId = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await fetch(
        `${API}/ont/next-id/${selectedDevice.id}?frame=${formData.frame}&board=${formData.board}&port=${formData.port}`
      );
      if (response.ok) {
        const data = await response.json();
        setNextOntId(data.next_ont_id);
        if (autoOntId) {
          setFormData(prev => ({ ...prev, ont_id: -1 }));
        }
      }
    } catch (error) {
      console.error('Error fetching next ONT ID:', error);
    }
  };

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
    const newFormData = {
      ...formData,
      [name]: ['ont_id', 'frame', 'board', 'port', 'vlan'].includes(name) 
        ? parseInt(value) || 0 
        : value
    };
    setFormData(newFormData);
    
    // If frame/board/port changed and auto mode is on, fetch next ID
    if (['frame', 'board', 'port'].includes(name) && autoOntId) {
      setTimeout(() => fetchNextOntId(), 100);
    }
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
          ont_id: autoOntId ? -1 : 0,
          serial_number: '',
          frame: 0,
          board: 1,
          port: 3,
          vlan: 41
        });
        if (autoOntId) {
          fetchNextOntId();
        }
        loadONTs();
      } else {
        toast.error('Gagal mendaftarkan ONT');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDeleteONT = async (ontId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ONT ini?')) return;

    try {
      const response = await fetch(`${API}/ont/${ontId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('ONT berhasil dihapus!');
        loadONTs();
      } else {
        toast.error('Gagal menghapus ONT');
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
      // Use simulate endpoint for demo (change to /detect for real OLT)
      const endpoint = selectedDevice.is_connected 
        ? `${API}/ont/detect/${selectedDevice.id}`
        : `${API}/ont/simulate-detect/${selectedDevice.id}`;
      
      const response = await fetch(endpoint, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setDetectedOnts(data.onts || []);
        setShowDetected(true);
        
        if (data.simulation) {
          toast.success(`🎬 SIMULASI: Terdeteksi ${data.detected_count} ONT baru!`, {
            description: 'Data ini hanya untuk demo'
          });
        } else {
          toast.success(`Terdeteksi ${data.detected_count} ONT baru!`);
        }
      } else {
        const error = await response.json();
        toast.error('Gagal scan ONT: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoRegister = async (detectedOnt) => {
    try {
      const response = await fetch(`${API}/ont/auto-register/${selectedDevice.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detectedOnt)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('ONT berhasil didaftarkan otomatis!');
        setDetectedOnts(prev => prev.filter(ont => ont.serial_number !== detectedOnt.serial_number));
        loadONTs();
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
          <p className="text-slate-400">Pilih device terlebih dahulu untuk mengelola ONT</p>
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
            data-testid="scan-ont-btn"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                {selectedDevice?.is_connected ? 'Scan ONT Baru' : '🎬 Simulasi Scan'}
              </>
            )}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600" data-testid="add-ont-btn">
                <Plus className="w-4 h-4 mr-2" />
                Register ONT
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white border-slate-700">
              <DialogHeader>
                <DialogTitle>Register ONT Baru</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Daftarkan ONT baru ke OLT device
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddONT} className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg border border-blue-500">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-ont-id" className="text-blue-200 cursor-pointer">
                      Auto ONT ID
                    </Label>
                    {autoOntId && (
                      <Badge className="bg-blue-500">
                        Next: {nextOntId}
                      </Badge>
                    )}
                  </div>
                  <Switch
                    id="auto-ont-id"
                    checked={autoOntId}
                    onCheckedChange={(checked) => {
                      setAutoOntId(checked);
                      if (checked) {
                        setFormData(prev => ({ ...prev, ont_id: -1 }));
                        fetchNextOntId();
                      } else {
                        setFormData(prev => ({ ...prev, ont_id: 0 }));
                      }
                    }}
                  />
                </div>
                
                {!autoOntId && (
                  <div>
                    <Label htmlFor="ont_id">ONT ID (Manual)</Label>
                    <Input
                      id="ont_id"
                      name="ont_id"
                      type="number"
                      value={formData.ont_id}
                      onChange={handleInputChange}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="ont-id-input"
                    />
                    <p className="text-xs text-slate-400 mt-1">GPON: 0-127, EPON: 0-63</p>
                  </div>
                )}
                
                
                <div>
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleInputChange}
                    required
                    placeholder="HWTC12345678"
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="ont-serial-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frame">Frame</Label>
                    <Input
                      id="frame"
                      name="frame"
                      type="number"
                      value={formData.frame}
                      onChange={handleInputChange}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="ont-frame-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="board">Board</Label>
                    <Input
                      id="board"
                      name="board"
                      type="number"
                      value={formData.board}
                      onChange={handleInputChange}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="ont-board-input"
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
                      data-testid="ont-port-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vlan">VLAN</Label>
                    <Input
                      id="vlan"
                      name="vlan"
                      type="number"
                      value={formData.vlan}
                      onChange={handleInputChange}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="ont-vlan-input"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" data-testid="submit-ont-btn">
                  Register ONT
                </Button>
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
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                onClick={() => setShowDetected(false)}
              >
                Tutup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleAutoRegister(ont)}
                          data-testid={`auto-register-${index}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Register
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registered ONTs</CardTitle>
          <CardDescription className="text-slate-400">
            Total: {onts.length} ONT(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Belum ada ONT terdaftar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">ONT ID</TableHead>
                    <TableHead className="text-slate-300">Serial Number</TableHead>
                    <TableHead className="text-slate-300">Registration Code</TableHead>
                    <TableHead className="text-slate-300">Frame/Board/Port</TableHead>
                    <TableHead className="text-slate-300">VLAN</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onts.map((ont) => (
                    <TableRow key={ont.id} className="border-slate-700" data-testid={`ont-row-${ont.id}`}>
                      <TableCell className="text-white font-medium">{ont.ont_id}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{ont.serial_number}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{ont.registration_code}</TableCell>
                      <TableCell className="text-slate-300">{ont.frame}/{ont.board}/{ont.port}</TableCell>
                      <TableCell className="text-slate-300">{ont.vlan}</TableCell>
                      <TableCell>
                        <Badge 
                          className={`${
                            ont.status === 'online' ? 'bg-green-500' : 
                            ont.status === 'offline' ? 'bg-red-500' : 
                            'bg-yellow-500'
                          }`}
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          {ont.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => handleDeleteONT(ont.id)}
                          data-testid={`delete-ont-btn-${ont.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ONTManagement;
