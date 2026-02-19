import React, { useState } from 'react';
import { 
    TextInput, PasswordInput, Paper, Title, Text, Container, Button, 
    Anchor, Group, PinInput, Center, Alert
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0 = Email, 1 = Reset
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    
    const handleSendEmail = async () => {
        if (!/^\S+@\S+$/.test(email)) return notifications.show({ message: 'Email inválido', color: 'red' });
        
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            notifications.show({ title: 'Email enviado!', message: 'Cheque sua caixa de entrada.', color: 'blue' });
            setStep(1);
        } catch (error) {
            notifications.show({ title: 'Erro', message: 'Email não encontrado.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const formReset = useForm({
        initialValues: { code: '', newPassword: '' },
        validate: {
            code: (val) => (val.length < 6 ? 'Código inválido' : null),
            newPassword: (val) => (val.length < 6 ? 'Mínimo 6 caracteres' : null),
        },
    });

    const handleReset = async (values) => {
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email: email,
                code: values.code,
                newPassword: values.newPassword
            });
            notifications.show({ title: 'Sucesso!', message: 'Senha alterada. Faça login.', color: 'green' });
            navigate('/login');
        } catch (error) {
            notifications.show({ title: 'Erro', message: error.response?.data?.error || 'Falha ao resetar', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} my={80}>
            <Title ta="center" c="fatecRed">Recuperar Senha</Title>

            <Paper withBorder shadow="md" p={30} radius="md" mt="xl">
                {step === 0 ? (
                    <>
                        <Text size="sm" c="dimmed" mb="md">
                            Digite seu email institucional para receber o código de recuperação.
                        </Text>
                        <TextInput 
                            label="Email" 
                            placeholder="seu@fatec.sp.gov.br" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                        />
                        <Button fullWidth mt="xl" color="fatecRed" onClick={handleSendEmail} loading={loading}>
                            Enviar Código
                        </Button>
                    </>
                ) : (
                    <form onSubmit={formReset.onSubmit(handleReset)}>
                        <Alert icon={<IconInfoCircle size={16}/>} title="Verifique seu email" color="blue" mb="md">
                            Enviamos um código para {email}.
                        </Alert>
                        
                        <Text size="sm" fw={500} mb={5}>Código de 6 dígitos</Text>
                        <Center mb="md">
                             <PinInput length={6} {...formReset.getInputProps('code')} />
                        </Center>

                        <PasswordInput 
                            label="Nova Senha" 
                            required 
                            {...formReset.getInputProps('newPassword')} 
                        />
                        
                        <Button fullWidth mt="xl" type="submit" color="fatecRed" loading={loading}>
                            Alterar Senha
                        </Button>
                    </form>
                )}
            </Paper>

            <Group justify="center" mt="md">
                <Anchor c="dimmed" size="sm" onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconArrowLeft size={14} /> Voltar para Login
                </Anchor>
            </Group>
        </Container>
    );
}