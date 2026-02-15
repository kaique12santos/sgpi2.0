import React, { useEffect, useState } from 'react';
import { 
    Container, Title, TextInput, Table, Group, Text, Badge, ActionIcon, 
    Paper, Avatar, Tooltip, Button, LoadingOverlay, Pagination, Select
} from '@mantine/core';
import { 
    IconSearch, IconBrandGoogleDrive, IconFolder, IconFileText, 
    IconAlertCircle, IconCheck, IconExternalLink, IconDownload, IconTrash
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals'; 
import api from '../../api/axios';
import { getDisciplineColor } from '../../utils/CoresAuxiliares'; 


export default function CoordinatorPanelPage() {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [downloadingId, setDownloadingId] = useState(null);

    const [deletingId, setDeletingId] = useState(null);
    
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

   const handleDeleteFolder = (folder) => {
        // Abre o modal elegante do Mantine
        modals.openConfirmModal({
            title: <Text fw={700}>Excluir Entrega Permanente</Text>,
            centered: true,
            children: (
                <Text size="sm">
                    Você está prestes a excluir a entrega <strong>{folder.title}</strong> do professor <strong>{folder.professor_name}</strong>.
                    <br /><br />
                    Essa ação apagará todos os arquivos do Drive e o registro do banco.
                    <br />
                    <Text span c="dimmed" size="xs">Nota: A exclusão só será permitida se a pasta estiver vazia ou tiver mais de 5 anos.</Text>
                </Text>
            ),
            labels: { confirm: 'Sim, excluir pasta', cancel: 'Cancelar' },
            confirmProps: { color: 'red' }, // Botão vermelho para perigo
            onConfirm: async () => {
                // A lógica de exclusão vem para cá (callback do Confirmar)
                try {
                    setDeletingId(folder.id); // Ativa spinner na lixeira da tabela

                    // Chama a rota de DELETE
                    await api.delete(`/management/folders/${folder.id}`);

                    // Sucesso: Remove da lista visualmente
                    setFolders((current) => current.filter((f) => f.id !== folder.id));

                    notifications.show({
                        title: 'Pasta Excluída',
                        message: 'O registro e os arquivos foram removidos.',
                        color: 'green',
                        icon: <IconCheck size={16} />
                    });

                } catch (error) {
                    console.error('Erro ao deletar:', error);
                    
                    const errorMsg = error.response?.data?.error || 'Erro ao excluir pasta.';
                    
                    notifications.show({
                        title: 'Ação Bloqueada',
                        message: errorMsg,
                        color: 'red',
                        autoClose: 6000,
                        icon: <IconAlertCircle size={16} />
                    });
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleDownloadZip = async (folderId, folderTitle) => {
        try {
            setDownloadingId(folderId); // Ativa spinner neste botão
            
            notifications.show({ 
                id: 'download-load', 
                loading: true, 
                title: 'Gerando ZIP...', 
                message: 'Isso pode levar alguns segundos.', 
                autoClose: false, 
                withCloseButton: false 
            });

            // Chama a API pedindo o arquivo (responseType: 'blob' é essencial!)
            const response = await api.get(`/downloads/folder/${folderId}`, {
                responseType: 'blob' 
            });

            // Cria um link temporário no navegador para forçar o download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Define o nome do arquivo (Sanitiza o título para não quebrar)
            const safeName = folderTitle.replace(/[^a-z0-9]/gi, '_');
            link.setAttribute('download', `${safeName}.zip`);
            
            document.body.appendChild(link);
            link.click();
            
            // Limpeza
            link.remove();
            window.URL.revokeObjectURL(url);

            notifications.update({ 
                id: 'download-load', 
                color: 'green', 
                title: 'Download Iniciado', 
                message: 'O arquivo ZIP foi transferido.', 
                icon: <IconCheck size={16} />, 
                autoClose: 3000 
            });

        } catch (error) {
            console.error('Erro download:', error);
            notifications.update({ 
                id: 'download-load', 
                color: 'red', 
                title: 'Falha no Download', 
                message: 'Não foi possível gerar o pacote ZIP.', 
                autoClose: 4000 
            });
        } finally {
            setDownloadingId(null);
        }
    };
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
                <Group gap={4} justify="flex-end">
                    
                    {/* Botão Download */}
                    <Tooltip label="Baixar Pacote ZIP">
                        <ActionIcon 
                            variant="light" 
                            color="teal" 
                            size="lg"
                            loading={downloadingId === folder.id}
                            onClick={() => handleDownloadZip(folder.id, folder.title)}
                            disabled={folder.total_files === 0}
                        >
                            <IconDownload size={20} />
                        </ActionIcon>
                    </Tooltip>

                    {/* Botão Drive */}
                    <Tooltip label="Abrir no Google Drive">
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

                    {/* NOVO: Botão Excluir */}
                    <Tooltip label="Excluir Entrega (Apenas se vazia ou > 5 anos)">
                        <ActionIcon 
                            variant="subtle" 
                            color="red" 
                            size="lg"
                            loading={deletingId === folder.id} // Spinner na lixeira
                            onClick={() => handleDeleteFolder(folder)}
                        >
                            <IconTrash size={20} />
                        </ActionIcon>
                    </Tooltip>

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