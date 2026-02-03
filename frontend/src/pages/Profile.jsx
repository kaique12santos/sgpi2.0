import React, { useContext } from 'react';
import { 
    Container, Title, Paper, TextInput, Group, Button, Avatar, Text, Divider, Badge 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { AuthContext } from '../context/AuthContext';
import { IconDeviceFloppy } from '@tabler/icons-react';

export default function Profile() {
    const { user } = useContext(AuthContext);

    const form = useForm({
        initialValues: {
            name: user?.name || '',
            email: user?.email || '',
        },
    });

    return (
        <Container size="md">
            <Title order={2} mb="lg">Meu Perfil</Title>

            <Paper shadow="xs" radius="md" p="xl" withBorder>
                <Group>
                    <Avatar 
                        size={80} 
                        radius={80} 
                        color="fatecRed" 
                        variant="filled"
                    >
                        {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <Text fz="lg" fw={500} tt="capitalize">{user?.name}</Text>
                        <Group gap={5}>
                            <Text fz="xs" c="dimmed">{user?.email}</Text>
                            <Badge color={user?.role === 'coordenador' ? 'red' : 'blue'} variant="light">
                                {user?.role}
                            </Badge>
                        </Group>
                    </div>
                </Group>

                <Divider my="lg" label="Dados da Conta" labelPosition="center" />

                <form>
                    <Group grow>
                        <TextInput 
                            label="Nome Completo" 
                            description="Como você aparece para os outros usuários"
                            {...form.getInputProps('name')} 
                        />
                        <TextInput 
                            label="Email" 
                            disabled 
                            description="Para alterar o email, contate o administrador"
                            {...form.getInputProps('email')} 
                        />
                    </Group>

                    <Button mt="xl" color="fatecRed" leftSection={<IconDeviceFloppy size={18}/>} disabled>
                        Salvar Alterações (Em breve)
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}