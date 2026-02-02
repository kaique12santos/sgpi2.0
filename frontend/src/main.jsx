import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import {theme} from './theme/index.js'
import './index.css'

import App from './App.jsx'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
        <Notifications position='top-right'/>
    <App />
    </MantineProvider>
  </StrictMode>,
)
