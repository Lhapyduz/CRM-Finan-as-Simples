import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import RecurringExpenses from './pages/RecurringExpenses';

// Definição das rotas da aplicação
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: '/transactions',
    element: <Layout><Transactions /></Layout>,
  },
  {
    path: '/budgets',
    element: <Layout><Budgets /></Layout>,
  },
  {
    path: '/reports',
    element: <Layout><Reports /></Layout>,
  },
  {
    path: '/settings',
    element: <Layout><Settings /></Layout>,
  },
  {
    path: '/recurring-expenses',
    element: <Layout><RecurringExpenses /></Layout>,
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}