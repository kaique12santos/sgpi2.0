import React, { useEffect, useState } from 'react';
import { 
    Container, Paper, Title, Text, Avatar, TextInput, Select, Button, Group, 
    rem, Progress, Badge, Alert, Divider, Modal, SimpleGrid, ThemeIcon
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { 
    IconBrandYoutube, IconBrandGithub, IconPresentation, IconMovie,IconUpload, IconX, IconFileTypePdf, IconFileZip, IconFileText, 
    IconCheck, IconAlertCircle, IconFolder 
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
// Importação do seu utilitário
import { getDisciplineColor } from '../../utils/CoresAuxiliares';


const PPT_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
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

    // 1. Carregar Disciplinas e formatar para o Select
    useEffect(() => {
        async function fetchFolders() {
            try {
                // 1. Verifique se sua rota no backend é '/disciplines' ou '/metadata/disciplines'
                const response = await api.get('/metadata/disciplines'); 
                
                // O backend retorna: { success: true, disciplines: [...] }
                const listaVindaDoBanco = response.data.disciplines || [];

                // 2. Mapeamento Direto (A tabela disciplines já é única, não precisa de Set/Filter)
                const formatted = listaVindaDoBanco.map(disc => ({
                    value: String(disc.id),           // ID da disciplina
                    label: disc.name,                 // Nome
                    semester_id: disc.course_level,   // Nível (para a cor)
                    semester_label: `${disc.course_level}º Sem` // Texto da Badge
                }));

                // 3. Ordenação (Opcional, pois o SQL já ordena, mas garante segurança)
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

    // Função Auxiliar: Cria um arquivo .html que redireciona para o link
    const addLinkAsFile = () => {
        const link = form.values.link;
        
        // 1. Validação simples
        if (!link) return;
        if (!link.startsWith('http')) {
            return form.setFieldError('link', 'O link deve começar com http:// ou https://');
        }

        // 2. Cria o conteúdo do arquivo (Um HTML simples de redirecionamento)
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

        // 3. Transforma em um objeto File (Blob)
        const blob = new Blob([fileContent], { type: 'text/html' });
        
        // Gera um nome de arquivo amigável (ex: github_projeto.html)
        // Pega o domínio ou o final da URL para usar de nome
        let fileName = 'link_externo.html';
        try {
            const urlObj = new URL(link);
            const domain = urlObj.hostname.replace('www.', '').split('.')[0]; // ex: github
            fileName = `link_${domain}_${Date.now()}.html`;
        } catch (e) { /* fallback */ }

        const file = new File([blob], fileName, { type: 'text/html' });

        // 4. Adiciona na fila de arquivos (mesmo estado do Dropzone!)
        setFiles((current) => [...current, file]);

        // 5. Limpa o campo e avisa
        form.setFieldValue('link', '');
        notifications.show({ title: 'Link Adicionado', message: 'O link foi convertido em arquivo e está na fila.', color: 'blue' });
    };
    // 2. Renderizador Customizado do Select (Com Cores)
    const renderSelectOption = ({ option }) => (
        <Group flex="1" gap="md" wrap="nowrap">
            {/* O "Avatar" funciona como um ícone numérico sólido */}
            <Avatar 
                color={getDisciplineColor(option.semester_id)} 
                radius="xl" 
                size="md"
                variant="filled" // Fundo Sólido = Alto Contraste
            >
                {/* Mostra apenas o número (Ex: "3") para ficar grande e legível */}
                {option.semester_id}º
            </Avatar>
            
            <div style={{ flex: 1 }}>
                <Text size="sm" fw={500} style={{ lineHeight: 1.2 }}>
                    {option.label}
                </Text>
                {/* Legenda pequena para ajudar na confirmação */}
                <Text size="xs" c="dimmed">
                    {option.semester_id}º Semestre
                </Text>
            </div>
        </Group>
    );

    // 3. Handler do Botão "Conferir e Enviar" (Abre Modal)
    const handlePreSubmit = (values) => {
        if (files.length === 0) {
            return notifications.show({ title: 'Atenção', message: 'Anexe pelo menos um arquivo.', color: 'yellow' });
        }
        // Se validou o form e tem arquivo, abre o modal
        setConfirmModalOpen(true);
    };

    // 4. Envio Real (Disparado pelo Modal)
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

            notifications.show({ 
                title: 'Enviado!', 
                message: 'Arquivos na fila de processamento.', 
                color: 'green',
                icon: <IconCheck />
            });
            
            navigate('/dashboard');

        } catch (error) {
            notifications.show({ 
                title: 'Erro no envio', 
                message: error.response?.data?.error || 'Falha ao conectar.', 
                color: 'red' 
            });
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    // Encontrar o objeto da disciplina selecionada para mostrar no Modal
    const selectedDiscObj = disciplinas.find(d => d.value === form.values.discipline);

    return (
        <Container size="md">
            <Title order={2} mb="xs">Nova Entrega</Title>
            <Text c="dimmed" mb="xl">Envie a documentação ou código fonte do seu Projeto Integrador.</Text>

            <Paper shadow="sm" p="xl" radius="md" withBorder>
                {/* O form chama o PreSubmit (Modal), não o upload direto */}
                <form onSubmit={form.onSubmit(handlePreSubmit)}>
                    
                    <Alert icon={<IconAlertCircle size={16} />} title="Dica" color="blue" mb="md" variant="light">
                        Agrupe os arquivos da turma (PDFs e ZIPs) em um único envio.
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
                            renderOption={renderSelectOption} // <--- APLICA O VISUAL COLORIDO
                            leftSection={<IconFolder size={18} />}
                            styles={{option: {padding: '10px'}}}
                            {...form.getInputProps('discipline')}
                        />
                    </Group>
                    
                    <TextInput 
                        label="Título do Trabalho" 
                        placeholder="Ex: Documentação Sprint 1 - Grupo Alpha" 
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
                            // Permite adicionar com Enter
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addLinkAsFile(); } }}
                        />
                        <Button 
                            variant="light" 
                            onClick={addLinkAsFile}
                            disabled={!form.values.link}
                        >
                            Adicionar Link
                        </Button>
                    </Group>

                    <Text fw={500} size="sm" mb={5}>Arquivos do Projeto</Text>
                    
                    {/* DROPZONE CORRIGIDO */}
                    <Dropzone
                        onDrop={setFiles}
                        maxFiles={10}
                        maxSize={50 * 1024 * 1024} // 50MB
                        accept={[
                            MIME_TYPES.pdf, 
                            MIME_TYPES.zip, 
                            'application/x-zip-compressed',
                            'application/zip',
                            'application/vnd.rar', // RAR
                            PPT_MIME_TYPE, // Slides (.pptx)
                            'application/vnd.ms-powerpoint', // Slides antigos (.ppt)
                            ...VIDEO_MIME_TYPES // Vídeos
                        ]}
                        multiple={true}
                        loading={uploading}
                        onReject={(rejections) => {
                            if (rejections.some(r => r.errors.some(e => e.code === 'too-many-files'))) {
                                notifications.show({ title: 'Limite', message: 'Máximo de 10 arquivos.', color: 'red' });
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
                                    <Text size="sm" c="dimmed" mt={7}>PDF, ZIP, Slides ou Vídeos (Máx 100MB)</Text>
                                </div>
                            </Dropzone.Idle>
                        </Group>
                    </Dropzone>

                    {/* LISTA DE ARQUIVOS SELECIONADOS */}
                    {files.length > 0 && (
                        <SimpleGrid cols={1} spacing="xs" mt="md">
                            {files.map((file, index) => (
                                <Paper key={index} withBorder p="xs" bg="gray.0">
                                    <Group>
                                        {file.type.includes('pdf') ? <IconFileTypePdf color="red" /> : <IconFileZip color="orange" />}
                                        <div style={{ flex: 1 }}>
                                            <Text size="sm" fw={500}>{file.name}</Text>
                                            <Text size="xs" c="dimmed">{(file.size/1024/1024).toFixed(2)} MB</Text>
                                        </div>
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
                        <Button type="submit" color="blue" loading={uploading} leftSection={<IconCheck size={18}/>}>
                            Conferir e Enviar
                        </Button>
                    </Group>
                </form>
            </Paper>

            {/* MODAL DE CONFIRMAÇÃO */}
            <Modal 
                opened={confirmModalOpen} 
                onClose={() => setConfirmModalOpen(false)} 
                title="Confirmação de Envio"
                centered
            >
                <Text size="sm" c="dimmed" mb="md">
                    Confira os dados antes de criar a pasta no servidor.
                </Text>

                <Paper withBorder p="md" bg="gray.0" radius="md">
                    <Group mb="xs" justify="space-between">
                        <Text fw={700} size="sm">Disciplina:</Text>
                        <Badge 
                            size="lg" 
                            color={getDisciplineColor(selectedDiscObj?.semester_id)}
                        >
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
                    <Button color="green" onClick={handleConfirmUpload}>
                        Confirmar Envio
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}