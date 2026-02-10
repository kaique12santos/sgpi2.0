import React, { useEffect, useState } from 'react';
import { 
    Container, Title, Table, Group, Text, ActionIcon, 
    Badge, Paper, Button, Modal, TextInput, LoadingOverlay, Tooltip, SimpleGrid 
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconFolder, IconFileText, IconAlertTriangle, IconCloudUpload, IconUpload,
    IconX, IconFileTypePdf, IconFileZip, IconEye, IconExternalLink
} from '@tabler/icons-react';
import api from '../../api/axios'; 


const PPT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];



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
    // Estados para Upload de Arquivos
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [folderToAddFiles, setFolderToAddFiles] = useState(null);
    const [filesToAdd, setFilesToAdd] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Estados para Visualização de Arquivos
    const [viewFilesModalOpen, setViewFilesModalOpen] = useState(false);
    const [viewingFolder, setViewingFolder] = useState(null);
    const [folderFiles, setFolderFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    
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
    // 4. POST: Função de Adicionar Arquivos
    const handleAddFiles = async () => {
        if (filesToAdd.length === 0) return;
        setUploading(true);

        const formData = new FormData();
        filesToAdd.forEach(file => formData.append('files', file));

        try {
            await api.post(`/folders/${folderToAddFiles.id}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            notifications.show({ title: 'Sucesso', message: 'Arquivos adicionados!', color: 'green' });
            
            // Atualiza a contagem na lista localmente
            setFolders(current => current.map(f => 
                f.id === folderToAddFiles.id 
                ? { ...f, total_files: f.total_files + filesToAdd.length } 
                : f
            ));

            setUploadModalOpen(false);
            setFilesToAdd([]);

        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Falha ao enviar arquivos.', color: 'red' });
        } finally {
            setUploading(false);
        }
    };
    // 5. GET: Função de Visualizar Arquivos
    const handleViewFiles = async (folder) => {
        setViewingFolder(folder);
        setLoadingFiles(true);
        setViewFilesModalOpen(true);
        setFolderFiles([]); // Limpa anterior

        try {
            const response = await api.get(`/folders/${folder.id}/files`);
            setFolderFiles(response.data);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Não foi possível carregar os arquivos.', color: 'red' });
        } finally {
            setLoadingFiles(false);
        }
    };

     // Função Validadora (O Porteiro 👮‍♂️)
const handleFilesDrop = (acceptedFiles) => {
    const invalidFiles = [];
    
    // Regex: Permite APENAS letras (a-z), números, ponto, traço e underline.
    // NADA de espaços, acentos, ç ou emojis.
    const safePattern = /^[a-zA-Z0-9._-]+$/;

    const validFiles = acceptedFiles.filter((file) => {
        if (!safePattern.test(file.name)) {
            invalidFiles.push(file.name);
            return false;
        }
        return true;
    });

    // Se houver arquivos inválidos, mostra o alerta e NÃO adiciona nada
    if (invalidFiles.length > 0) {
        notifications.show({
            title: 'Nome de arquivo inválido!',
            message: (
                <>
                    Os seguintes arquivos contêm acentos, espaços ou caracteres especiais:
                    <br />
                    <strong>{invalidFiles.join(', ')}</strong>
                    <br /><br />
                    Por favor, renomeie-os usando apenas letras, números, underline (_) ou traço (-).
                </>
            ),
            color: 'red',
            autoClose: 10000, // Fica 10 segundos na tela pra ele ler
        });
        
        // Opcional: Se quiser aceitar os válidos mesmo assim, descomente abaixo.
        // Mas geralmente é melhor forçar o usuário a arrumar tudo.
        // setFiles((current) => [...current, ...validFiles]);
        return; 
    }

    // Se passou no teste, adiciona na lista
    setFilesToAdd((current) => [...current, ...validFiles]);
};

    // ... (Helper para formatar Bytes em MB)
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    // Preparar Modal de Edição
    const openEditModal = (folder) => {
        setEditingFolder(folder);
        setNewTitle(folder.title);
        setEditModalOpen(true);
    };
    
    // Preparar Modal de Upload
    const openUploadModal = (folder) => {
        setFolderToAddFiles(folder);
        setFilesToAdd([]);
        setUploadModalOpen(true);
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
                <Group gap={4} justify="flex-end">
                    
                    <Tooltip label="Ver conteúdo">
                        <ActionIcon variant="subtle" color="gray" onClick={() => handleViewFiles(folder)}>
                            <IconEye size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Adicionar mais arquivos">
                        <ActionIcon variant="subtle" color="teal" onClick={() => openUploadModal(folder)}>
                            <IconCloudUpload size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Renomear">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(folder)}>
                            <IconPencil size={18} />
                        </ActionIcon>
                    </Tooltip>
                    
                    <Tooltip label="Excluir">
                        <ActionIcon variant="subtle" color="red" onClick={() => openDeleteModal(folder)}>
                            <IconTrash size={18} />
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
            
            {/* MODAL DE VISUALIZAÇÃO DE ARQUIVOS */}
            <Modal 
                opened={viewFilesModalOpen} 
                onClose={() => setViewFilesModalOpen(false)} 
                title={
                    <Group>
                        <IconFolder size={20} />
                        <Text fw={700}>{viewingFolder?.title}</Text>
                    </Group>
                }
                size="lg"
            >
                <LoadingOverlay visible={loadingFiles} />
                
                {folderFiles.length === 0 && !loadingFiles ? (
                    <Text c="dimmed" ta="center" py="xl">Esta pasta está vazia.</Text>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Arquivo</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Tamanho</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {folderFiles.map((file) => (
                                <Table.Tr key={file.id}>
                                    <Table.Td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <Group gap="xs" wrap="nowrap">
                                            {file.mime_type?.includes('pdf') ? <IconFileText size={16} color="red"/> : <IconFileText size={16} color="blue"/>}
                                            <Text size="sm">{file.name}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge size="xs" variant="outline" color="gray">
                                            {file.mime_type?.split('/').pop() || 'FILE'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">{formatBytes(file.size)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        {file.drive_web_link && (
                                            <Button 
                                                component="a" 
                                                href={file.external_link || file.drive_web_link} 
                                                target="_blank" 
                                                variant="subtle" 
                                                size="xs" 
                                                rightSection={<IconExternalLink size={14} />}
                                                color= {file.external_link ? 'orange' : 'blue'}
                                            >
                                                {file.external_link ? 'Link Externo' : 'Ver no Drive'}
                                            </Button>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
                
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setViewFilesModalOpen(false)}>Fechar</Button>
                    {/* Atalho para adicionar mais arquivos direto daqui */}
                    <Button 
                        color="teal" 
                        leftSection={<IconCloudUpload size={16} />}
                        onClick={() => {
                            setViewFilesModalOpen(false);
                            openUploadModal(viewingFolder); // Reusa a função que já criamos!
                        }}
                    >
                        Adicionar Mais
                    </Button>
                </Group>
            </Modal>

            {/* MODAL DE EDIÇÂO UPLOAD DE ARQUIVOS */}
            <Modal 
                opened={uploadModalOpen} 
                onClose={() => setUploadModalOpen(false)} 
                title={`Adicionar arquivos em: ${folderToAddFiles?.title}`}
                size="lg"
            >
                <Text size="sm" c="dimmed" mb="md">
                    Complemente sua entrega. Os arquivos serão adicionados à pasta existente.
                </Text>

                <Dropzone
                    onDrop={handleFilesDrop}
                    maxSize={100 * 1024 * 1024}
                    // Use os mesmos accepts da tela de UploadPage
                    accept={[MIME_TYPES.pdf, 
                        MIME_TYPES.zip, 
                        'application/x-zip-compressed',
                        'application/zip',
                        'application/vnd.rar',
                        PPT_MIME_TYPE,       // Slides novos (.pptx)
                        'application/vnd.ms-powerpoint', // Slides antigos (.ppt)
                        ...VIDEO_MIME_TYPES
                    ]} 
                >
                    <Group justify="center" gap="xl" style={{ minHeight: 100, pointerEvents: 'none' }}>
                        <Dropzone.Accept><IconUpload size={40} /></Dropzone.Accept>
                        <Dropzone.Reject><IconX size={40} /></Dropzone.Reject>
                        <Dropzone.Idle>
                            <div style={{ textAlign: 'center' }}>
                                <IconCloudUpload size={40} color="gray" />
                                <Text size="sm" inline mt="xs">Arraste arquivos aqui</Text>
                            </div>
                        </Dropzone.Idle>
                    </Group>
                </Dropzone>

                {/* Lista de arquivos selecionados */}
                {filesToAdd.length > 0 && (
                    <SimpleGrid cols={1} mt="sm">
                        {filesToAdd.map((f, i) => (
                            <Text key={i} size="xs">• {f.name}</Text>
                        ))}
                    </SimpleGrid>
                )}

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setUploadModalOpen(false)}>Cancelar</Button>
                    <Button 
                        color="teal" 
                        onClick={handleAddFiles} 
                        loading={uploading}
                        disabled={filesToAdd.length === 0}
                    >
                        Enviar Novos Arquivos
                    </Button>
                </Group>
            </Modal>

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