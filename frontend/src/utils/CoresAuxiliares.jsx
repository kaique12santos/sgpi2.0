// utils/CoresAuxiliares.js

export const getDisciplineColor = (semesterId) => {
    // Mapa fixo para garantir consistência
    const colorMap = {
        1: 'indigo',  // Azul Escuro (Sério/Início)
        2: 'blue',    // Azul Claro
        3: 'cyan',    // Ciano
        4: 'teal',    // Verde Água (Meio curso)
        5: 'orange',  // Laranja (Reta final)
        6: 'red',     // Vermelho (TCC/Fim)
    };

    // Fallback para cinza se não achar
    return colorMap[semesterId] || 'gray';
};