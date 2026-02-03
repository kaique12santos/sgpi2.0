import React, { useContext } from 'react';
import { Container, Title, Text, SimpleGrid, Card, Group, ThemeIcon, Button, RingProgress, Paper } from '@mantine/core';
import { AuthContext } from '../context/AuthContext';
import { 
    IconFiles, 
    IconClock, 
    IconAlertCircle, 
    IconCheck, 
    IconUsers, 
    IconFolder, 
    IconUpload 
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// --- SUB-COMPONENTE: Visão do Professor ---
const ProfessorDashboard = ({ user, navigate }) => {
    return (
        <>
            <Text c="dimmed" mb="xl">
                Acompanhe o status das suas entregas de Projeto Integrador.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Status Atual</Text>
                        <ThemeIcon color="green" variant="light"><IconCheck size="1.2rem" /></ThemeIcon>
                    </Group>
                    <Text fz="xl" fw={700}>Em dia</Text>
                    <Text size="xs" c="dimmed" mt="sm">Nenhuma pendência urgente</Text>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Meus Envios</Text>
                        <ThemeIcon color="blue" variant="light"><IconFiles size="1.2rem" /></ThemeIcon>
                    </Group>
                    <Text fz="xl" fw={700}>4 Arquivos</Text>
                    <Text size="xs" c="dimmed" mt="sm">Último envio há 2 dias</Text>
                </Card>

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

            {/* Exemplo de Card de Aviso */}
            <Paper withBorder p="md" radius="md" mt="lg" bg="yellow.0">
                <Group>
                    <IconAlertCircle color="orange" />
                    <div>
                        <Text fw={500}>Próximo Prazo: 20/02/2026</Text>
                        <Text size="sm">Entrega da Documentação Técnica (Sprint 1)</Text>
                    </div>
                </Group>
            </Paper>
        </>
    );
};

// --- SUB-COMPONENTE: Visão do Coordenador ---
const CoordinatorDashboard = ({ user }) => {
    return (
        <>
             <Text c="dimmed" mb="xl">
                Visão geral do semestre e conformidade dos documentos.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Total Alunos</Text>
                        <IconUsers size="1.2rem" color="gray" />
                    </Group>
                    <Text fz="xl" fw={700}>142</Text>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Pastas Criadas</Text>
                        <IconFolder size="1.2rem" color="gray" />
                    </Group>
                    <Text fz="xl" fw={700}>28</Text>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Uso do Drive</Text>
                        <IconFiles size="1.2rem" color="gray" />
                    </Group>
                    <Text fz="xl" fw={700}>4.2 GB</Text>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Pendências</Text>
                        <IconAlertCircle size="1.2rem" color="red" />
                    </Group>
                    <Text fz="xl" fw={700} c="red">3</Text>
                    <Text size="xs" c="red">Prazos vencidos</Text>
                </Card>
            </SimpleGrid>

            <Title order={4} mt="xl" mb="md">Progresso de Entregas (Semestre Atual)</Title>
            <Group>
                <Paper withBorder radius="md" p="xs">
                     <Group>
                        <RingProgress
                            size={80}
                            roundCaps
                            thickness={8}
                            sections={[{ value: 65, color: 'blue' }]}
                            label={
                                <Text c="blue" fw={700} ta="center" size="xl">65%</Text>
                            }
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Documentação</Text>
                            <Text fw={700} size="xl">65/100</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper withBorder radius="md" p="xs">
                     <Group>
                        <RingProgress
                            size={80}
                            roundCaps
                            thickness={8}
                            sections={[{ value: 30, color: 'orange' }]}
                            label={
                                <Text c="orange" fw={700} ta="center" size="xl">30%</Text>
                            }
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Código Fonte</Text>
                            <Text fw={700} size="xl">30/100</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>
        </>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <Container size="xl">
            <Title order={2} mb="xs">Olá, {user?.name}!</Title>
            
            {/* Renderização Condicional Inteligente */}
            {user?.role === 'coordenador' ? (
                <CoordinatorDashboard user={user} />
            ) : (
                <ProfessorDashboard user={user} navigate={navigate} />
            )}
            
        </Container>
    );
}