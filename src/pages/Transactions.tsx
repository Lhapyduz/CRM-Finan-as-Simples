import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { transactionService, Transaction, TransactionFormData } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Categorias predefinidas
const incomeCategories = ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'];
const expenseCategories = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Vestuário', 'Outros'];

export default function Transactions() {
  // Estado para armazenar as transações
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para controlar o modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Estado para filtros
  const [filter, setFilter] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    startDate: '',
    endDate: '',
    category: '',
  });

  // Configuração do formulário
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TransactionFormData>();
  const transactionType = watch('type', 'expense');

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
      toast.error('Não foi possível carregar as transações');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir o modal de criação
  const openCreateModal = () => {
    setEditingTransaction(null);
    reset({ 
      description: '', 
      amount: 0, 
      type: 'expense', 
      category: '', 
      date: new Date().toISOString().slice(0, 10) 
    });
    setIsOpen(true);
  };

  // Função para abrir o modal de edição
  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    reset({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
    });
    setIsOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setIsOpen(false);
  };

  // Função para salvar uma transação (criar ou editar)
  const onSubmit = async (data: TransactionFormData) => {
    try {
      // Garantir que os dados estejam no formato correto
      const formattedData = {
        ...data,
        amount: Number(data.amount),
        date: data.date || new Date().toISOString().slice(0, 10)
      };

      if (editingTransaction) {
        // Editar transação existente
        const updatedTransaction = await transactionService.update(editingTransaction.id, formattedData);
        if (!updatedTransaction) {
          throw new Error('Erro ao atualizar transação');
        }
        setTransactions(prevTransactions => 
          prevTransactions.map(transaction => 
            transaction.id === editingTransaction.id 
              ? updatedTransaction 
              : transaction
          )
        );
        toast.success('Transação atualizada com sucesso!');
      } else {
        // Criar nova transação
        const newTransaction = await transactionService.create(formattedData);
        if (!newTransaction) {
          throw new Error('Erro ao criar transação');
        }
        setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
        toast.success('Transação criada com sucesso!');
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro ao salvar a transação');
    }
  };

  // Função para excluir uma transação
  const deleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await transactionService.delete(id);
        setTransactions(transactions.filter(transaction => transaction.id !== id));
        toast.success('Transação excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        toast.error('Ocorreu um erro ao excluir a transação');
      }
    }
  };

  // Função para aplicar filtros
  const applyFilter = (transactions: Transaction[]) => {
    return transactions.filter(transaction => {
      // Filtro por tipo
      if (filter.type !== 'all' && transaction.type !== filter.type) {
        return false;
      }
      
      // Filtro por data de início
      if (filter.startDate && transaction.date < filter.startDate) {
        return false;
      }
      
      // Filtro por data de fim
      if (filter.endDate && transaction.date > filter.endDate) {
        return false;
      }
      
      // Filtro por categoria
      if (filter.category && transaction.category !== filter.category) {
        return false;
      }
      
      return true;
    });
  };

  // Aplicar filtros às transações
  const filteredTransactions = applyFilter(transactions);

  // Calcular totais
  const totalIncome = filteredTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = filteredTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const balance = totalIncome - totalExpense;

  // Obter categorias únicas para o filtro
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Função para exportar transações como CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Data'];
    const csvData = filteredTransactions.map(t => [
      t.id,
      t.description,
      t.amount,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      t.date
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Arquivo CSV exportado com sucesso!');
  };

  return (
    <div className="animate-slide-in">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filtros */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtros
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                    <select
                      className="input-field dark:bg-gray-700 dark:border-gray-600"
                      value={filter.type}
                      onChange={(e) => setFilter({...filter, type: e.target.value as 'all' | 'income' | 'expense'})}
                    >
                      <option value="all">Todos</option>
                      <option value="income">Receitas</option>
                      <option value="expense">Despesas</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                    <select
                      className="input-field dark:bg-gray-700 dark:border-gray-600"
                      value={filter.category}
                      onChange={(e) => setFilter({...filter, category: e.target.value})}
                    >
                      <option value="">Todas</option>
                      {uniqueCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      className="input-field dark:bg-gray-700 dark:border-gray-600"
                      value={filter.startDate}
                      onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Final</label>
                    <input
                      type="date"
                      className="input-field dark:bg-gray-700 dark:border-gray-600"
                      value={filter.endDate}
                      onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      className="w-full btn btn-primary"
                      onClick={() => setFilter({ type: 'all', startDate: '', endDate: '', category: '' })}
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          
          {/* Exportar */}
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exportar
          </button>
          
          {/* Adicionar */}
          <button
            onClick={openCreateModal}
            className="btn btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-white dark:bg-gray-800 flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Receitas</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="card bg-white dark:bg-gray-800 flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Despesas</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {totalExpense.toFixed(2)}</p>
        </div>
        
        <div className="card bg-white dark:bg-gray-800 flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Saldo</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            R$ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabela de transações */}
      <div className="card bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              Carregando transações...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Descrição</th>
                  <th scope="col" className="px-6 py-3">Categoria</th>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3 text-right">Valor</th>
                  <th scope="col" className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4">{transaction.category}</td>
                    <td className="px-6 py-4">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => openEditModal(transaction)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para criar/editar transação */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                  >
                    {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição
                      </label>
                      <input
                        id="description"
                        type="text"
                        className="input-field dark:bg-gray-700 dark:border-gray-600"
                        {...register('description', { required: 'Descrição é obrigatória' })}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor
                      </label>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        className="input-field dark:bg-gray-700 dark:border-gray-600"
                        {...register('amount', { 
                          required: 'Valor é obrigatório',
                          min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                        })}
                      />
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="expense"
                            className="form-radio text-red-600"
                            {...register('type', { required: true })}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Despesa</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            value="income"
                            className="form-radio text-green-600"
                            {...register('type', { required: true })}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Receita</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoria
                      </label>
                      <select
                        id="category"
                        className="input-field dark:bg-gray-700 dark:border-gray-600"
                        {...register('category', { required: 'Categoria é obrigatória' })}
                      >
                        <option value="">Selecione uma categoria</option>
                        {transactionType === 'income' ? (
                          incomeCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))
                        ) : (
                          expenseCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))
                        )}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data
                      </label>
                      <input
                        id="date"
                        type="date"
                        className="input-field dark:bg-gray-700 dark:border-gray-600"
                        {...register('date', { required: 'Data é obrigatória' })}
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        onClick={closeModal}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        {editingTransaction ? 'Atualizar' : 'Criar'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}