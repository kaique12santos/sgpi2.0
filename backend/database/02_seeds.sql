SET NAMES 'utf8mb4';
-- Inserir o valor inicial de mensagem
INSERT INTO system_messages (id, content, type, is_active) 
VALUES (1, 'Bem-vindo ao SGPI. Verifique o calendário acadêmico para as próximas entregas.', 'info', true);

-- Semestre Inicial
INSERT INTO semesters (label, is_active) VALUES ('2025_1', 1);

-- Disciplinas do 1º ao 6º Semestre
INSERT INTO disciplines (name, slug, course_level) VALUES 
('Desenvolvimento Web I', 'web1', 1),
('Design Digital', 'design', 1),
('Engenharia de Software I', 'eng_soft1', 1),
('Engenharia de Software II', 'eng_soft2', 2),
('Desenvolvimento Web II', 'web2', 2),
('Banco de Dados Relacional', 'bd_relacional', 2),
('Gestão Ágil de Projetos de Software', 'gestao_projeos', 3),
('Desenvolvimento Web II', 'web3', 3),
('Banco de Dados Não Relacional', 'bd_nao_relacional', 3),
('Interação Humano Computador','ihc',3),
('Laboratório de Desenvolvimento Web', 'lab_dev_web', 4),
('Experiência do Usuário', 'exp_usuario', 4),
('Laboratório de Desenvolvimento para Dispositivos Móveis','lab_dev_mobile',5),
('Programação para dispositivos móveis II','pro_mobile',5),
('Laboratório de Desenvolvimento','lab_dev_mult',6),
('Qualidade e Testes de Software','qualidade_testes',6);