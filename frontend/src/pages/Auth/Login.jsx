import React, { useContext, useEffect, useState } from 'react';
import { 
    TextInput, 
    PasswordInput, 
    Checkbox, 
    Anchor, 
    Paper, 
    Title, 
    Text, 
    Container, 
    Group, 
    Button,
    LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { AuthContext } from '../../context/AuthContext';
import { Image } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAt, IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import logoSgpi from '../../assets/img/logo-sgpi.png';

export default function Login() {
    const { signIn, signed } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (signed){
            navigate('/dashboard');
        }
    }, [signed, navigate])

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
            password: (value) => (value.length < 1 ? 'Digite sua senha' : null),
        },
    });

    const handleSubmit = async (values) => {
        setIsLoading(true);
        const success = await signIn(values);
        setIsLoading(false);
        
        if (success) {
            notifications.show({
                title: 'Bem-vindo!',
                message: 'Login realizado com sucesso.',
                color: 'green',
            });
            navigate('/dashboard');
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f1f3f5' 
        }}>
            <Container size={420} p={0}>
                <Paper shadow="xl" radius="lg" style={{ overflow: 'hidden' }}>
                    <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                    
                    {/* CABEÇALHO VERMELHO (Estilo da imagem login.png) */}
                    <div style={{ backgroundColor: '#970000', padding: '30px 20px', textAlign: 'center' }}>
                        <Group justify="center" gap="xs" mb={10}>
                            {/* Ícone do SGPI */}
                            <Image src={logoSgpi} w={40} h={40} fit="contain" fallbackSrc="https://placehold.co/40x40/white/red?text=S" />
                            <Text c="white" size="2rem" fw={700} style={{ fontFamily: 'Roboto' }}>SGPI</Text>
                        </Group>
                        <Text c="white" size="sm" fw={500}>
                            Sistema Gerenciador de<br/>Projetos Interdisciplinares
                        </Text>
                    </div>

                    {/* CORPO BRANCO */}
                    <div style={{ padding: '30px' }}>
                        <Text size="xl" fw={600} ta="center" mb="xs" c="dark">
                            Bem-vindo de volta!
                        </Text>
                        <Text size="sm" c="dimmed" ta="center" mb={30}>
                            Entre com suas credenciais para continuar
                        </Text>

                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <TextInput 
                                label="E-mail institucional" 
                                placeholder="nome@fatec.sp.gov.br" 
                                required 
                                radius="md"
                                styles={{ input: { backgroundColor: '#f8f9fa' } }} 
                                {...form.getInputProps('email')}
                            />
                            
                            <PasswordInput 
                                label="Senha" 
                                placeholder="••••••••" 
                                required 
                                mt="md" 
                                radius="md"
                                styles={{ input: { backgroundColor: '#f8f9fa' } }}
                                {...form.getInputProps('password')}
                            />
                            
                            <Group justify="right" mt="sm" mb="lg">
                                <Anchor component="button" size="xs" c="red" fw={600} onClick={() => navigate('/esqueci-senha')}>
                                    Esqueci a senha
                                </Anchor>
                            </Group>
                            
                            <Button fullWidth mt="xl" type="submit" color="fatecRed" size="md" radius="md">
                                Entrar
                            </Button>
                        </form>
                    </div>
                </Paper>
                <Text ta="center" mt="md" size="sm">
                    Ainda não tem conta?{' '}
                    <Anchor href="#" weight={700} c="fatecBlue" onClick={() => navigate('/cadastro')}>
                        Cadastre-se
                    </Anchor>
                </Text>

            </Container>
        </div>
    );
}
                