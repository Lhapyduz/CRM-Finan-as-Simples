import { useEffect } from 'react';
import Routes from './routes';
import './App.css';

function App() {
  // Verificar preferência de tema escuro do usuário
  useEffect(() => {
    // Verificar se o usuário prefere tema escuro
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aplicar tema escuro se preferido
    if (prefersDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <Routes />
}

export default App
