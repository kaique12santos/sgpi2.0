import React, { useEffect, useState } from 'react';
import { 
    Container, Title, Text, SimpleGrid, Card, Group, ThemeIcon, 
    Button, RingProgress, Paper, Skeleton 
} from '@mantine/core';
import { 
    IconFiles, IconClock, IconAlertCircle, IconCheck, 
    IconUsers, IconFolder, IconUpload, IconDatabase 
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// --- VISÃO DO PROFESSOR (Com Cores do Tema) ---
const ProfessorDashboard = ({ stats, navigate, loading }) => {
    return (
        <>
            <Text c="dimmed" mb="xl">
                Acompanhe o status das suas entregas de Projeto Integrador.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                {/* CARD 1: STATUS DO SISTEMA */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Status da Fila</Text>
                        {stats.pendingCount > 0 ? (
                            // Mantemos Orange/Green pois são cores semânticas de status (Aviso/Sucesso)
                            <ThemeIcon color="orange" variant="light"><IconClock size="1.2rem" /></ThemeIcon>
                        ) : (
                            <ThemeIcon color="green" variant="light"><IconCheck size="1.2rem" /></ThemeIcon>
                        )}
                    </Group>
                    
                    <Skeleton visible={loading}>
                        <Text fz="xl" fw={700}>
                            {stats.pendingCount > 0 ? 'Processando' : 'Tudo Pronto'}
                        </Text>
                        <Text size="xs" c="dimmed" mt="sm">
                            {stats.pendingCount > 0 
                                ? `${stats.pendingCount} arquivos na fila` 
                                : 'Nenhuma pendência de upload'}
                        </Text>
                    </Skeleton>
                </Card>

                {/* CARD 2: MEUS ENVIOS */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Meus Envios</Text>
                        {/* Usando fatecBlue para informação secundária */}
                        <ThemeIcon color="fatecBlue" variant="light"><IconFiles size="1.2rem" /></ThemeIcon>
                    </Group>
                    <Skeleton visible={loading}>
                        <Text fz="xl" fw={700}>{stats.submissionsCount || 0} Pastas</Text>
                        <Text size="xs" c="dimmed" mt="sm">Pacotes enviados</Text>
                    </Skeleton>
                </Card>

                {/* CARD 3: AÇÃO RÁPIDA (Primária) */}
                <Card shadow="sm" padding="lg" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Button 
                        fullWidth 
                        leftSection={<IconUpload size={20} />} 
                        color="fatecRed" /* <--- AQUI: Cor Primária da Marca */
                        onClick={() => navigate('/dashboard/novo-envio')}
                    >
                        Nova Entrega
                    </Button>
                </Card>
            </SimpleGrid>

            {/* CARD DE AVISO */}
            <Paper withBorder p="md" radius="md" mt="lg" bg="gray.0">
                <Group>
                    <IconAlertCircle color="gray" />
                    <div>
                        <Text fw={500}>Lembrete de Prazo</Text>
                        <Text size="sm">Verifique o calendário acadêmico para as próximas entregas.</Text>
                    </div>
                </Group>
            </Paper>
        </>
    );
};

// --- VISÃO DO COORDENADOR (Limpá e Focada em Infra) ---
const CoordinatorDashboard = ({ stats, loading }) => {
    
    // Formata bytes para GB/MB
    const formatBytes = (bytes) => {
        if (!bytes || isNaN(bytes)) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <>
             <Text c="dimmed" mb="xl">
                Visão geral da infraestrutura e volume de dados do SGPI.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                
                {/* CARD 1: TOTAL DE PASTAS (GLOBAL) */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Pastas no Drive</Text>
                        <ThemeIcon color="teal" variant="light">
                            <IconFolder size="1.2rem" />
                        </ThemeIcon>
                    </Group>
                    <Skeleton visible={loading}>
                        <Text fz="xl" fw={700}>{stats.totalFolders || 0}</Text>
                        <Text size="xs" c="dimmed" mt="sm">Total acumulado</Text>
                    </Skeleton>
                </Card>

                {/* CARD 2: USO DO ARMAZENAMENTO */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Armazenamento Usado</Text>
                        <ThemeIcon color="cyan" variant="light">
                            <IconDatabase size="1.2rem" />
                        </ThemeIcon>
                    </Group>
                    <Skeleton visible={loading}>
                        <Text fz="xl" fw={700}>{formatBytes(stats.totalStorage)}</Text>
                        <Text size="xs" c="dimmed" mt="sm">Volume total de arquivos</Text>
                    </Skeleton>
                </Card>

                {/* CARD 3: USUÁRIOS/PROFESSORES (Opcional - Pode remover se quiser) */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Usuários Ativos</Text>
                        <ThemeIcon color="indigo" variant="light">
                            <IconUsers size="1.2rem" />
                        </ThemeIcon>
                    </Group>
                    <Skeleton visible={loading}>
                        <Text fz="xl" fw={700}>{stats.totalUsers || 0}</Text>
                        <Text size="xs" c="dimmed" mt="sm">Professores cadastrados</Text>
                    </Skeleton>
                </Card>

            </SimpleGrid>

            
        </>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function DashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});

    const user = JSON.parse(localStorage.getItem('sgpi_user') || '{}');
    const userRole = user.role || 'professor';

    useEffect(() => {
        async function loadData() {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <Container size="xl" py="xl">
            <Title order={2} mb="xs">Olá, {user?.name || 'Professor'}!</Title>
            
            {userRole === 'coordenador' ? (
                <CoordinatorDashboard stats={stats} loading={loading} />
            ) : (
                <ProfessorDashboard stats={stats} navigate={navigate} loading={loading} />
            )}
            
        </Container>
    );
}

