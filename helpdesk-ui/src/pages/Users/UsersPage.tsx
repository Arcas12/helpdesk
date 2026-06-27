import React, { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { userService } from '../../services/api';
import { User, CreateUserRequest } from '../../types';

const UsersPage: React.FC = () => {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Modal crear usuario
  const [openCreate, setOpenCreate] = useState(false);
  const [newUser,    setNewUser]    = useState<CreateUserRequest>({
    fullName: '', email: '', password: '', roleId: 3
  });
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await userService.getAll();
      setUsers(result);
    } catch {
      setError('Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) return;
    setCreating(true);
    try {
      await userService.create(newUser);
      setOpenCreate(false);
      setNewUser({ fullName: '', email: '', password: '', roleId: 3 });
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al crear usuario.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await userService.update(user.id, {
        fullName: user.fullName,
        roleId:   ['Administrator','Agent','Requester'].indexOf(user.role) + 1,
        isActive: !user.isActive
      });
      loadUsers();
    } catch {
      setError('Error al actualizar usuario.');
    }
  };

  const ROLE_COLORS: Record<string, 'error'|'warning'|'success'> = {
    Administrator: 'error',
    Agent:         'warning',
    Requester:     'success'
  };

  const ROLE_LABELS: Record<string, string> = {
    Administrator: 'Administrador',
    Agent:         'Agente',
    Requester:     'Solicitante'
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Usuarios
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
          Nuevo Usuario
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>#</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Activo</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.map(user => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={ROLE_LABELS[user.role] ?? user.role}
                      color={ROLE_COLORS[user.role] ?? 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Activo' : 'Inactivo'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small" variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive}
                      onChange={() => handleToggleActive(user)}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal crear usuario */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Usuario</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Nombre completo" margin="normal" required
            value={newUser.fullName}
            onChange={e => setNewUser(u => ({ ...u, fullName: e.target.value }))}
          />
          <TextField
            fullWidth label="Email" type="email" margin="normal" required
            value={newUser.email}
            onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
          />
          <TextField
            fullWidth label="Contraseña" type="password" margin="normal" required
            value={newUser.password}
            onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select
              value={newUser.roleId}
              label="Rol"
              onChange={e => setNewUser(u => ({ ...u, roleId: Number(e.target.value) }))}
            >
              <MenuItem value={1}>Administrador</MenuItem>
              <MenuItem value={2}>Agente</MenuItem>
              <MenuItem value={3}>Solicitante</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !newUser.fullName || !newUser.email || !newUser.password}
          >
            {creating ? <CircularProgress size={20} /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
