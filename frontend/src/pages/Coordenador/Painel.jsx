import React, { useEffect, useState } from 'react';
import { 
    Container, Title, TextInput, Table, Group, Text, Badge, ActionIcon, 
    Paper, Avatar, Tooltip, Button, LoadingOverlay, Pagination, Select
} from '@mantine/core';
import { 
    IconSearch, IconBrandGoogleDrive, IconFolder, IconFileText, 
    IconAlertCircle, IconCheck, IconExternalLink 
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import api from '../../api/axios';
import { getDisciplineColor } from '../../utils/CoresAuxiliares'; // Certifique-se que esse arquivo existe

export default function CoordinatorPanelPage() {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Paginação (opcional, mas bom ter preparado)
    const [activePage, setActivePage] = useState(1);
    const itemsPerPage = 10;

    // Carregar dados
    useEffect(() => {
        async function loadFolders() {
            try {
                // Chama a rota nova que criamos no Backend
                const response = await api.get('/submission-folders/painel');
                setFolders(response.data);
            } catch (error) {
                console.error(error);
                notifications.show({
                    title: 'Erro',
                    message: 'Não foi possível carregar o painel do coordenador.',
                    color: 'red'
                });
            } finally {
                setLoading(false);
            }
        }
        loadFolders();
    }, []);

    // Função de Filtragem (Busca por Professor, Disciplina ou Título)
    const filteredFolders = folders.filter(folder => {
        const query = search.toLowerCase();
        return (
            folder.professor_name?.toLowerCase().includes(query) ||
            folder.discipline_name?.toLowerCase().includes(query) ||
            folder.title?.toLowerCase().includes(query)
        );
    });

    // Lógica de Paginação Visual
    const paginatedFolders = filteredFolders.slice(
        (activePage - 1) * itemsPerPage,
        activePage * itemsPerPage
    );

    // Utilitário para iniciais do Avatar
    const getInitials = (name) => name ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'U';

    // Utilitário para data
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: '2-digit'
        });
    };

    // Linhas da Tabela
    const rows = paginatedFolders.map((folder) => (
        <Table.Tr key={folder.id}>
            
            {/* 1. PROFESSOR */}
            <Table.Td>
                <Group gap="sm">
                    <Avatar color="blue" radius="xl" size="sm">
                        {getInitials(folder.professor_name)}
                    </Avatar>
                    <div>
                        <Text size="sm" fw={500}>{folder.professor_name}</Text>
                        <Text size="xs" c="dimmed">Professor</Text>
                    </div>
                </Group>
            </Table.Td>

            {/* 2. DISCIPLINA & SEMESTRE */}
            <Table.Td>
                <Badge 
                    color={getDisciplineColor ? getDisciplineColor(parseInt(folder.semester_label)) : 'gray'} 
                    variant="light"
                >
                    {folder.semester_label}º Sem - {folder.discipline_name}
                </Badge>
            </Table.Td>

            {/* 3. TÍTULO DA ENTREGA */}
            <Table.Td>
                <Text fw={500} size="sm">{folder.title}</Text>
                <Text c="dimmed" size="xs">Criado em: {formatDate(folder.created_at)}</Text>
            </Table.Td>

            {/* 4. ESTATÍSTICAS (Arquivos) */}
            <Table.Td>
                <Group gap="xs">
                    {/* Total de Arquivos */}
                    <Tooltip label="Total de Arquivos">
                        <Badge variant="outline" color="gray" leftSection={<IconFileText size={12}/>}>
                            {folder.total_files || 0}
                        </Badge>
                    </Tooltip>

                    {/* Pendentes (Se houver) */}
                    {(folder.pending_files > 0) && (
                        <Tooltip label="Processando (Worker)">
                            <Badge variant="filled" color="orange">
                                {folder.pending_files} ...
                            </Badge>
                        </Tooltip>
                    )}

                    {/* Erros (Se houver) */}
                    {(folder.error_files > 0) && (
                         <Tooltip label="Arquivos com Erro">
                            <Badge variant="filled" color="red" leftSection={<IconAlertCircle size={12}/>}>
                                {folder.error_files}
                            </Badge>
                        </Tooltip>
                    )}
                </Group>
            </Table.Td>

            {/* 5. AÇÕES */}
            <Table.Td>
                <Group gap={0} justify="flex-end">
                    <Tooltip label="Abrir pasta no Google Drive">
                        <ActionIcon 
                            variant="subtle" 
                            color="blue" 
                            size="lg"
                            component="a"
                            href={`https://drive.google.com/drive/folders/${folder.drive_folder_id}`}
                            target="_blank"
                        >
                            <IconBrandGoogleDrive size={20} />
                        </ActionIcon>
                    </Tooltip>

                    {/* Futuro: Botão de Detalhes Internos */}
                    {/* <ActionIcon variant="subtle" color="gray" size="lg">
                        <IconExternalLink size={20} />
                    </ActionIcon> */}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>Painel de Controle</Title>
                    <Text c="dimmed">Visão geral de todas as entregas dos professores.</Text>
                </div>
                {/* Botão de Exportar Relatório (Visual por enquanto) */}
                <Button variant="light" color="green" leftSection={<IconFileText size={18}/>}>
                    Gerar Relatório
                </Button>
            </Group>

            <Paper withBorder p="md" radius="md" shadow="sm" mb="xl">
                {/* BARRA DE FILTROS */}
                <Group mb="md">
                    <TextInput
                        placeholder="Buscar por professor, disciplina ou título..."
                        leftSection={<IconSearch size={16} />}
                        style={{ flex: 1 }}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                    />
                </Group>

                {/* TABELA DE DADOS */}
                <Paper withBorder radius="md" style={{ overflow: 'hidden', position: 'relative' }}>
                    <LoadingOverlay visible={loading} />
                    
                    <Table verticalSpacing="sm" highlightOnHover striped>
                        <Table.Thead bg="gray.1">
                            <Table.Tr>
                                <Table.Th>Professor</Table.Th>
                                <Table.Th>Disciplina / Semestre</Table.Th>
                                <Table.Th>Entrega</Table.Th>
                                <Table.Th>Arquivos</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rows.length > 0 ? rows : (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text ta="center" c="dimmed" py="xl">
                                            {loading ? 'Carregando...' : 'Nenhuma entrega encontrada.'}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>
                
                {/* PAGINAÇÃO (Só mostra se tiver muitos itens) */}
                {filteredFolders.length > itemsPerPage && (
                    <Group justify="center" mt="md">
                        <Pagination 
                            total={Math.ceil(filteredFolders.length / itemsPerPage)} 
                            value={activePage} 
                            onChange={setActivePage} 
                        />
                    </Group>
                )}
            </Paper>
        </Container>
    );
}