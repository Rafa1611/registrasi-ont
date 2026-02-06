import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal, Send, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

const TerminalPanel = ({ API, selectedDevice }) => {
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (selectedDevice) {
      loadLogs();
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const loadLogs = async () => {
    if (!selectedDevice) return;

    try {
      const response = await fetch(`${API}/logs/${selectedDevice.id}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleSendCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || !selectedDevice) return;

    try {
      const response = await fetch(`${API}/devices/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedDevice.id,
          command: command.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to history
        setCommandHistory(prev => [command, ...prev].slice(0, 50));
        
        // Add to logs
        setLogs(prev => [{
          id: Date.now().toString(),
          device_id: selectedDevice.id,
          command: command,
          response: data.response,
          status: data.status,
          timestamp: new Date().toISOString()
        }, ...prev]);
        
        setCommand('');
        setHistoryIndex(-1);
        
        if (data.status === 'success') {
          toast.success('Command executed successfully');
        } else {
          toast.error('Command failed');
        }
      } else {
        toast.error('Failed to send command');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const handleClearLogs = async () => {
    if (!selectedDevice) return;
    if (!window.confirm('Clear all logs for this device?')) return;

    try {
      const response = await fetch(`${API}/logs/${selectedDevice.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLogs([]);
        toast.success('Logs cleared successfully');
      }
    } catch (error) {
      toast.error('Error clearing logs');
    }
  };

  const handleExportLogs = () => {
    const logText = logs.map(log => {
      return `[${new Date(log.timestamp).toLocaleString()}] ${log.status.toUpperCase()}\nCommand: ${log.command}\nResponse: ${log.response}\n\n`;
    }).join('---\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${selectedDevice.name}_${Date.now()}.txt`;
    a.click();
    toast.success('Logs exported successfully');
  };

  if (!selectedDevice) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Pilih device terlebih dahulu untuk menggunakan terminal</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedDevice.is_connected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Device belum terhubung. Hubungkan device terlebih dahulu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Terminal</h2>
          <p className="text-blue-200">Device: {selectedDevice.name} - {selectedDevice.ip_address}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
            onClick={handleExportLogs}
            data-testid="export-logs-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-600 text-red-500 hover:bg-red-500 hover:text-white"
            onClick={handleClearLogs}
            data-testid="clear-logs-btn"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/90 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-green-400" />
            <CardTitle className="text-white">Command Terminal</CardTitle>
            <Badge className="bg-green-500 ml-auto">
              Connected
            </Badge>
          </div>
          <CardDescription className="text-slate-400">
            Execute commands on the OLT device. Use ↑/↓ arrows for command history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Terminal Output */}
          <div 
            ref={scrollRef}
            className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm"
            data-testid="terminal-output"
          >
            {logs.length === 0 ? (
              <div className="text-green-400">
                <p>Huawei OLT Management Terminal v1.0</p>
                <p>Device: {selectedDevice.name} ({selectedDevice.ip_address})</p>
                <p>Type your commands below...</p>
                <p className="mt-2 text-slate-500">_</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...logs].reverse().map((log) => (
                  <div key={log.id} className="border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-500 text-xs">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <Badge 
                        className={`text-xs ${
                          log.status === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="text-blue-400">
                      <span className="text-green-400">$ </span>
                      {log.command}
                    </div>
                    <div className="text-slate-300 mt-1 pl-4 whitespace-pre-wrap">
                      {log.response}
                    </div>
                  </div>
                ))}
                <div className="text-green-400 animate-pulse">_</div>
              </div>
            )}
          </div>

          {/* Command Input */}
          <form onSubmit={handleSendCommand} className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 font-mono">
                $
              </span>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
                className="bg-black border-slate-700 text-white font-mono pl-8"
                data-testid="terminal-command-input"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600"
              disabled={!command.trim()}
              data-testid="send-command-btn"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>

          {/* Quick Commands */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-400 mb-2">Quick Commands:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'display ont info 0 all',
                'display board 0',
                'display version',
                'display current-configuration',
                'display service-port'
              ].map((cmd) => (
                <Button
                  key={cmd}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 font-mono text-xs"
                  onClick={() => setCommand(cmd)}
                  data-testid={`quick-command-${cmd.split(' ')[1]}`}
                >
                  {cmd}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TerminalPanel;
