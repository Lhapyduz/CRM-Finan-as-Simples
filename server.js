import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import './src/server/index.js';

// Configuração para servir o frontend em produção
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

console.log(`Servidor de desenvolvimento rodando em http://localhost:${PORT}`);
console.log('API rodando em http://localhost:3001/api');
