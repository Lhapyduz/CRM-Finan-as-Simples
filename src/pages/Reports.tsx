import { useState, useEffect } from 'react';
import { transactionService, Transaction } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

type ReportPeriod = 'week' | 'month' | 'year';

export default function Reports() {
  // Estado para armazenar o período do relatório
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados ao carregar o componente ou quando o período mudar
  useEffect(() => {
    fetchReportData();
  }, [period]);

  // Função para buscar dados de relatórios
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Buscar todas as transações
      const transactionsData = await transactionService.getAll();
      setTransactions(transactionsData);

      // Buscar despesas por categoria
      // const expensesData = await reportService.getExpensesByCategory(period);
      // setExpensesByCategory(expensesData);
    } catch (error) {
      console.error('Erro ao buscar dados de relatórios:', error);
      toast.error('Não foi possível carregar os dados dos relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para filtrar transações com base no período selecionado
  const filterTransactionsByPeriod = () => {
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= today;
    });
  };

  const filteredTransactions = filterTransactionsByPeriod();

  // Calcular totais
  const totalIncome = filteredTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = filteredTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  // Dados para o gráfico de categorias de despesas
  const expenseCategories = filteredTransactions
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

  // Dados para o gráfico de receitas vs despesas por mês
  const getMonthlyData = () => {
    const months: Record<string, { income: number; expense: number }> = {};

    // Inicializar os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[monthKey] = { income: 0, expense: 0 };
    }

    // Preencher com dados reais
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (months[monthKey]) {
        if (transaction.type === 'income') {
          months[monthKey].income += transaction.amount;
        } else {
          months[monthKey].expense += transaction.amount;
        }
      }
    });

    return months;
  };

  const monthlyData = getMonthlyData();

  const barData = {
    labels: Object.keys(monthlyData).map(month => {
      const [year, monthNum] = month.split('-');
      return `${monthNum}/${year.slice(2)}`;
    }),
    datasets: [
      {
        label: 'Receitas',
        data: Object.values(monthlyData).map(data => data.income),
        backgroundColor: '#0ea5e9', // primary-500
      },
      {
        label: 'Despesas',
        data: Object.values(monthlyData).map(data => data.expense),
        backgroundColor: '#ef4444', // red-500
      },
    ],
  };

  // Dados para o gráfico de tendência de saldo
  const balanceTrendData = {
    labels: Object.keys(monthlyData).map(month => {
      const [year, monthNum] = month.split('-');
      return `${monthNum}/${year.slice(2)}`;
    }),
    datasets: [
      {
        label: 'Saldo',
        data: Object.values(monthlyData).map(data => data.income - data.expense),
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="animate-slide-in">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Relatórios</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Carregando dados dos relatórios...</p>
        </div>
      ) : (
        <>
          <div className="inline-flex rounded-md shadow-sm mb-6">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${period === 'week' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              onClick={() => setPeriod('week')}
            >
              Semana
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${period === 'month' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              onClick={() => setPeriod('month')}
            >
              Mês
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${period === 'year' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              onClick={() => setPeriod('year')}
            >
              Ano
            </button>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-white dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Receitas</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">R$ {totalIncome.toFixed(2)}</p>
            </div>

            <div className="card bg-white dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Despesas</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">R$ {totalExpense.toFixed(2)}</p>
            </div>

            <div className="card bg-white dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Saldo</p>
              <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                R$ {balance.toFixed(2)}
              </p>
            </div>

            <div className="card bg-white dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Taxa de Economia</p>
              <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                {savingsRate.toFixed(1)}%
              </p>
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
                <Bar data={barData} options={{ ...chartOptions, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="card bg-white dark:bg-gray-800 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tendência de Saldo</h2>
            <div className="h-64">
              <Line data={balanceTrendData} options={{ ...chartOptions, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Tabela de maiores despesas */}
          <div className="card bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Maiores Despesas</h2>
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
                  {filteredTransactions
                    .filter(transaction => transaction.type === 'expense')
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((transaction) => (
                      <tr key={transaction.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4">{transaction.category}</td>
                        <td className="px-6 py-4">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">
                          R$ {transaction.amount.toFixed(2)}
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