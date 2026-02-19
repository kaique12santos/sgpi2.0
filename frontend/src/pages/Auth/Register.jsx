import React, { useState } from 'react';
import { 
    TextInput, PasswordInput, Paper, Title, Text, Container, Button, 
    Anchor, Stepper, Group, PinInput, Center ,Image,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // Certifique-se que o axios está configurado aqui
import { IconUserPlus, IconMailCheck, IconShieldCheck } from '@tabler/icons-react';

import logoSgpi from '../../assets/img/logo-sgpi.png';

export default function Register() {
    const navigate = useNavigate();
    const [active, setActive] = useState(0); // 0 = Form, 1 = Token, 2 = Sucesso
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const form = useForm({
        initialValues: { name: '', email: '', password: '', confirmPassword: '' },
        validate: {
            name: (val) => (val.length < 3 ? 'Nome muito curto' : null),
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Email inválido'),
            password: (val) => (val.length < 6 ? 'Mínimo 6 caracteres' : null),
            confirmPassword: (val, values) => (val !== values.password ? 'Senhas não conferem' : null),
        },
    });

    const handleRegister = async (values) => {
        setLoading(true);
        try {

            const response = await api.post('/auth/register', {
                name: values.name,
                email: values.email,
                password: values.password,
                role: 'professor'
            });
            
            setUserEmail(values.email);
            
            notifications.show({ 
                title: 'Tudo certo!', 
                message: 'Código de validação enviado para seu e-mail.', 
                color: 'blue' 
            });
            
            setActive(1); 

        } catch (error) {
            notifications.show({ 
                title: 'Atenção', 
                message: error.response?.data?.error || 'Erro ao realizar cadastro.', 
                color: 'red' 
            });
        } finally {
            setLoading(false);
        }
    };
    // Reenviar Código
    const handleResend = async () => {
        setLoading(true);
        try {
            await api.post('/auth/resend-verification', { email: userEmail });
            notifications.show({ title: 'Enviado!', message: 'Novo código enviado para seu email.', color: 'blue' });
        } catch (error) {
            notifications.show({ 
                title: 'Erro', 
                message: error.response?.data?.error || 'Erro ao reenviar.', 
                color: 'red' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Validar Token
    const handleVerify = async (token) => {
        if (token.length < 6) return;
        setLoading(true);
        try {
            await api.post('/auth/verify', { email: userEmail, code: token });
            notifications.show({ title: 'Conta Ativada!', message: 'Você já pode fazer login.', color: 'green' });
            navigate('/login');
        } catch (error) {
            notifications.show({ 
                title: 'Token Inválido', 
                message: error.response?.data?.error || 'Código incorreto.', 
                color: 'red' 
            });
        } finally {
            setLoading(false);
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
            <Container size={500} p={0}>
                <Paper shadow="xl" radius="lg" style={{ overflow: 'hidden' }}>
                    
                    {/* --- CABEÇALHO VERMELHO --- */}
                    <div style={{ backgroundColor: '#970000', padding: '25px', textAlign: 'center' }}>
                        <Group justify="center" gap="xs">
                            <Image 
                                src={logoSgpi} 
                                w={40} 
                                h={40} 
                                fit="contain" 
                                fallbackSrc="https://placehold.co/40/white/red?text=S" 
                            />
                            <Text c="white" size="1.8rem" fw={700} style={{ fontFamily: 'Roboto' }}>
                                SGPI
                            </Text>
                        </Group>
                        <Text c="white" size="sm" opacity={0.9} mt={5}>
                            Cadastro de Novos Usuários
                        </Text>
                    </div>

                    {/* --- CORPO BRANCO --- */}
                    <div style={{ padding: '30px' }}>
                        
                        {/* Barra de Progresso */}
                        <Stepper active={active} onStepClick={null} size="sm" color="red" mb={30}>
                            <Stepper.Step label="Dados" description="Informações Pessoais" icon={<IconUserPlus size={16} />} />
                            <Stepper.Step label="Validação" description="Código via Email" icon={<IconMailCheck size={16} />} />
                        </Stepper>

                        {/* ETAPA 1: Formulário de Cadastro */}
                        {active === 0 && (
                            <form onSubmit={form.onSubmit(handleRegister)}>
                                <TextInput 
                                    label="Nome Completo" 
                                    placeholder="Seu nome" 
                                    required 
                                    radius="md"
                                    styles={{ input: { backgroundColor: '#f8f9fa' } }}
                                    {...form.getInputProps('name')} 
                                />
                                
                                <TextInput 
                                    mt="md" 
                                    label="Email Institucional" 
                                    placeholder="seu@fatec.sp.gov.br" 
                                    required 
                                    radius="md"
                                    styles={{ input: { backgroundColor: '#f8f9fa' } }}
                                    {...form.getInputProps('email')} 
                                />
                                
                                <PasswordInput 
                                    mt="md" 
                                    label="Senha" 
                                    placeholder="Crie uma senha forte" 
                                    required 
                                    radius="md"
                                    styles={{ input: { backgroundColor: '#f8f9fa' } }}
                                    {...form.getInputProps('password')} 
                                />
                                
                                <PasswordInput 
                                    mt="md" 
                                    label="Confirmar Senha" 
                                    placeholder="Repita a senha" 
                                    required 
                                    radius="md"
                                    styles={{ input: { backgroundColor: '#f8f9fa' } }}
                                    {...form.getInputProps('confirmPassword')} 
                                />
                                
                                <Button fullWidth mt="xl" type="submit" color="fatecRed" size="md" radius="md" loading={loading}>
                                    Continuar
                                </Button>
                            </form>
                        )}

                        {/* ETAPA 2: Validação do Token */}
                        {active === 1 && (
                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <Text size="sm" mb="xl">
                                    Enviamos um código de 6 dígitos para:<br/>
                                    <b>{userEmail}</b>
                                </Text>
                                
                                <Center>
                                    <PinInput 
                                        length={6} 
                                        type="number" 
                                        size="lg" 
                                        radius="md"
                                        onComplete={handleVerify} 
                                        disabled={loading} 
                                        autoFocus
                                    />
                                </Center>

                                <Group justify="center" mt="xl">
                                    <Button variant="default" size="xs" onClick={() => setActive(0)}>
                                        Corrigir Email
                                    </Button>
                                    <Button 
                                        variant="subtle" 
                                        color="red" 
                                        size="xs" 
                                        onClick={() => handleResend({ ...form.values })} // Reenviar código
                                        loading={loading}
                                    >
                                        Reenviar Código
                                    </Button>
                                </Group>
                            </div>
                        )}

                        {/* Link Voltar para Login */}
                        <Group justify="center" mt={40} style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                            <Text size="xs" c="dimmed">Já possui conta?</Text>
                            <Anchor component="button" size="sm" c="red" fw={600} onClick={() => navigate('/login')}>
                                Fazer Login
                            </Anchor>
                        </Group>
                    </div>
                </Paper>
            </Container>
        </div>
    );
}



                

