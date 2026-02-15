import React, { useEffect, useState } from 'react';
import { 
    Container, Title, Table, Group, Text, Badge, ActionIcon, 
    Paper, Avatar, Button, TextInput, Select, LoadingOverlay, Pagination 
} from '@mantine/core';
import { IconPencil, IconTrash, IconSearch, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals'; 
import api from '../../api/axios';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activePage, setActivePage] = useState(1);
    const itemsPerPage = 10;

    // --- CARREGAR DADOS ---
    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            notifications.show({ title: 'Erro', message: 'Erro ao carregar usuários.', color: 'red' });
        } finally {
            setLoading(false);
        }
    }

    // --- FUNÇÃO DE EDITAR (ABRE MODAL) ---
    const openEditModal = (user) => {
        modals.open({
            title: 'Editar Usuário',
            centered: true,
            children: (
                <EditUserForm 
                    user={user} 
                    onSave={() => {
                        modals.closeAll();
                        loadUsers(); // Recarrega a lista
                    }} 
                />
            ),
        });
    };

    // --- FUNÇÃO DE EXCLUIR (COM CONFIRMAÇÃO) ---
    const handleDelete = (user) => {
        modals.openConfirmModal({
            title: 'Excluir Usuário',
            centered: true,
            children: (
                <Text size="sm">
                    Tem certeza que deseja remover <strong>{user.name}</strong>?<br/>
                    Essa ação não pode ser desfeita.
                </Text>
            ),
            labels: { confirm: 'Excluir', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${user.id}`);
                    notifications.show({ title: 'Sucesso', message: 'Usuário removido.', color: 'green' });
                    setUsers(current => current.filter(u => u.id !== user.id));
                } catch (error) {
                    const msg = error.response?.data?.error || 'Erro ao excluir.';
                    notifications.show({ title: 'Erro', message: msg, color: 'red' });
                }
            }
        });
    };

    // --- FILTRAGEM E PAGINAÇÃO ---
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const paginatedUsers = filteredUsers.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

    // --- TABELA ---
    const rows = paginatedUsers.map((user) => (
        <Table.Tr key={user.id}>
            <Table.Td>
                <Group gap="sm">
                    <Avatar radius="xl" color="blue">{user.name.charAt(0)}</Avatar>
                    <div>
                        <Text size="sm" fw={500}>{user.name}</Text>
                        <Text size="xs" c="dimmed">{user.email}</Text>
                    </div>
                </Group>
            </Table.Td>
            <Table.Td>
                <Badge color={user.role === 'coordenador' ? 'purple' : 'blue'}>
                    {user.role}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap={0} justify="flex-end">
                    <ActionIcon variant="subtle" color="gray" onClick={() => openEditModal(user)}>
                        <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(user)}>
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2}>Gerenciar Usuários</Title>
                <Button leftSection={<IconUserPlus size={16}/>} onClick={() => notifications.show({message: 'Implementação futura: Criar via Admin'})}>
                    Novo Usuário
                </Button>
            </Group>

            <Paper withBorder p="md" radius="md">
                <TextInput 
                    placeholder="Buscar por nome ou email..." 
                    leftSection={<IconSearch size={16}/>} 
                    mb="md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Usuário</Table.Th>
                                <Table.Th>Cargo</Table.Th>
                                <Table.Th style={{textAlign: 'right'}}>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </div>
                 {/* PAGINAÇÃO */}
                 {filteredUsers.length > itemsPerPage && (
                    <Group justify="center" mt="md">
                        <Pagination total={Math.ceil(filteredUsers.length / itemsPerPage)} value={activePage} onChange={setActivePage} />
                    </Group>
                )}
            </Paper>
        </Container>
    );
}

// --- SUB-COMPONENTE DE FORMULÁRIO (DENTRO DO MESMO ARQUIVO PARA SIMPLIFICAR) ---
function EditUserForm({ user, onSave }) {
    const [formData, setFormData] = useState({ 
        name: user.name, 
        email: user.email, 
        role: user.role 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.put(`/admin/users/${user.id}`, formData);
            notifications.show({ title: 'Sucesso', message: 'Dados atualizados.', color: 'green' });
            onSave(); // Fecha modal e recarrega
        } catch (error) {
            notifications.show({ title: 'Erro', message: 'Falha ao salvar.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingTop: 10 }}>
            <TextInput 
                label="Nome" 
                mb="sm" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <TextInput 
                label="Email" 
                mb="sm" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Select 
                label="Cargo (Role)" 
                mb="lg"
                data={['professor', 'coordenador']}
                value={formData.role}
                onChange={(val) => setFormData({...formData, role: val})}
            />
            <Group justify="flex-end">
                <Button variant="default" onClick={() => modals.closeAll()}>Cancelar</Button>
                <Button onClick={handleSubmit} loading={loading} color="blue">Salvar</Button>
            </Group>
        </div>
    );
}