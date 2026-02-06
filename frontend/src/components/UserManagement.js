import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, User, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

const UserManagement = ({ API }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'operator'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiRequest(`${API}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(`${API}/users`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('User berhasil ditambahkan!');
        setIsAddDialogOpen(false);
        setFormData({
          username: '',
          password: '',
          full_name: '',
          role: 'operator'
        });
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Gagal menambah user');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) return;
    
    try {
      const response = await apiRequest(`${API}/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('User berhasil dihapus!');
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Gagal menghapus user');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="text-white text-center py-8">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-blue-200">Kelola akun admin dan operator</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription className="text-slate-400">
                Buat akun admin atau operator baru
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="username"
                />
              </div>
              
              <div>
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Password minimal 6 karakter"
                  minLength={6}
                />
              </div>
              
              <div>
                <Label>Nama Lengkap</Label>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Nama lengkap user"
                />
              </div>
              
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="admin" className="text-white">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-400" />
                        <span>Admin (Full Access)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="operator" className="text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>Operator (Registrasi ONT Only)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1">
                  {formData.role === 'admin' ? 
                    'Akses penuh ke semua menu' : 
                    'Hanya bisa registrasi ONT, tidak bisa edit/delete'}
                </p>
              </div>
              
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
                Tambah User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Daftar User</CardTitle>
          <CardDescription className="text-slate-400">
            Total: {users.length} user(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Username</TableHead>
                <TableHead className="text-slate-300">Nama Lengkap</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Dibuat Oleh</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-700">
                  <TableCell className="text-white font-mono">{user.username}</TableCell>
                  <TableCell className="text-slate-300">{user.full_name}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge className="bg-red-500">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500">
                        <User className="w-3 h-3 mr-1" />
                        Operator
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {user.created_by || 'System'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={user.id === currentUser?.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
