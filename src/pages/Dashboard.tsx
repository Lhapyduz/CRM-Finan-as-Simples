import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, BanknotesIcon, WalletIcon } from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { transactionService, Transaction } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  // Estado para armazenar as transações
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar transações ao carregar o componente
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Função para buscar transações da API
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      toast.error('Não foi possível carregar os dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular totais
  const totalIncome = transactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = transactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const balance = totalIncome - totalExpense;

  // Dados para o gráfico de categorias de despesas
  const expenseCategories = transactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((categories, transaction) => {
      const category = transaction.category;
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += transaction.amount;
      return categories;
    }, {} as Record<string, number>);

  const doughnutData = {
    labels: Object.keys(expenseCategories),
    datasets: [
      {
        data: Object.values(expenseCategories),
        backgroundColor: [
          '#0ea5e9', // primary-500
          '#8b5cf6', // secondary-500
          '#f97316', // orange-500
          '#10b981', // emerald-500
          '#ef4444', // red-500
          '#f59e0b', // amber-500
        ],
        borderWidth: 1,
      },
    ],
  };

  // Dados para o gráfico de receitas vs despesas por dia
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().slice(0, 10);
  }).reverse();

  const dailyData = last7Days.map(date => {
    const dayIncome = transactions
      .filter(t => t.type === 'income' && t.date === date)
      .reduce((sum, t) => sum + t.amount, 0);

    const dayExpense = transactions
      .filter(t => t.type === 'expense' && t.date === date)
      .reduce((sum, t) => sum + t.amount, 0);

    return { date, income: dayIncome, expense: dayExpense };
  });

  const barData = {
    labels: dailyData.map(d => new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Receitas',
        data: dailyData.map(d => d.income),
        backgroundColor: '#0ea5e9', // primary-500
      },
      {
        label: 'Despesas',
        data: dailyData.map(d => d.expense),
        backgroundColor: '#ef4444', // red-500
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Receitas vs Despesas (Últimos 7 dias)',
      },
    },
  };

  return (
    <div className="animate-slide-in">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Carregando dados do dashboard...</p>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-white dark:bg-gray-800 flex items-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
                <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receitas</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">R$ {totalIncome.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="card bg-white dark:bg-gray-800 flex items-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
                <ArrowDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Despesas</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">R$ {totalExpense.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="card bg-white dark:bg-gray-800 flex items-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
                <WalletIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo</p>
                <p className={`text-xl font-semibold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  R$ {balance.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="card bg-white dark:bg-gray-800 flex items-center">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
                <ArrowUpIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Economia</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {totalIncome > 0 ? `${Math.round((balance / totalIncome) * 100)}%` : '0%'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Despesas por Categoria</h2>
              <div className="h-64">
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            
            <div className="card bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receitas vs Despesas</h2>
              <div className="h-64">
                <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
          
          {/* Transações recentes */}
          <div className="card bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transações Recentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Descrição</th>
                    <th scope="col" className="px-6 py-3">Categoria</th>
                    <th scope="col" className="px-6 py-3">Data</th>
                    <th scope="col" className="px-6 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4">{transaction.category}</td>
                      <td className="px-6 py-4">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`px-6 py-4 text-right ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}