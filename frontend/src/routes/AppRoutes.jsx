import React, { useContext } from 'react';
import { Routes, Route, Navigate, Router } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Center, Loader } from '@mantine/core';

import Login from '../pages/Auth/Login';
import MainLayout from '../layout/MainLayout';
import Dashboard from '../pages/Dashboard';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import Profile from '../pages/Profile';
import UploadPage from '../pages/Professor/UploadPage';
import MyFoldersPage from '../pages/Professor/MyFoldersPage';
import CoordenadorPainellPage from '../pages/Coordenador/Painel';
import UserManagementPage from '../pages/Coordenador/UserManagementPage';

// Componente para proteger rotas privadas
const Private = ({ children }) => {
    const { signed, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <Center h="100vh">
                <Loader color="fatecRed" type="dots" />
            </Center>
        );
    }

    if (!signed) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />

            {/* Rotas Privadas dentro do Layout */}
            <Route path="/dashboard" element={<Private><MainLayout /></Private>}>
                <Route index element={<Dashboard />} />
                {/* Futuras rotas virão aqui: */}
                <Route path="perfil" element={<Profile />} />
                <Route path="novo-envio" element={<UploadPage />} />
                <Route path="meus-envios" element={<MyFoldersPage />} />
                <Route path="entregas" element={<CoordenadorPainellPage />} />
                <Route path="usuarios" element={<UserManagementPage />} />
            </Route>

            {/* Qualquer rota desconhecida joga pro Login */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}