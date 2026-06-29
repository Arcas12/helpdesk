import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Alert,
  Pagination, Tooltip, Divider
} from '@mui/material';
import AddIcon        from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon       from '@mui/icons-material/Edit';
import * as XLSX      from 'xlsx';
import { saveAs }     from 'file-saver';
import { ticketService, categoryService, userService } from '../../services/api';
import { Ticket, TicketFilter, Category, CreateTicketRequest, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS: Record<string, 'info'|'warning'|'success'|'default'> = {
  Open: 'info', InProgress: 'warning', Resolved: 'success', Closed: 'default'
};
const STATUS_LABELS: Record<string, string> = {
  Open: 'Abierto', InProgress: 'En progreso', Resolved: 'Resuelto', Closed: 'Cerrado'
};
const PRIORITY_COLORS: Record<string, 'success'|'info'|'warning'|'error'> = {
  Low: 'success', Medium: 'info', High: 'warning', Critical: 'error'
};
const PRIORITY_LABELS: Record<string, string> = {
  Low: 'Baja', Medium: 'Media', High: 'Alta', Critical: 'Crítica'
};

// Mapa de Status a número (como lo espera el backend)
const STATUS_TO_NUM: Record<string, number> = {
  Open: 0, InProgress: 1, Resolved: 2, Closed: 3
};
const PRIORITY_TO_NUM: Record<string, number> = {
  Low: 0, Medium: 1, High: 2, Critical: 3
};

const TicketsPage: React.FC = () => {
  const { user } = useAuth();

  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [filter,     setFilter]     = useState<TicketFilter>({ page: 1, pageSize: 10 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [agents,     setAgents]     = useState<User[]>([]);

  // Modal crear ticket
  const [openCreate, setOpenCreate] = useState(false);
  const [newTicket,  setNewTicket]  = useState<CreateTicketRequest>({
    title: '', description: '', priority: 1, categoryId: 0
  });
  const [creating, setCreating] = useState(false);

  // Modal ver detalle
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Modal editar ticket (asignar + cambiar estado)
  const [editTicket,  setEditTicket]  = useState<Ticket | null>(null);
  const [editStatus,  setEditStatus]  = useState('');
  const [editAgentId, setEditAgentId] = useState<number | ''>('');
  const [updating,    setUpdating]    = useState(false);

  // ── Cargar tickets ──────────────────────────────────────
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ticketService.getAll(filter);
      setTickets(result.items);
      setTotalPages(result.totalPages);
    } catch {
      setError('Error al cargar los tickets.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // ── Cargar categorías y agentes ─────────────────────────
  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});

    // Solo Admin puede ver y asignar agentes
    if (user?.role === 'Administrator') {
      userService.getAll()
        .then(users => setAgents(users.filter(u => u.role === 'Agent' && u.isActive)))
        .catch(() => {});
    }
  }, [user]);

  // ── Crear ticket ────────────────────────────────────────
  const handleCreate = async () => {
    if (!newTicket.title || !newTicket.categoryId) return;
    setCreating(true);
    try {
      await ticketService.create(newTicket);
      setOpenCreate(false);
      setNewTicket({ title: '', description: '', priority: 1, categoryId: 0 });
      loadTickets();
    } catch {
      setError('Error al crear el ticket.');
    } finally {
      setCreating(false);
    }
  };

  // ── Abrir modal de edición ──────────────────────────────
  const handleOpenEdit = (ticket: Ticket) => {
    setEditTicket(ticket);
    setEditStatus(ticket.status);
    // Buscamos el ID del agente asignado por nombre
    const agente = agents.find(a => a.fullName === ticket.assignedTo);
    setEditAgentId(agente?.id ?? '');
  };

  // ── Guardar cambios del ticket ──────────────────────────
  const handleUpdate = async () => {
    if (!editTicket) return;
    setUpdating(true);
    try {
      const categoryId = categories.find(c => c.name === editTicket.category)?.id ?? 1;
      await ticketService.update(editTicket.id, {
        status:       STATUS_TO_NUM[editStatus]         ?? STATUS_TO_NUM[editTicket.status],
        priority:     PRIORITY_TO_NUM[editTicket.priority] ?? 1,
        categoryId,
        assignedToId: editAgentId !== '' ? Number(editAgentId) : undefined
      });
      setEditTicket(null);
      loadTickets();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al actualizar el ticket.');
    } finally {
      setUpdating(false);
    }
  };

  // ── Exportar Excel ──────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      const result = await ticketService.getAll({ ...filter, page: 1, pageSize: 9999 });
      const rows = result.items.map(t => ({
        'ID':          t.id,
        'Título':      t.title,
        'Estado':      STATUS_LABELS[t.status]     ?? t.status,
        'Prioridad':   PRIORITY_LABELS[t.priority] ?? t.priority,
        'Categoría':   t.category,
        'Creado por':  t.createdBy,
        'Asignado a':  t.assignedTo ?? 'Sin asignar',
        'Fecha':       new Date(t.createdAt).toLocaleDateString('es-CO'),
        'Comentarios': t.commentCount
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook  = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');
      worksheet['!cols'] = [
        { wch: 5 }, { wch: 35 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }
      ];
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }), `tickets_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      setError('Error al exportar.');
    }
  };

  // ── Determina si el usuario puede editar este ticket ────
  const canEdit = (ticket: Ticket) => {
    if (user?.role === 'Administrator') return true;
    if (user?.role === 'Agent') {
      // El agente solo puede editar tickets asignados a él
      return ticket.assignedTo === user.fullName;
    }
    return false;
  };

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Tickets</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={handleExportExcel}>
            📥 Exportar Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            Nuevo Ticket
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Buscar" size="small"
              value={filter.search ?? ''}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value, page: 1 }))}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filter.status ?? ''}
                label="Estado"
                onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Open">Abierto</MenuItem>
                <MenuItem value="InProgress">En progreso</MenuItem>
                <MenuItem value="Resolved">Resuelto</MenuItem>
                <MenuItem value="Closed">Cerrado</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={filter.priority ?? ''}
                label="Prioridad"
                onChange={e => setFilter(f => ({ ...f, priority: e.target.value, page: 1 }))}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Low">Baja</MenuItem>
                <MenuItem value="Medium">Media</MenuItem>
                <MenuItem value="High">Alta</MenuItem>
                <MenuItem value="Critical">Crítica</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => setFilter({ page: 1, pageSize: 10 })}>
              Limpiar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>#</strong></TableCell>
                <TableCell><strong>Título</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Prioridad</strong></TableCell>
                <TableCell><strong>Categoría</strong></TableCell>
                {user?.role !== 'Requester' && (
                  <TableCell><strong>Solicitante</strong></TableCell>
                )}
                <TableCell><strong>Asignado a</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay tickets</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map(ticket => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {ticket.title}
                      </Typography>
                      {ticket.commentCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          💬 {ticket.commentCount} comentario(s)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[ticket.status] ?? ticket.status}
                        color={STATUS_COLORS[ticket.status] ?? 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                        color={PRIORITY_COLORS[ticket.priority] ?? 'default'}
                        size="small" variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    {user?.role !== 'Requester' && (
                      <TableCell>{ticket.createdBy}</TableCell>
                    )}
                    <TableCell>
                      {ticket.assignedTo ? (
                        <Chip label={ticket.assignedTo} size="small" color="primary" variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin asignar
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(ticket.createdAt).toLocaleDateString('es-CO')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" color="primary"
                            onClick={() => setSelectedTicket(ticket)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEdit(ticket) && (
                          <Tooltip title="Editar / Asignar">
                            <IconButton size="small" color="warning"
                              onClick={() => handleOpenEdit(ticket)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={filter.page ?? 1}
              onChange={(_, page) => setFilter(f => ({ ...f, page }))}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* ── Modal: Crear ticket ── */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Ticket</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Título" margin="normal" required
            value={newTicket.title}
            onChange={e => setNewTicket(t => ({ ...t, title: e.target.value }))}
          />
          <TextField
            fullWidth label="Descripción" margin="normal" multiline rows={3}
            value={newTicket.description}
            onChange={e => setNewTicket(t => ({ ...t, description: e.target.value }))}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={newTicket.priority}
              label="Prioridad"
              onChange={e => setNewTicket(t => ({ ...t, priority: Number(e.target.value) }))}
            >
              <MenuItem value={0}>Baja</MenuItem>
              <MenuItem value={1}>Media</MenuItem>
              <MenuItem value={2}>Alta</MenuItem>
              <MenuItem value={3}>Crítica</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Categoría</InputLabel>
            <Select
              value={newTicket.categoryId || ''}
              label="Categoría"
              onChange={e => setNewTicket(t => ({ ...t, categoryId: Number(e.target.value) }))}
            >
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}
            disabled={creating || !newTicket.title || !newTicket.categoryId}>
            {creating ? <CircularProgress size={20} /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal: Ver detalle ── */}
      <Dialog open={!!selectedTicket} onClose={() => setSelectedTicket(null)}
        maxWidth="sm" fullWidth>
        {selectedTicket && (
          <>
            <DialogTitle>
              Ticket #{selectedTicket.id} — {selectedTicket.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={STATUS_LABELS[selectedTicket.status]}
                  color={STATUS_COLORS[selectedTicket.status]} size="small" />
                <Chip label={PRIORITY_LABELS[selectedTicket.priority]}
                  color={PRIORITY_COLORS[selectedTicket.priority]}
                  size="small" variant="outlined" />
                <Chip label={selectedTicket.category} size="small" variant="outlined" />
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedTicket.description}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Creado por: <strong>{selectedTicket.createdBy}</strong> —{' '}
                {new Date(selectedTicket.createdAt).toLocaleString('es-CO')}
              </Typography>
              {selectedTicket.assignedTo && (
                <Typography variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  Asignado a: <strong>{selectedTicket.assignedTo}</strong>
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTicket(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Modal: Editar ticket (cambiar estado + asignar agente) ── */}
      <Dialog open={!!editTicket} onClose={() => setEditTicket(null)}
        maxWidth="sm" fullWidth>
        {editTicket && (
          <>
            <DialogTitle>
               Editar Ticket #{editTicket.id}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {editTicket.title}
              </Typography>

              {/* Cambiar estado */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editStatus}
                  label="Estado"
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <MenuItem value="Open">🔵 Abierto</MenuItem>
                  <MenuItem value="InProgress">🟡 En progreso</MenuItem>
                  <MenuItem value="Resolved">🟢 Resuelto</MenuItem>
                  <MenuItem value="Closed">⚫ Cerrado</MenuItem>
                </Select>
              </FormControl>

              {/* Asignar agente — solo Admin */}
              {user?.role === 'Administrator' && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Asignar a agente</InputLabel>
                  <Select
                    value={editAgentId}
                    label="Asignar a agente"
                    onChange={e => setEditAgentId(e.target.value as number)}
                  >
                    <MenuItem value="">Sin asignar</MenuItem>
                    {agents.map(agent => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditTicket(null)}>Cancelar</Button>
              <Button variant="contained" onClick={handleUpdate} disabled={updating}>
                {updating ? <CircularProgress size={20} /> : 'Guardar cambios'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TicketsPage;
