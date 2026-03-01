import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório do banco de dados
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Configuração do banco de dados SQLite
const dbPath = path.join(dbDir, 'finance.db');

// Inicialização do banco de dados
async function initializeDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Criar tabelas se não existirem
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      isPaid INTEGER NOT NULL DEFAULT 0
    );
  `);

  return db;
}

// Inicializar o banco de dados e configurar rotas
initializeDatabase().then(db => {
  // Rotas para transações
  app.get('/api/transactions', async (req, res) => {
    try {
      const transactions = await db.all('SELECT * FROM transactions ORDER BY date DESC');
      res.json(transactions);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      const { description, amount, type, category, date } = req.body;
      
      const result = await db.run(
        'INSERT INTO transactions (description, amount, type, category, date) VALUES (?, ?, ?, ?, ?)',
        [description, amount, type, category, date]
      );
      
      const newTransaction = {
        id: result.lastID,
        description,
        amount,
        type,
        category,
        date
      };
      
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      res.status(500).json({ error: 'Erro ao criar transação' });
    }
  });

  app.put('/api/transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { description, amount, type, category, date } = req.body;
      
      await db.run(
        'UPDATE transactions SET description = ?, amount = ?, type = ?, category = ?, date = ? WHERE id = ?',
        [description, amount, type, category, date, id]
      );
      
      const updatedTransaction = await db.get('SELECT * FROM transactions WHERE id = ?', id);
      
      if (updatedTransaction) {
        res.json(updatedTransaction);
      } else {
        res.status(404).json({ error: 'Transação não encontrada' });
      }
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
  });

  app.delete('/api/transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.run('DELETE FROM transactions WHERE id = ?', id);
      
      res.json({ message: 'Transação excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      res.status(500).json({ error: 'Erro ao excluir transação' });
    }
  });

  // Rotas para orçamentos
  app.get('/api/budgets', async (req, res) => {
    try {
      const budgets = await db.all('SELECT * FROM budgets ORDER BY period DESC');
      res.json(budgets);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
  });

  app.post('/api/budgets', async (req, res) => {
    try {
      const { category, amount, period } = req.body;
      
      const result = await db.run(
        'INSERT INTO budgets (category, amount, period) VALUES (?, ?, ?)',
        [category, amount, period]
      );
      
      const newBudget = {
        id: result.lastID,
        category,
        amount,
        period
      };
      
      res.status(201).json(newBudget);
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
  });

  app.put('/api/budgets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { category, amount, period } = req.body;
      
      await db.run(
        'UPDATE budgets SET category = ?, amount = ?, period = ? WHERE id = ?',
        [category, amount, period, id]
      );
      
      const updatedBudget = await db.get('SELECT * FROM budgets WHERE id = ?', id);
      
      if (updatedBudget) {
        res.json(updatedBudget);
      } else {
        res.status(404).json({ error: 'Orçamento não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
  });

  app.delete('/api/budgets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.run('DELETE FROM budgets WHERE id = ?', id);
      
      res.json({ message: 'Orçamento excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      res.status(500).json({ error: 'Erro ao excluir orçamento' });
    }
  });

  // Rotas para gastos recorrentes
  app.get('/api/recurring-expenses', async (req, res) => {
    try {
      const expenses = await db.all('SELECT * FROM recurring_expenses ORDER BY dueDate ASC');
      res.json(expenses);
    } catch (error) {
      console.error('Erro ao buscar gastos recorrentes:', error);
      res.status(500).json({ error: 'Erro ao buscar gastos recorrentes' });
    }
  });

  app.post('/api/recurring-expenses', async (req, res) => {
    try {
      const { description, amount, category, dueDate, isPaid } = req.body;
      
      const result = await db.run(
        'INSERT INTO recurring_expenses (description, amount, category, dueDate, isPaid) VALUES (?, ?, ?, ?, ?)',
        [description, amount, category, dueDate, isPaid ? 1 : 0]
      );
      
      const newExpense = {
        id: result.lastID,
        description,
        amount,
        category,
        dueDate,
        isPaid
      };
      
      res.status(201).json(newExpense);
    } catch (error) {
      console.error('Erro ao criar gasto recorrente:', error);
      res.status(500).json({ error: 'Erro ao criar gasto recorrente' });
    }
  });

  app.put('/api/recurring-expenses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { description, amount, category, dueDate, isPaid } = req.body;
      
      await db.run(
        'UPDATE recurring_expenses SET description = ?, amount = ?, category = ?, dueDate = ?, isPaid = ? WHERE id = ?',
        [description, amount, category, dueDate, isPaid ? 1 : 0, id]
      );
      
      const updatedExpense = await db.get('SELECT * FROM recurring_expenses WHERE id = ?', id);
      
      if (updatedExpense) {
        res.json(updatedExpense);
      } else {
        res.status(404).json({ error: 'Gasto recorrente não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao atualizar gasto recorrente:', error);
      res.status(500).json({ error: 'Erro ao atualizar gasto recorrente' });
    }
  });

  app.delete('/api/recurring-expenses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.run('DELETE FROM recurring_expenses WHERE id = ?', id);
      
      res.json({ message: 'Gasto recorrente excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir gasto recorrente:', error);
      res.status(500).json({ error: 'Erro ao excluir gasto recorrente' });
    }
  });

  // Rota para obter gastos por categoria em um período específico
  app.get('/api/reports/expenses-by-category', async (req, res) => {
    try {
      const { period } = req.query;
      
      let query = `
        SELECT category, SUM(amount) as total 
        FROM transactions 
        WHERE type = 'expense'
      `;
      
      const params = [];
      
      if (period) {
        query += ` AND date LIKE ?`;
        params.push(`${period}%`);
      }
      
      query += ` GROUP BY category ORDER BY total DESC`;
      
      const expenses = await db.all(query, params);
      res.json(expenses);
    } catch (error) {
      console.error('Erro ao buscar despesas por categoria:', error);
      res.status(500).json({ error: 'Erro ao buscar despesas por categoria' });
    }
  });

  // Rota para obter comparação entre orçamento e gastos reais
  app.get('/api/reports/budget-comparison', async (req, res) => {
    try {
      const { period } = req.query;
      
      if (!period) {
        return res.status(400).json({ error: 'Período é obrigatório' });
      }
      
      // Buscar todos os orçamentos do período
      const budgets = await db.all('SELECT * FROM budgets WHERE period = ?', period);
      
      // Para cada orçamento, calcular o gasto real
      const result = await Promise.all(budgets.map(async (budget) => {
        const expenses = await db.get(
          `SELECT SUM(amount) as spent FROM transactions 
           WHERE type = 'expense' AND category = ? AND date LIKE ?`,
          [budget.category, `${period}%`]
        );
        
        return {
          ...budget,
          spent: expenses?.spent || 0
        };
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar comparação de orçamento:', error);
      res.status(500).json({ error: 'Erro ao buscar comparação de orçamento' });
    }
  });

  // Iniciar o servidor
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao inicializar o banco de dados:', err);
});