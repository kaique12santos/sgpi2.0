import React, { useEffect, useState } from 'react';
import { 
    Container, Paper, Title, Text, Avatar, TextInput, Select, Button, Group, 
    rem, Progress, Badge, Alert, Divider, Modal, SimpleGrid, ActionIcon
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { 
    IconBrandGithub, IconUpload, IconX, IconFileTypePdf, IconFileZip, 
    IconCheck, IconAlertCircle, IconFolder, IconTrash
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getDisciplineColor } from '../../utils/CoresAuxiliares';

const PPT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_TOTAL_FILES = 10; // Limite global definido aqui

export default function UploadPage() {
    const navigate = useNavigate();
    
    // Estados visuais e de dados
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [disciplinas, setDisciplinas] = useState([]);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Form do Mantine
    const form = useForm({
        initialValues: {
            title: '',
            discipline: '',
            link: '',
        },
        validate: {
            title: (value) => (value.length < 5 ? 'O título deve ser descritivo' : null),
            discipline: (value) => (!value ? 'Selecione uma disciplina' : null),
            link: (value) => (value && !value.startsWith('http') ? 'O link deve começar com http:// ou https://' : null),
        },
    });

    useEffect(() => {
        async function fetchFolders() {
            try {
                const response = await api.get('/metadata/disciplines'); 
                const listaVindaDoBanco = response.data.disciplines || [];

                const formatted = listaVindaDoBanco.map(disc => ({
                    value: String(disc.id),           
                    label: disc.name,                
                    semester_id: disc.course_level,   
                    semester_label: `${disc.course_level}º Sem` 
                }));

                formatted.sort((a, b) => {
                    if (a.semester_id !== b.semester_id) return a.semester_id - b.semester_id;
                    return a.label.localeCompare(b.label);
                });

                setDisciplinas(formatted);
            } catch (error) {
                console.error('Erro ao buscar disciplinas:', error);
                notifications.show({ title: 'Erro', message: 'Não foi possível carregar as disciplinas.', color: 'red' });
            }
        }
        fetchFolders();
    }, []);

    // Função para remover um arquivo específico da lista
    const removeFile = (indexToRemove) => {
        setFiles((current) => current.filter((_, index) => index !== indexToRemove));
    };

    const addLinkAsFile = () => {
        const link = form.values.link;
        
        if (!link) return;
        if (!link.startsWith('http')) {
            return form.setFieldError('link', 'O link deve começar com http:// ou https://');
        }

        // Trava Global de Quantidade (Links)
        if (files.length >= MAX_TOTAL_FILES) {
            return notifications.show({ 
                title: 'Limite Atingido', 
                message: `Você só pode enviar até ${MAX_TOTAL_FILES} itens por entrega. Use um arquivo .ZIP se precisar enviar mais coisas.`, 
                color: 'red' 
            });
        }

        const fileContent = `
            <html>
                <head>
                    <meta http-equiv="refresh" content="0; url=${link}" />
                    <script>window.location.href = "${link}";</script>
                </head>
                <body>
                    <p>Abrindo link externo: <a href="${link}">${link}</a></p>
                </body>
            </html>
        `;

        const blob = new Blob([fileContent], { type: 'text/html' });
        
        let fileName = 'link_externo.html';
        try {
            const urlObj = new URL(link);
            const domain = urlObj.hostname.replace('www.', '').split('.')[0]; 
            fileName = `link_${domain}_${Date.now()}.html`;
        } catch (e) { /* fallback */ }

        const file = new File([blob], fileName, { type: 'text/html' });

        setFiles((current) => [...current, file]);
        form.setFieldValue('link', '');
        notifications.show({ title: 'Link Adicionado', message: 'O link foi convertido e está na fila.', color: 'blue' });
    };

    const renderSelectOption = ({ option }) => (
        <Group flex="1" gap="md" wrap="nowrap">
            <Avatar color={getDisciplineColor(option.semester_id)} radius="xl" size="md" variant="filled">
                {option.semester_id}º
            </Avatar>
            <div style={{ flex: 1 }}>
                <Text size="sm" fw={500} style={{ lineHeight: 1.2 }}>{option.label}</Text>
                <Text size="xs" c="dimmed">{option.semester_id}º Semestre</Text>
            </div>
        </Group>
    );

    const handlePreSubmit = (values) => {
        if (files.length === 0) {
            return notifications.show({ title: 'Atenção', message: 'Anexe pelo menos um arquivo.', color: 'yellow' });
        }
        setConfirmModalOpen(true);
    };

    const handleConfirmUpload = async () => {
        setConfirmModalOpen(false);
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('package_id', form.values.discipline);
        formData.append('title', form.values.title);

        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            await api.post('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            notifications.show({ title: 'Enviado!', message: 'Arquivos na fila de processamento.', color: 'green', icon: <IconCheck /> });
            navigate('/dashboard');

        } catch (error) {
            notifications.show({ title: 'Erro no envio', message: error.response?.data?.error || 'Falha ao conectar.', color: 'red' });
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleFilesDrop = (acceptedFiles) => {
        // Trava Global de Quantidade (Drop)
        if (files.length + acceptedFiles.length > MAX_TOTAL_FILES) {
            return notifications.show({
                title: 'Muitos Arquivos!',
                message: `O servidor aceita no máximo ${MAX_TOTAL_FILES} arquivos por entrega. Você tentou ultrapassar o limite. Se o pacote tem muitas pastas, compacte-as em um único arquivo .ZIP!`,
                color: 'red',
                autoClose: 8000,
            });
        }

        const invalidFiles = [];
        const safePattern = /^[a-zA-Z0-9._-]+$/;

        const validFiles = acceptedFiles.filter((file) => {
            if (!safePattern.test(file.name)) {
                invalidFiles.push(file.name);
                return false;
            }
            return true;
        });

        if (invalidFiles.length > 0) {
            notifications.show({
                title: 'Nome de arquivo inválido!',
                message: (
                    <>
                        Os seguintes arquivos contêm acentos, espaços ou caracteres especiais:<br />
                        <strong>{invalidFiles.join(', ')}</strong><br /><br />
                        Por favor, renomeie-os usando apenas letras, números, underline (_) ou traço (-).
                    </>
                ),
                color: 'red',
                autoClose: 10000, 
            });
            return; 
        }

        setFiles((current) => [...current, ...validFiles]);
    };

    const selectedDiscObj = disciplinas.find(d => d.value === form.values.discipline);

    return (
        <Container size="md">
            <Title order={2} mb="xs">Nova Entrega</Title>
            <Text c="dimmed" mb="xl">Envie os Artefatos dos Projetos Integradores.</Text>

            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <form onSubmit={form.onSubmit(handlePreSubmit)}>
                    
                    <Alert icon={<IconAlertCircle size={16} />} title="Atenção ao Limite!" color="blue" mb="md" variant="light">
                        O limite máximo é de <strong>10 arquivos</strong> por pacote. Se o seu pacote possuir muitos códigos ou documentos estruturados, agrupe-os em um único arquivo <strong>.ZIP</strong> ou <strong>.RAR</strong> antes de enviar.
                    </Alert>

                    <Group grow mb="md">
                        <Select 
                            label="Disciplina Vinculada" 
                            placeholder="Busque a disciplina..." 
                            data={disciplinas}
                            required
                            searchable
                            maxDropdownHeight={400}
                            nothingFoundMessage="Nada encontrado"
                            renderOption={renderSelectOption}
                            leftSection={<IconFolder size={18} />}
                            styles={{option: {padding: '10px'}}}
                            {...form.getInputProps('discipline')}
                        />
                    </Group>
                    
                    <TextInput 
                        label="Título do Trabalho" 
                        placeholder="Ex: Apresentação Final - Slides/código fonte do projeto" 
                        required 
                        mb="md"
                        {...form.getInputProps('title')}
                    />
                    
                    <Text fw={500} size="sm" mb={5} mt="md">Repositório ou Vídeo (Opcional)</Text>
                    <Group align="flex-start">
                        <TextInput 
                            placeholder="Cole o link (GitHub, YouTube...)"
                            leftSection={<IconBrandGithub size={16} />}
                            style={{ flex: 1 }}
                            {...form.getInputProps('link')}
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addLinkAsFile(); } }}
                        />
                        <Button variant="light" onClick={addLinkAsFile} disabled={!form.values.link}>
                            Adicionar Link
                        </Button>
                    </Group>

                    <Text fw={500} size="sm" mb={5} mt="md">Arquivos do Projeto</Text>
                    
                    <Dropzone
                        onDrop={handleFilesDrop}
                        maxFiles={10}
                        maxSize={50 * 1024 * 1024} // 50MB
                        accept={[
                            MIME_TYPES.pdf, 
                            MIME_TYPES.zip, 
                            'application/x-zip-compressed',
                            'application/zip',
                            'application/vnd.rar', 
                            PPT_MIME_TYPE, 
                            'application/vnd.ms-powerpoint', 
                            ...VIDEO_MIME_TYPES 
                        ]}
                        multiple={true}
                        loading={uploading}
                        onReject={(rejections) => {
                            if (rejections.some(r => r.errors.some(e => e.code === 'too-many-files'))) {
                                notifications.show({ title: 'Limite Excedido', message: `O máximo permitido são ${MAX_TOTAL_FILES} arquivos. Compacte em ZIP!`, color: 'red' });
                            }
                        }}
                    >
                        <Group justify="center" gap="xl" style={{ minHeight: rem(120), pointerEvents: 'none' }}>
                            <Dropzone.Accept><IconUpload size="3.2rem" stroke={1.5} /></Dropzone.Accept>
                            <Dropzone.Reject><IconX size="3.2rem" stroke={1.5} /></Dropzone.Reject>
                            <Dropzone.Idle>
                                <div style={{ textAlign: 'center' }}>
                                    <IconUpload size="3.2rem" stroke={1.5} color="gray" />
                                    <Text size="xl" inline>Arraste arquivos aqui</Text>
                                    <Text size="sm" c="dimmed" mt={7}>PDF, ZIP, Slides ou Vídeos (Máx 10 Itens | 50MB por arquivo)</Text>
                                </div>
                            </Dropzone.Idle>
                        </Group>
                    </Dropzone>

                    {/* LISTA DE ARQUIVOS SELECIONADOS COM BOTÃO DE EXCLUIR */}
                    {files.length > 0 && (
                        <SimpleGrid cols={1} spacing="xs" mt="md">
                            {files.map((file, index) => (
                                <Paper key={index} withBorder p="xs" bg="gray.0">
                                    <Group justify="space-between">
                                        <Group>
                                            {file.type.includes('pdf') ? <IconFileTypePdf color="red" /> : <IconFileZip color="orange" />}
                                            <div>
                                                <Text size="sm" fw={500}>{file.name}</Text>
                                                <Text size="xs" c="dimmed">{(file.size/1024/1024).toFixed(2)} MB</Text>
                                            </div>
                                        </Group>
                                        <ActionIcon 
                                            color="red" 
                                            variant="subtle" 
                                            onClick={() => removeFile(index)}
                                            title="Remover arquivo"
                                        >
                                            <IconTrash size="1.2rem" />
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    )}

                    {uploading && (
                        <Progress value={progress} label={`${progress}%`} size="xl" radius="xl" mt="md" animated striped color="blue" />
                    )}

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={() => navigate('/dashboard')} disabled={uploading}>
                            Cancelar
                        </Button>
                        <Button type="submit" color="fatecRed" loading={uploading} leftSection={<IconCheck size={18}/>}>
                            Conferir e Enviar
                        </Button>
                    </Group>
                </form>
            </Paper>

            <Modal opened={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirmação de Envio" centered>
                <Text size="sm" c="dimmed" mb="md">Confira os dados antes de criar a pasta no servidor.</Text>

                <Paper withBorder p="md" bg="gray.0" radius="md">
                    <Group mb="xs" justify="space-between">
                        <Text fw={700} size="sm">Disciplina:</Text>
                        <Badge size="lg" color={getDisciplineColor(selectedDiscObj?.semester_id)}>
                            {selectedDiscObj?.semester_label}
                        </Badge>
                    </Group>
                    <Text size="md" mb="md">{selectedDiscObj?.label}</Text>
                    
                    <Divider my="sm" />

                    <Text fw={700} size="sm">Nome do Pacote (Pasta):</Text>
                    <Text size="md" c="blue.7" fw={600} mb="md">{form.values.title}</Text>

                    <Text fw={700} size="sm">Conteúdo:</Text>
                    <Text size="sm">{files.length} arquivo(s) selecionado(s)</Text>
                </Paper>

                <Group justify="flex-end" mt="xl">
                    <Button variant="subtle" onClick={() => setConfirmModalOpen(false)}>Voltar</Button>
                    <Button color="green" onClick={handleConfirmUpload}>Confirmar Envio</Button>
                </Group>
            </Modal>
        </Container>
    );
}