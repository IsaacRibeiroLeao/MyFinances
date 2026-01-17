import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
