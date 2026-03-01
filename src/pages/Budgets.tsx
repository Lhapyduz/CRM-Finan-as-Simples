import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { budgetService, Budget, BudgetFormData, transactionService } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormData>();

  useEffect(() => {
    fetchBudgetsAndCalculateSpending();
  }, []);

  const fetchBudgetsAndCalculateSpending = async () => {
    setIsLoading(true);
    try {
      const budgetsData = await budgetService.getAll();
      const transactions = await transactionService.getAll();

      const budgetsWithSpending = budgetsData.map(budget => {
        const relevantTransactions = transactions.filter(transaction =>
          transaction.type === 'expense' &&
          transaction.category === budget.category &&
          transaction.date.startsWith(budget.period)
        );

        const spent = relevantTransactions.reduce((total, transaction) =>
          total + transaction.amount, 0
        );

        return { ...budget, spent };
      });

      setBudgets(budgetsWithSpending);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      toast.error('Não foi possível carregar os orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBudget(null);
    reset({ category: '', amount: 0, period: new Date().toISOString().slice(0, 7) });
    setIsOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    reset({
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (editingBudget) {
        const updatedBudget = await budgetService.update(editingBudget.id, data);
        setBudgets(budgets.map(budget =>
          budget.id === editingBudget.id
            ? { ...updatedBudget, spent: budget.spent }
            : budget
        ));
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        const newBudget = await budgetService.create(data);
        setBudgets([...budgets, { ...newBudget, spent: 0 }]);
        toast.success('Orçamento criado com sucesso!');
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast.error('Ocorreu um erro ao salvar o orçamento');
    }
  };

  const deleteBudget = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await budgetService.delete(id);
        setBudgets(budgets.filter(budget => budget.id !== id));
        toast.success('Orçamento excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error);
        toast.error('Ocorreu um erro ao excluir o orçamento');
      }
    }
  };

  const calculatePercentage = (spent: number, amount: number) => {
    return Math.min(100, Math.round((spent / amount) * 100));
  };

  return (
    <div className="animate-slide-in">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
        <button
          onClick={openCreateModal}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Orçamento
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Carregando orçamentos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const percentage = calculatePercentage(budget.spent || 0, budget.amount);
            const isOverBudget = (budget.spent || 0) > budget.amount;

            return (
              <div key={budget.id} className="card overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{budget.category}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Período: {budget.period}
                </div>

                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    R$ {(budget.spent || 0).toFixed(2)} / R$ {budget.amount.toFixed(2)}
                  </span>
                  <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {percentage}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className={`h-2.5 rounded-full ${isOverBudget ? 'bg-red-600 dark:bg-red-500' : 'bg-primary-600 dark:bg-primary-500'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Categoria
                      </label>
                      <input
                        type="text"
                        id="category"
                        className="input-field"
                        {...register('category', { required: 'Categoria é obrigatória' })}
                      />
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Valor
                      </label>
                      <input
                        type="number"
                        id="amount"
                        step="0.01"
                        className="input-field"
                        {...register('amount', {
                          required: 'Valor é obrigatório',
                          min: { value: 0, message: 'Valor deve ser maior que zero' }
                        })}
                      />
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Período (MM/AAAA)
                      </label>
                      <input
                        type="month"
                        id="period"
                        className="input-field"
                        {...register('period', { required: 'Período é obrigatório' })}
                      />
                      {errors.period && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.period.message}</p>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        onClick={closeModal}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        {editingBudget ? 'Salvar' : 'Criar'}
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