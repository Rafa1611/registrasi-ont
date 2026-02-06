import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ConfigurationPanel = ({ API, selectedDevice }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    frame: 0,
    board: 1,
    port: 3,
    service_board: '0/1',
    g_line_template: 1,
    g_service_template: 1,
    e_line_template: 2,
    e_service_template: 2,
    service_outer_vlan: 41,
    service_inner_vlan: 41,
    vod_outer_vlan: 42,
    vod_inner_vlan: 42,
    multicast_vlan: 69,
    increment_value: 100,
    decrement_value: 100,
    start_number: 0,
    registration_rule: '0-(B)-(P)-(O)',
    gemport: '1,2,3',
    period: 1.0,
    enable_log: true,
    auto_reconnect: true,
    special_system_support: false,
    auto_registration: true,
    enable_iptv: false,
    auto_migration: true,
    gpon_default: '',
    gpon_service_flow: '',
    epon_default: '',
    epon_service_flow: '',
    btv_service: ''
  });

  useEffect(() => {
    if (selectedDevice) {
      loadConfiguration();
    }
  }, [selectedDevice]);

  const loadConfiguration = async () => {
    if (!selectedDevice) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/configurations/device/${selectedDevice.id}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setFormData(data);
      } else if (response.status === 404) {
        // No config exists, create one
        await createConfiguration();
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConfiguration = async () => {
    try {
      const response = await fetch(`${API}/configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedDevice.id,
          ...formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setFormData(data);
        toast.success('Konfigurasi dibuat!');
      }
    } catch (error) {
      toast.error('Gagal membuat konfigurasi');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveConfiguration = async () => {
    if (!config) return;

    try {
      const response = await fetch(`${API}/configurations/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedDevice.id,
          ...formData
        })
      });

      if (response.ok) {
        toast.success('Konfigurasi berhasil disimpan!');
        loadConfiguration();
      } else {
        toast.error('Gagal menyimpan konfigurasi');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleExportConfig = async () => {
    if (!selectedDevice) return;

    try {
      const response = await fetch(`${API}/config/export/${selectedDevice.id}`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.config_content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config_${selectedDevice.name}.ini`;
        a.click();
        toast.success('Konfigurasi berhasil diexport!');
      }
    } catch (error) {
      toast.error('Gagal export konfigurasi');
    }
  };

  const handleImportConfig = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await fetch(`${API}/config/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: selectedDevice.id,
            config_content: event.target.result
          })
        });

        if (response.ok) {
          toast.success('Konfigurasi berhasil diimport!');
          loadConfiguration();
        } else {
          toast.error('Gagal import konfigurasi');
        }
      } catch (error) {
        toast.error('Error: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  if (!selectedDevice) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Pilih device terlebih dahulu untuk melihat konfigurasi</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Loading konfigurasi...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Konfigurasi OLT</h2>
          <p className="text-blue-200">Device: {selectedDevice.name}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-slate-600 text-white hover:bg-slate-700"
            onClick={handleExportConfig}
            data-testid="export-config-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            className="border-slate-600 text-white hover:bg-slate-700"
            onClick={() => document.getElementById('import-file').click()}
            data-testid="import-config-btn"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".ini"
            style={{ display: 'none' }}
            onChange={handleImportConfig}
          />
          <Button 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleSaveConfiguration}
            data-testid="save-config-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="basic">Dasar</TabsTrigger>
          <TabsTrigger value="vlan">VLAN</TabsTrigger>
          <TabsTrigger value="templates">Template</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Konfigurasi Dasar</CardTitle>
              <CardDescription className="text-slate-400">Frame, Board, dan Port settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Frame</Label>
                  <Input
                    name="frame"
                    type="number"
                    value={formData.frame}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-frame-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Board</Label>
                  <Input
                    name="board"
                    type="number"
                    value={formData.board}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-board-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Port</Label>
                  <Input
                    name="port"
                    type="number"
                    value={formData.port}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-port-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Service Board</Label>
                  <Input
                    name="service_board"
                    value={formData.service_board}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-service-board-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Start Number</Label>
                  <Input
                    name="start_number"
                    type="number"
                    value={formData.start_number}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-start-number-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Registration Rule</Label>
                  <Input
                    name="registration_rule"
                    value={formData.registration_rule}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-registration-rule-input"
                  />
                </div>
                <div>
                  <Label className="text-white">GEM Port</Label>
                  <Input
                    name="gemport"
                    value={formData.gemport}
                    onChange={handleInputChange}
                    placeholder="1,2,3"
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-gemport-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Period (minutes)</Label>
                  <Input
                    name="period"
                    type="number"
                    step="0.1"
                    value={formData.period}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-period-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vlan" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Konfigurasi VLAN</CardTitle>
              <CardDescription className="text-slate-400">Service, VOD, dan Multicast VLAN</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Service Outer VLAN</Label>
                  <Input
                    name="service_outer_vlan"
                    type="number"
                    value={formData.service_outer_vlan}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-service-outer-vlan-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Service Inner VLAN</Label>
                  <Input
                    name="service_inner_vlan"
                    type="number"
                    value={formData.service_inner_vlan}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-service-inner-vlan-input"
                  />
                </div>
                <div>
                  <Label className="text-white">VOD Outer VLAN</Label>
                  <Input
                    name="vod_outer_vlan"
                    type="number"
                    value={formData.vod_outer_vlan}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-vod-outer-vlan-input"
                  />
                </div>
                <div>
                  <Label className="text-white">VOD Inner VLAN</Label>
                  <Input
                    name="vod_inner_vlan"
                    type="number"
                    value={formData.vod_inner_vlan}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-vod-inner-vlan-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Multicast VLAN</Label>
                  <Input
                    name="multicast_vlan"
                    type="number"
                    value={formData.multicast_vlan}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-multicast-vlan-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Increment Value</Label>
                  <Input
                    name="increment_value"
                    type="number"
                    value={formData.increment_value}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-increment-input"
                  />
                </div>
                <div>
                  <Label className="text-white">Decrement Value</Label>
                  <Input
                    name="decrement_value"
                    type="number"
                    value={formData.decrement_value}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="config-decrement-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Template GPON/EPON</CardTitle>
              <CardDescription className="text-slate-400">Line dan Service templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">GPON Line Template</Label>
                  <Input
                    name="g_line_template"
                    type="number"
                    value={formData.g_line_template}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">GPON Service Template</Label>
                  <Input
                    name="g_service_template"
                    type="number"
                    value={formData.g_service_template}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">EPON Line Template</Label>
                  <Input
                    name="e_line_template"
                    type="number"
                    value={formData.e_line_template}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">EPON Service Template</Label>
                  <Input
                    name="e_service_template"
                    type="number"
                    value={formData.e_service_template}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">GPON Default Command</Label>
                <Textarea
                  name="gpon_default"
                  value={formData.gpon_default}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  placeholder="ont port native-vlan ..."
                />
              </div>

              <div>
                <Label className="text-white">GPON Service Flow</Label>
                <Textarea
                  name="gpon_service_flow"
                  value={formData.gpon_service_flow}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  placeholder="service-port vlan ..."
                />
              </div>

              <div>
                <Label className="text-white">EPON Default Command</Label>
                <Textarea
                  name="epon_default"
                  value={formData.epon_default}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  placeholder="ont port native-vlan ..."
                />
              </div>

              <div>
                <Label className="text-white">EPON Service Flow</Label>
                <Textarea
                  name="epon_service_flow"
                  value={formData.epon_service_flow}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  placeholder="service-port vlan ..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Advanced Settings</CardTitle>
              <CardDescription className="text-slate-400">Feature toggles dan BTV service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Logging</Label>
                  <Switch
                    checked={formData.enable_log}
                    onCheckedChange={(checked) => handleSwitchChange('enable_log', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Auto Reconnect</Label>
                  <Switch
                    checked={formData.auto_reconnect}
                    onCheckedChange={(checked) => handleSwitchChange('auto_reconnect', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Auto Registration</Label>
                  <Switch
                    checked={formData.auto_registration}
                    onCheckedChange={(checked) => handleSwitchChange('auto_registration', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable IPTV</Label>
                  <Switch
                    checked={formData.enable_iptv}
                    onCheckedChange={(checked) => handleSwitchChange('enable_iptv', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Auto Migration</Label>
                  <Switch
                    checked={formData.auto_migration}
                    onCheckedChange={(checked) => handleSwitchChange('auto_migration', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Special System Support</Label>
                  <Switch
                    checked={formData.special_system_support}
                    onCheckedChange={(checked) => handleSwitchChange('special_system_support', checked)}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Label className="text-white">BTV Service Command</Label>
                <Textarea
                  name="btv_service"
                  value={formData.btv_service}
                  onChange={handleInputChange}
                  rows={4}
                  className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  placeholder="btv##igmp user add ..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigurationPanel;
