import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Lock, User } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(username, password);
    
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/90 border-slate-700 backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-24 h-24 flex items-center justify-center">
            <img src="/logo.png" alt="Rafa Hotspot Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Rafa Hotspot
          </CardTitle>
          <CardDescription className="text-slate-400">
            ONT Registration Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>

            <div className="text-center text-xs text-slate-400 pt-4">
              <p>Default: admin / admin123</p>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-4 text-center text-slate-400 text-sm">
        <p>© 2025 Huawei OLT Management System v1.0.0</p>
      </div>
    </div>
  );
};

export default LoginPage;
