import { Button, Container, Title, Text, Group, Paper } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';

function App() {
  return (
    <Container size="xs" mt="xl">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Title order={2} ta="center" mb="lg" c="blue">
          SGPI 2.0
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Ambiente iniciado com Mantine UI. 
          Pronto para escalar! 🚀
        </Text>

        <Group justify="center">
          <Button leftSection={<IconRocket size={18} />} variant="filled" color="blue">
            Login do Sistema
          </Button>
          <Button variant="light" color="red">
            Documentação
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default App;