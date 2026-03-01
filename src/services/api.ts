import { supabase } from './supabaseClient';

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
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Criar uma nova transação
  create: async (transaction: TransactionFormData): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar uma transação existente
  update: async (id: number, transaction: TransactionFormData): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Excluir uma transação
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Serviços para Orçamentos
export const budgetService = {
  // Buscar todos os orçamentos
  getAll: async (): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('period', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Criar um novo orçamento
  create: async (budget: BudgetFormData): Promise<Budget> => {
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar um orçamento existente
  update: async (id: number, budget: BudgetFormData): Promise<Budget> => {
    const { data, error } = await supabase
      .from('budgets')
      .update(budget)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Excluir um orçamento
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Obter comparação entre orçamento e gastos reais
  getBudgetComparison: async (period: string): Promise<Budget[]> => {
    // Busca os orçamentos do período
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('period', period);

    if (budgetsError) throw budgetsError;
    if (!budgets) return [];

    // Para cada orçamento, calcular o gasto na mesma consulta ou separado
    const result = await Promise.all(
      budgets.map(async (budget) => {
        const { data: expenses, error: expensesError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'expense')
          .eq('category', budget.category)
          .like('date', `${period}%`);

        if (expensesError) throw expensesError;

        const spent = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        return {
          ...budget,
          spent
        };
      })
    );

    return result;
  },
};

// Serviços para Relatórios
export const reportService = {
  // Obter despesas por categoria
  getExpensesByCategory: async (period?: string): Promise<{ category: string, total: number }[]> => {
    let query = supabase
      .from('transactions')
      .select('category, amount')
      .eq('type', 'expense');

    if (period) {
      query = query.like('date', `${period}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Processamento no JS pois o Supabase REST limita group_by
    const expensesMap = data?.reduce((acc: Record<string, number>, curr) => {
      const cat = curr.category;
      acc[cat] = (acc[cat] || 0) + Number(curr.amount);
      return acc;
    }, {});

    const result = Object.keys(expensesMap || {}).map(key => ({
      category: key,
      total: expensesMap[key]
    })).sort((a, b) => b.total - a.total);

    return result;
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
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .order('dueDate', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Criar um novo gasto recorrente
  create: async (expense: RecurringExpenseFormData): Promise<RecurringExpense> => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert([{
        ...expense,
        isPaid: expense.isPaid ? true : false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar um gasto recorrente existente
  update: async (id: number, expense: RecurringExpenseFormData): Promise<RecurringExpense> => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .update({
        ...expense,
        isPaid: expense.isPaid ? true : false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Excluir um gasto recorrente
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
