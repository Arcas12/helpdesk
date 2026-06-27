import React, { useEffect, useState } from 'react';
import {
  Box, Stack, Card, CardContent, Typography,
  CircularProgress, Alert
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend
} from 'recharts';
import { dashboardService } from '../../services/api';
import { DashboardData } from '../../types';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

interface KpiCardProps {
  title: string;
  value: number;
  color: string;
  emoji: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, color, emoji }) => (
  <Card sx={{ flex: 1, borderLeft: `4px solid ${color}` }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color }}>{value}</Typography>
        </Box>
        <Typography sx={{ fontSize: 40 }}>{emoji}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    dashboardService.get()
      .then(setData)
      .catch(() => setError('Error al cargar el dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (error)  return <Alert severity="error">{error}</Alert>;
  if (!data)  return null;

  const roleTitle: Record<string, string> = {
    Administrator: 'Vista global — todos los tickets',
    Agent:         'Mis tickets asignados',
    Requester:     'Mis tickets'
  };

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          {roleTitle[user?.role ?? ''] ?? ''}
        </Typography>
      </Box>

      {/* KPIs — Stack horizontal que se envuelve en móvil */}
      <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <KpiCard title="Total"       value={data.totalTickets}      color="#607d8b" emoji="🎫" />
        <KpiCard title="Abiertos"    value={data.openTickets}       color="#2196f3" emoji="📬" />
        <KpiCard title="En progreso" value={data.inProgressTickets} color="#ff9800" emoji="⚙️" />
        <KpiCard title="Resueltos"   value={data.resolvedTickets}   color="#4caf50" emoji="✅" />
        <KpiCard title="Cerrados"    value={data.closedTickets}     color="#9e9e9e" emoji="🔒" />
      </Stack>

      {/* Gráficos — dos columnas en escritorio, una en móvil */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 2 }}>
        {/* Gráfico de barras — Por prioridad */}
        <Card sx={{ flex: 1, minWidth: 280 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Tickets por Prioridad
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.byPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                  {data.byPriority.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de torta — Por categoría */}
        <Card sx={{ flex: 1, minWidth: 280 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Tickets por Categoría
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.byCategory}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {data.byCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Stack>

      {/* Gráfico por agente — solo Admin */}
      {user?.role === 'Administrator' && data.byAgent.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Tickets por Agente
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byAgent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Tickets asignados" fill="#2196f3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DashboardPage;
