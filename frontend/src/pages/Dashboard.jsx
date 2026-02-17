import React, { useEffect, useState } from 'react';
import { 
    Container, Title, Text, SimpleGrid, Card, Group, ThemeIcon, 
    Button, Skeleton, Paper, Alert, Textarea, Select, Switch
} from '@mantine/core';
import { 
    IconFiles, IconClock, IconAlertCircle, IconCheck, 
    IconUsers, IconFolder, IconUpload, IconDatabase,
    IconInfoCircle, IconEdit 
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import api from '../api/axios';

// --- SUB-COMPONENTE: FORMULÁRIO DE EDIÇÃO DE AVISO (Para o Modal) ---
function EditNoticeForm({ initialValues, onSave }) {
    const [content, setContent] = useState(initialValues.content);
    const [type, setType] = useState(initialValues.type);
    const [isActive, setIsActive] = useState(initialValues.isActive);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = { content, type, is_active: isActive };
            const response = await api.put('/system/notice', payload);
            
            notifications.show({ title: 'Sucesso', message: 'Aviso atualizado!', color: 'green' });
            onSave(response.data.data); 
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Falha ao salvar aviso.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Select
                label="Tipo de Alerta"
                data={[
                    { value: 'info', label: 'Informativo (Azul)' },
                    { value: 'warning', label: 'Atenção (Laranja)' },
                    { value: 'error', label: 'Crítico (Vermelho)' }
                ]}
                value={type}
                onChange={setType}
                mb="sm"
            />
            <Textarea
                label="Mensagem"
                placeholder="Digite o aviso para todos os professores..."
                minRows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                mb="md"
            />
            <Switch 
                label="Ativar aviso no painel" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.currentTarget.checked)} 
                mb="lg"
            />
            <Group justify="flex-end">
                <Button variant="default" onClick={() => modals.closeAll()}>Cancelar</Button>
                <Button onClick={handleSubmit} loading={loading} leftSection={<IconCheck size={16}/>}>Salvar</Button>
            </Group>
        </div>
    );
}

// --- VISÃO DO PROFESSOR (Com Cores do Tema) ---
const ProfessorDashboard = ({ stats, navigate, loading, systemNotice }) => {
    return (
        <>
            <Text c="dimmed" mb="xl">
                Acompanhe o status das suas entregas de Documentos dos Projetos Integradores.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                {/* CARD 1: STATUS DO SISTEMA */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Status da Fila</Text>
                        {stats.pendingCount > 0 ? (
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
                        color="fatecRed" 
                        onClick={() => navigate('/dashboard/novo-envio')}
                    >
                        Nova Entrega
                    </Button>
                </Card>
            </SimpleGrid>

            {/* ÁREA DE AVISO DINÂMICO DO SISTEMA */}
            {systemNotice && systemNotice.is_active === 1 && (
                <Alert 
                    variant="light" 
                    color={systemNotice.type === 'error' ? 'red' : systemNotice.type === 'warning' ? 'orange' : 'blue'} 
                    title="Aviso do Sistema" 
                    icon={<IconInfoCircle />}
                    mt="xl"
                >
                    {systemNotice.content}
                </Alert>
            )}
        </>
    );
};

// --- VISÃO DO COORDENADOR (Limpa e Focada em Infra) ---
const CoordinatorDashboard = ({ stats, loading, systemNotice, openEditNoticeModal }) => {
    
    const formatBytes = (bytes) => {
        if (!bytes || isNaN(bytes)) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <>
             <Group justify="space-between" mb="xl">
                <Text c="dimmed">
                    Visão geral da infraestrutura e volume de dados do SGPI.
                </Text>
                
                {/* Botão de Editar Aviso (Exclusivo Coord) */}
                <Button variant="light" leftSection={<IconEdit size={20} />} onClick={openEditNoticeModal}>
                    Editar Aviso Global
                </Button>
            </Group>

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

                {/* CARD 3: USUÁRIOS/PROFESSORES */}
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

            {/* ÁREA DE AVISO DINÂMICO (Pré-visualização para o Coord) */}
            {systemNotice && systemNotice.is_active === 1 && (
                <Alert 
                    variant="light" 
                    color={systemNotice.type === 'error' ? 'red' : systemNotice.type === 'warning' ? 'orange' : 'blue'} 
                    title="Aviso Ativo (Visível para todos)" 
                    icon={<IconInfoCircle />}
                    mt="xl"
                >
                    {systemNotice.content}
                </Alert>
            )}

            {/* Aviso se estiver desativado */}
            {systemNotice && systemNotice.is_active === 0 && (
                <Alert variant="outline" color="gray" title="Aviso Desativado" mt="xl" icon={<IconInfoCircle />}>
                    O aviso global está oculto. Clique em "Editar Aviso Global" para configurar e ativar.
                </Alert>
            )}
        </>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function DashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    
    // Novo estado para o aviso
    const [systemNotice, setSystemNotice] = useState(null);

    // Pega usuário do localStorage
    const user = JSON.parse(localStorage.getItem('sgpi_user') || '{}');
    const userRole = user.role || 'professor';

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Carrega Estatísticas
                const statsResponse = await api.get('/dashboard/stats');
                setStats(statsResponse.data);

                // 2. Carrega Aviso Global
                const noticeResponse = await api.get('/system/notice');
                setSystemNotice(noticeResponse.data);

            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Função para abrir modal de edição (Coordenador)
    const openEditNoticeModal = () => {
        let content = systemNotice?.content || '';
        let type = systemNotice?.type || 'info';
        let isActive = systemNotice?.is_active === 1;

        modals.open({
            title: 'Editar Aviso Global',
            centered: true,
            children: (
                <EditNoticeForm 
                    initialValues={{ content, type, isActive }}
                    onSave={(newData) => {
                        setSystemNotice(newData);
                        modals.closeAll();
                    }}
                />
            )
        });
    };

    return (
        <Container size="xl" py="xl">
            <Title order={2} mb="xs">Olá, {user?.name || 'Professor'}!</Title>
            
            {userRole === 'coordenador' ? (
                <CoordinatorDashboard 
                    stats={stats} 
                    loading={loading} 
                    systemNotice={systemNotice}
                    openEditNoticeModal={openEditNoticeModal}
                />
            ) : (
                <ProfessorDashboard 
                    stats={stats} 
                    navigate={navigate} 
                    loading={loading} 
                    systemNotice={systemNotice}
                />
            )}
            
        </Container>
    );
}