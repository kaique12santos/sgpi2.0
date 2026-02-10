import React, { useContext } from 'react';
import { 
    AppShell, 
    Burger, 
    Group, 
    Title, 
    Avatar,
    Image, 
    Text, 
    Menu, 
    UnstyledButton 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { 
    IconLogout, 
    IconSettings, 
    IconUpload, 
    IconFiles, 
    IconDashboard, 
    IconChevronDown,
    IconFolder,
    IconFileText,
    IconAlertTriangle
} from '@tabler/icons-react';
import { AuthContext } from '../context/AuthContext';


import logoCps from '../../src/assets/img/logo-cps.png';
import logoFatec from '../../src/assets/img/logo-fatec-br.png';

export default function MainLayout() {
    const [opened, { toggle }] = useDisclosure(); // Controle do menu mobile
    const { user, signOut } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Definição dos itens do menu baseados no cargo
    // Você pode adicionar mais ícones/rotas aqui facilmente
    const menuItems = user?.role === 'coordenador' 
        ? [
            { label: 'Painel Geral', icon: IconDashboard, path: '/dashboard' },
            // Aqui troquei IconFiles por IconFolder (exemplo)
            { label: 'Gerenciar Entregas', icon: IconFolder, path: '/dashboard/entregas' }, 
            { label: 'Meu Perfil', icon: IconSettings, path: '/dashboard/perfil' },
          ]
        : [
            // Aqui troquei IconFiles por IconFileText (exemplo)
            { label: 'Meus Envios', icon: IconFileText, path: '/dashboard/meus-envios' },
            { label: 'Novo Envio', icon: IconUpload, path: '/dashboard/novo-envio' },
            { label: 'Meu Perfil', icon: IconSettings, path: '/dashboard/perfil' },
          ];

    return (
        <AppShell
            header={{ height: 90 }}
            navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            {/* --- HEADER (Topo Vermelho) --- */}
            <AppShell.Header bg="#970000" withBorder={false} style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                <Group h="100%" px="xl" justify="space-between">
                    
                    {/* LADO ESQUERDO: Burger + Logo CPS + SGPI */}
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
                        
                        {/* Logo CPS */}
                        <Image src={logoCps} h={85} w="auto" fit="contain" fallbackSrc="https://placehold.co/50x40/red/white?text=CPS" />
                        
                        {/* Divisória Vertical Sutil */}
                        <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        
                        <Text c="white" size="xl" fw={700} style={{ letterSpacing: '1px' }}>
                            SGPI
                        </Text>
                    </Group>

                    {/* LADO DIREITO: Logo Fatec + Perfil */}
                    <Group gap="xl">
                        {/* Logo Fatec (Visível apenas em desktop) */}
                        <Image visibleFrom="sm" src={logoFatec} h={60} w="auto" fit="contain" fallbackSrc="https://placehold.co/80x40/red/white?text=Fatec" />
                        
                        {/* Menu de Usuário com Foto Redonda */}
                        <Menu shadow="md" width={200} position="bottom-end">
                            <Menu.Target>
                                <UnstyledButton>
                                    <Group gap={10}>
                                        <div style={{ textAlign: 'right' }} className="mantine-visible-from-sm">
                                            {/* Nome some no mobile */}
                                            <Text size="sm" fw={700} c="white" style={{ lineHeight: 1 }}>
                                                {user?.name?.split(' ')[0]} {/* Primeiro nome */}
                                            </Text>
                                            <Text c="white" size="xs" opacity={0.8}>
                                                {user?.role === 'coordenador' ? 'Coordenação' : 'Professor'}
                                            </Text>
                                        </div>
                                        <Avatar 
                                            src={null} 
                                            radius="xl" 
                                            size="md"
                                            style={{ border: '2px solid rgba(255,255,255,0.5)' }}
                                        >
                                            {user?.name?.charAt(0)}
                                        </Avatar>
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>Minha Conta</Menu.Label>
                                <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => navigate('/dashboard/perfil')}>
                                    Meus Dados
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={signOut}>
                                    Sair
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* --- NAVBAR (Menu Lateral Branco) --- */}
            <AppShell.Navbar p="md" style={{ borderRight: '1px solid #eee' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <UnstyledButton
                                key={item.label}
                                onClick={() => { navigate(item.path); toggle(); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '0 8px 8px 0', // Arredondado só na direita
                                    backgroundColor: isActive ? '#fff5f5' : 'transparent', // Fundo vermelho bem claro se ativo
                                    color: isActive ? '#970000' : '#495057',
                                    fontWeight: isActive ? 600 : 400,
                                    borderLeft: isActive ? '4px solid #970000' : '4px solid transparent', // Borda vermelha na esquerda
                                    transition: 'all 0.2s'
                                }}
                            >
                                <item.icon size="1.2rem" stroke={1.5} />
                                <Text size="sm" ml="md">{item.label}</Text>
                            </UnstyledButton>
                        );
                    })}
                </div>
            </AppShell.Navbar>

            {/* --- CONTEÚDO --- */}
            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}