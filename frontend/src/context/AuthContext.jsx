import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { notifications } from '@mantine/notifications';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Loading inicial para verificar se já existia token salvo ao abrir o site
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        // Ao abrir o site, verifica se tem token salvo
        const recoveredUser = localStorage.getItem('sgpi_user');
        const token = localStorage.getItem('sgpi_token');

        if (recoveredUser && token) {
            setUser(JSON.parse(recoveredUser));
            api.defaults.headers.Authorization = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    async function signIn({ email, password }) {
        try {
            const response = await api.post('/auth/login', { email, password });

            const { token, user: userData } = response.data;

            // Salva no LocalStorage (Persistência)
            localStorage.setItem('sgpi_user', JSON.stringify(userData));
            localStorage.setItem('sgpi_token', token);

            // Atualiza o Axios para futuras requisições
            api.defaults.headers.Authorization = `Bearer ${token}`;

            // Atualiza o estado global
            setUser(userData);

            return true; // Sucesso

        } catch (error) {
            console.error("Erro no login:", error);
            
            // Tratamento de erros específicos (ex: Conta não verificada)
            const message = error.response?.data?.error || 'Erro ao conectar com o servidor.';
            
            notifications.show({
                title: 'Falha no Login',
                message: message,
                color: 'red',
                autoClose: 5000,
            });
            return false;
        }
    }

    function signOut() {
        localStorage.clear();
        setUser(null);
        api.defaults.headers.Authorization = undefined;
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};