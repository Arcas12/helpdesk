import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Alert,
  Pagination, Tooltip
} from '@mui/material';
import AddIcon          from '@mui/icons-material/Add';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import { ticketService, categoryService } from '../../services/api';
import { Ticket, TicketFilter, Category, CreateTicketRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ── Colores por estado y prioridad ────────────────────────────
const STATUS_COLORS: Record<string, 'info'|'warning'|'success'|'default'> = {
  Open:       'info',
  InProgress: 'warning',
  Resolved:   'success',
  Closed:     'default'
};

const STATUS_LABELS: Record<string, string> = {
  Open:       'Abierto',
  InProgress: 'En progreso',
  Resolved:   'Resuelto',
  Closed:     'Cerrado'
};

const PRIORITY_COLORS: Record<string, 'success'|'info'|'warning'|'error'> = {
  Low:      'success',
  Medium:   'info',
  High:     'warning',
  Critical: 'error'
};

const PRIORITY_LABELS: Record<string, string> = {
  Low: 'Baja', Medium: 'Media', High: 'Alta', Critical: 'Crítica'
};

// ── Componente principal ──────────────────────────────────────
const TicketsPage: React.FC = () => {
  const { user } = useAuth();

  // Estado de tickets
  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Filtros
  const [filter, setFilter] = useState<TicketFilter>({ page: 1, pageSize: 10 });

  // Categorías para el formulario
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal de crear ticket
  const [openCreate, setOpenCreate] = useState(false);
  const [newTicket,  setNewTicket]  = useState<CreateTicketRequest>({
    title: '', description: '', priority: 1, categoryId: 0
  });
  const [creating, setCreating] = useState(false);

  // Modal de detalle
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // ── Cargar tickets ──────────────────────────────────────────
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

  // ── Cargar categorías ───────────────────────────────────────
  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  // ── Crear ticket ────────────────────────────────────────────
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
// ── Exportar excel ────────────────────────────────────────────
const handleExportExcel = async () => {
  try {
    // Traemos TODOS los tickets sin paginación para exportar
    const result = await ticketService.getAll({ ...filter, page: 1, pageSize: 9999 });

    // Convertimos los datos a formato tabla
    const rows = result.items.map(t => ({
      'ID':          t.id,
      'Título':      t.title,
      'Estado':      STATUS_LABELS[t.status]   ?? t.status,
      'Prioridad':   PRIORITY_LABELS[t.priority] ?? t.priority,
      'Categoría':   t.category,
      'Creado por':  t.createdBy,
      'Asignado a':  t.assignedTo ?? 'Sin asignar',
      'Fecha':       new Date(t.createdAt).toLocaleDateString('es-CO'),
      'Comentarios': t.commentCount
    }));

    // Creamos el archivo Excel
    const worksheet  = XLSX.utils.json_to_sheet(rows);
    const workbook   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

    // Ajustamos el ancho de las columnas automáticamente
    worksheet['!cols'] = [
      { wch: 5 },  // ID
      { wch: 35 }, // Título
      { wch: 15 }, // Estado
      { wch: 12 }, // Prioridad
      { wch: 15 }, // Categoría
      { wch: 20 }, // Creado por
      { wch: 20 }, // Asignado a
      { wch: 12 }, // Fecha
      { wch: 12 }, // Comentarios
    ];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(blob, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch {
    setError('Error al exportar los tickets.');
  }
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

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Buscar"
              size="small"
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

      {/* Tabla de tickets */}
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
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    {user?.role !== 'Requester' && (
                      <TableCell>{ticket.createdBy}</TableCell>
                    )}
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(ticket.createdAt).toLocaleDateString('es-CO')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalle">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
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
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !newTicket.title || !newTicket.categoryId}
          >
            {creating ? <CircularProgress size={20} /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal: Detalle del ticket ── */}
      <Dialog
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        maxWidth="sm" fullWidth
      >
        {selectedTicket && (
          <>
            <DialogTitle>
              Ticket #{selectedTicket.id} — {selectedTicket.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={STATUS_LABELS[selectedTicket.status]}
                  color={STATUS_COLORS[selectedTicket.status]}
                  size="small"
                />
                <Chip
                  label={PRIORITY_LABELS[selectedTicket.priority]}
                  color={PRIORITY_COLORS[selectedTicket.priority]}
                  size="small" variant="outlined"
                />
                <Chip label={selectedTicket.category} size="small" variant="outlined" />
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedTicket.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Creado por: {selectedTicket.createdBy} —{' '}
                {new Date(selectedTicket.createdAt).toLocaleString('es-CO')}
              </Typography>
              {selectedTicket.assignedTo && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Asignado a: {selectedTicket.assignedTo}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTicket(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TicketsPage;
