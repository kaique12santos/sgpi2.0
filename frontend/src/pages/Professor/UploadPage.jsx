import React, { useEffect, useState } from 'react';
import { 
    Container, Paper, Title, Text, TextInput, Select, Button, Group, 
    rem, Progress, Alert 
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconFileTypePdf, IconFileZip, IconFileText } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function UploadPage() {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Disciplinas do Curso (Isso pode vir do banco depois)
    const [disciplinas, setDisciplinas] = useState([])

    useEffect(() => {
        async function fetchFolders() {
            try {
                // Ajuste a rota se necessário (ex: /uploads/submission-folders ou /submission-folders)
                // Baseado nos testes anteriores, parece que você corrigiu para bater na rota certa.
                const response = await api.get('/submission-folders'); 
                
                console.log("DADOS BRUTOS:", response.data);

                const uniqueValues = new Set();
                const formatted = [];

                response.data.forEach(folder => {
                    // 1. Proteção contra IDs nulos ou duplicados
                    if (folder.discipline_id && !uniqueValues.has(folder.discipline_id)) {
                        
                        uniqueValues.add(folder.discipline_id);

                        // 2. Monta o Label bonito (trata caso venha sem nome de disciplina)
                        formatted.push({
                            // CORREÇÃO CRUCIAL AQUI: 👇
                            // Enviamos o ID numérico da disciplina (ex: 3), não a string do Drive
                            value: String(folder.discipline_id), 
                            
                            // Label: Usa o nome da disciplina vindo do JOIN
                            label: folder.discipline_name || folder.title
                        });
                    }
                });
                formatted.sort((a, b) => a.label.localeCompare(b.label));

                setDisciplinas(formatted);
                
            } catch (error) {
                console.error('Erro ao buscar pastas:', error);
                notifications.show({ 
                    title: 'Erro de Carregamento', 
                    message: 'Não foi possível carregar as disciplinas.', 
                    color: 'red' 
                });
            }
        }
        fetchFolders();
    }, []);

    const form = useForm({
        initialValues: {
            title: '',
            discipline: '',
        },
        validate: {
            title: (value) => (value.length < 5 ? 'O título deve ser descritivo' : null),
            discipline: (value) => (!value ? 'Selecione uma disciplina' : null),
        },
    });

    const handleUpload = async (values) => {
        if (files.length === 0) {
            return notifications.show({ title: 'Atenção', message: 'Selecione pelo menos um arquivo.', color: 'red' });
        }
        if (!files) {
            return notifications.show({ 
                title: 'Falta o arquivo', 
                message: 'Por favor, anexe o documento do projeto.', 
                color: 'red' 
            });
        }

        setUploading(true);
        setProgress(0);

        console.log("Enviando Package ID:", values.discipline);
        // Cria o objeto FormData para envio de arquivo
        const formData = new FormData();
        formData.append('package_id', values.discipline);
        
        formData.append('title', values.title);
        
        files.forEach(files => {
            formData.append('files', files);
        })
        // O semestre geralmente o backend calcula automático ou pegamos o atual
        // formData.append('semester', '2026_1'); 

        try {
            await api.post('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            notifications.show({ 
                title: 'Enviado!', 
                message: 'Seu projeto foi entregue com sucesso.', 
                color: 'green' 
            });
            
            navigate('/dashboard'); // Volta para o painel

        } catch (error) {
            notifications.show({ 
                title: 'Erro no envio', 
                message: error.response?.data?.error || 'Falha ao conectar com servidor.', 
                color: 'red' 
            });
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Container size="md">
            <Title order={2} mb="xs">Nova Entrega</Title>
            <Text c="dimmed" mb="xl">Envie a documentação ou código fonte do seu Projeto Integrador.</Text>

            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <form onSubmit={form.onSubmit(handleUpload)}>
                    
                    <Group grow mb="md">
                        <TextInput 
                            label="Título do Trabalho" 
                            placeholder="Ex: Documentação Sprint 1 - Grupo Alpha" 
                            required 
                            {...form.getInputProps('title')}
                        />
                        <Select 
                            label="Disciplina Vinculada" 
                            placeholder="Selecione..." 
                            data={disciplinas}
                            required
                            searchable
                            {...form.getInputProps('discipline')}
                        />
                    </Group>

                    <Text fw={500} size="sm" mb={5}>Arquivo do Projeto (PDF ou ZIP)</Text>
                    
                    {/* DROPZONE AREA */}
                    <Dropzone
                        onDrop={(acceptedFiles) => setFiles(acceptedFiles)}
                        maxFiles={10}
                        onReject={(rejections) => {
                            // Feedback se tentar mandar mais de 10
                            if (rejections.some(r => r.errors.some(e => e.code === 'too-many-files'))) {
                                notifications.show({ title: 'Limite excedido', message: 'Máximo de 10 arquivos por vez.', color: 'red' });
                            }
                        }}
                        
                        maxSize={50 * 1024 * 1024} // 50MB
                        accept={[MIME_TYPES.pdf, MIME_TYPES.zip]}
                        multiple={true}
                        loading={uploading}
                        style={{ border: files ? '2px solid green' : undefined }}
                    >
                        <Group justify="center" gap="xl" style={{ minHeight: rem(120), pointerEvents: 'none' }}>
                            <Dropzone.Accept>
                                <IconUpload size="3.2rem" stroke={1.5} />
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <IconX size="3.2rem" stroke={1.5} />
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                {files ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <IconFileTypePdf size="3.2rem" stroke={1.5} color="green" />
                                        <Text size="xl" inline>
                                            {files.name}
                                        </Text>
                                        <Text size="sm" c="dimmed" inline mt={7}>
                                            {(files.size / 1024 / 1024).toFixed(2)} MB prontos para envio
                                        </Text>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <IconUpload size="3.2rem" stroke={1.5} />
                                        <Text size="xl" inline>
                                            Arraste o arquivo aqui ou clique para selecionar
                                        </Text>
                                        <Text size="sm" c="dimmed" inline mt={7}>
                                            Suporta arquivos .pdf e .zip (Máx 50MB)
                                        </Text>
                                    </div>
                                )}
                            </Dropzone.Idle>
                        </Group>
                    </Dropzone>

                    {files.length > 0 && (
                        <Paper withBorder p="xs" mt="md">
                            <Text size="sm" fw={500} mb="xs">Arquivos na fila:</Text>
                            {files.map((file, index) => (
                                <Text key={index} size="xs" c="dimmed">• {file.name} ({ (file.size/1024/1024).toFixed(2) } MB)</Text>
                            ))}
                        </Paper>
                    )}
                    {/* BARRA DE PROGRESSO */}
                    {uploading && (
                        <Progress value={progress} label={`${progress}%`} size="xl" radius="xl" mt="md" animated striped color="fatecRed" />
                    )}

                    <Group justify="right" mt="xl">
                        <Button variant="default" onClick={() => navigate('/dashboard')} disabled={uploading}>
                            Cancelar
                        </Button>
                        <Button type="submit" color="fatecRed" loading={uploading} leftSection={<IconUpload size={18}/>}>
                            Realizar Entrega
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}