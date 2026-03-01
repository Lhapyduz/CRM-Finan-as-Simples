import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Tipos
export type Transaction = {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

export type Budget = {
  id: number;
  category: string;
  amount: number;
  period: string;
  spent?: number; // Opcional, usado apenas em relatórios
};

export type BudgetFormData = Omit<Budget, 'id' | 'spent'>;
export type TransactionFormData = Omit<Transaction, 'id'>;

// Serviços para Transações
export const transactionService = {
  // Buscar todas as transações
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions');
    return response.data;
  },

  // Criar uma nova transação
  create: async (transaction: TransactionFormData): Promise<Transaction> => {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },

  // Atualizar uma transação existente
  update: async (id: number, transaction: TransactionFormData): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  },

  // Excluir uma transação
  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

// Serviços para Orçamentos
export const budgetService = {
  // Buscar todos os orçamentos
  getAll: async (): Promise<Budget[]> => {
    const response = await api.get('/budgets');
    return response.data;
  },

  // Criar um novo orçamento
  create: async (budget: BudgetFormData): Promise<Budget> => {
    const response = await api.post('/budgets', budget);
    return response.data;
  },

  // Atualizar um orçamento existente
  update: async (id: number, budget: BudgetFormData): Promise<Budget> => {
    const response = await api.put(`/budgets/${id}`, budget);
    return response.data;
  },

  // Excluir um orçamento
  delete: async (id: number): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },

  // Obter comparação entre orçamento e gastos reais
  getBudgetComparison: async (period: string): Promise<Budget[]> => {
    const response = await api.get('/reports/budget-comparison', {
      params: { period },
    });
    return response.data;
  },
};

// Serviços para Relatórios
export const reportService = {
  // Obter despesas por categoria
  getExpensesByCategory: async (period?: string): Promise<{category: string, total: number}[]> => {
    const response = await api.get('/reports/expenses-by-category', {
      params: { period },
    });
    return response.data;
  },
};

// Serviços para Gastos Recorrentes
export type RecurringExpense = {
  id: number;
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  isPaid: boolean;
};

export type RecurringExpenseFormData = Omit<RecurringExpense, 'id'>;

export const recurringExpenseService = {
  // Buscar todos os gastos recorrentes
  getAll: async (): Promise<RecurringExpense[]> => {
    const response = await api.get('/recurring-expenses');
    return response.data;
  },

  // Criar um novo gasto recorrente
  create: async (expense: RecurringExpenseFormData): Promise<RecurringExpense> => {
    // Garantir que isPaid seja enviado como número para o backend
    const formattedExpense = {
      ...expense,
      isPaid: expense.isPaid ? 1 : 0
    };
    console.log('Enviando para API:', formattedExpense);
    const response = await api.post('/recurring-expenses', formattedExpense);
    return response.data;
  },

  // Atualizar um gasto recorrente existente
  update: async (id: number, expense: RecurringExpenseFormData): Promise<RecurringExpense> => {
    // Garantir que isPaid seja enviado como número para o backend
    const formattedExpense = {
      ...expense,
      isPaid: expense.isPaid ? 1 : 0
    };
    console.log('Atualizando na API:', formattedExpense);
    const response = await api.put(`/recurring-expenses/${id}`, formattedExpense);
    return response.data;
  },

  // Excluir um gasto recorrente
  delete: async (id: number): Promise<void> => {
    await api.delete(`/recurring-expenses/${id}`);
  },
};

export default api;