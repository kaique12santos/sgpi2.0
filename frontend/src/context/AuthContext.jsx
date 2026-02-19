import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { notifications } from '@mantine/notifications';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
   
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        
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

            localStorage.setItem('sgpi_user', JSON.stringify(userData));
            localStorage.setItem('sgpi_token', token);

            api.defaults.headers.Authorization = `Bearer ${token}`;

            setUser(userData);

            return true; 

        } catch (error) {
            console.error("Erro no login:", error);
            
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