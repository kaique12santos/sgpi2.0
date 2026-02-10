import React, { useEffect, useState } from 'react';
import { 
    Container, Title, Table, Group, Text, ActionIcon, 
    Badge, Paper, Button, Modal, TextInput, LoadingOverlay, Tooltip 
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconFolder, IconFileText, IconAlertTriangle } from '@tabler/icons-react';
import api from '../../api/axios'; // Ajuste conforme o caminho da sua instância axios

export default function MyFoldersPage() {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para Edição (Rename)
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [newTitle, setNewTitle] = useState('');

    // Estados para Exclusão (Delete)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // 1. GET: Buscar pastas ao carregar
    const fetchFolders = async () => {
        try {
            setLoading(true);
            // Chama a rota que criamos: GET /api/folders/my-folders
            const response = await api.get('/folders/my-folders'); 
            setFolders(response.data.folders || []);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Falha ao carregar pastas.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

    // 2. PUT: Função de Renomear
    const handleRename = async () => {
        if (!newTitle.trim()) return;
        
        try {
            await api.put(`/folders/${editingFolder.id}`, { title: newTitle });
            
            notifications.show({ title: 'Sucesso', message: 'Pasta renomeada!', color: 'green' });
            
            // Atualiza a lista localmente para não precisar recarregar tudo do servidor
            setFolders(current => current.map(f => 
                f.id === editingFolder.id ? { ...f, title: newTitle } : f
            ));
            
            setEditModalOpen(false);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Não foi possível renomear.', color: 'red' });
        }
    };

    // 3. DELETE: Função de Excluir
    const handleDelete = async () => {
        if (!folderToDelete) return;
        setDeleting(true);

        try {
            await api.delete(`/folders/${folderToDelete.id}`);
            
            notifications.show({ title: 'Removido', message: 'Pacote excluído com sucesso.', color: 'blue' });
            
            // Remove da lista localmente
            setFolders(current => current.filter(f => f.id !== folderToDelete.id));
            
            setDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Falha ao excluir pasta.', color: 'red' });
        } finally {
            setDeleting(false);
        }
    };

    // Preparar Modal de Edição
    const openEditModal = (folder) => {
        setEditingFolder(folder);
        setNewTitle(folder.title);
        setEditModalOpen(true);
    };

    // Preparar Modal de Exclusão
    const openDeleteModal = (folder) => {
        setFolderToDelete(folder);
        setDeleteModalOpen(true);
    };

    // Renderização das linhas da tabela
    const rows = folders.map((folder) => (
        <Table.Tr key={folder.id}>
            <Table.Td>
                <Group gap="sm">
                    <IconFolder size={20} color="#1c7ed6" />
                    <div>
                        <Text size="sm" fw={500}>{folder.title}</Text>
                        <Text size="xs" c="dimmed">Criado em: {new Date(folder.created_at).toLocaleDateString()}</Text>
                    </div>
                </Group>
            </Table.Td>
            <Table.Td>
                <Badge variant="light" color="gray">{folder.discipline_name}</Badge>
                <Text size="xs" c="dimmed" mt={4}>{folder.semester_label}</Text>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <IconFileText size={16} color="gray" />
                    <Text size="sm">{folder.total_files} arquivos</Text>
                    {folder.pending_files > 0 && (
                        <Badge size="xs" color="yellow" variant="dot">Processando</Badge>
                    )}
                </Group>
            </Table.Td>
            <Table.Td>
                <Group gap={0} justify="flex-end">
                    <Tooltip label="Renomear">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(folder)}>
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Excluir">
                        <ActionIcon variant="subtle" color="red" onClick={() => openDeleteModal(folder)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2}>Meus Pacotes de Entrega</Title>
                <Button onClick={fetchFolders} variant="default" size="xs">Atualizar</Button>
            </Group>

            <Paper withBorder shadow="sm" radius="md" p="md" pos="relative">
                <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
                
                {folders.length === 0 && !loading ? (
                    <Text c="dimmed" ta="center" py="xl">Nenhum pacote encontrado.</Text>
                ) : (
                    <Table verticalSpacing="sm" highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Título do Trabalho</Table.Th>
                                <Table.Th>Disciplina</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                )}
            </Paper>

            {/* MODAL DE EDIÇÃO */}
            <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="Renomear Pasta">
                <TextInput
                    label="Novo Título"
                    placeholder="Ex: Entrega Final Corrigida"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    data-autofocus
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleRename} color="blue">Salvar</Button>
                </Group>
            </Modal>

            {/* MODAL DE EXCLUSÃO */}
            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Excluir Pasta" color="red">
                <Text size="sm" mb="lg">
                    Tem certeza que deseja excluir <b>{folderToDelete?.title}</b>?
                    <br />
                    Isso apagará todos os arquivos vinculados do sistema e os enviará para a lixeira do Google Drive.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                    <Button color="red" onClick={handleDelete} loading={deleting}>Excluir Definitivamente</Button>
                </Group>
            </Modal>
        </Container>
    );
}