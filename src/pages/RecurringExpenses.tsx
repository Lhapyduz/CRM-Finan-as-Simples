import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { recurringExpenseService, transactionService, type RecurringExpense } from '../services/api';

export default function RecurringExpenses() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<RecurringExpense>({
    id: 0,
    description: '',
    amount: 0,
    dueDate: '',
    isPaid: false,
    category: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await recurringExpenseService.getAll();
      setExpenses(data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível carregar os gastos recorrentes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...expenseData } = currentExpense;

      // Validar e formatar os dados antes de enviar
      if (!expenseData.description.trim() || !expenseData.category.trim() || !expenseData.dueDate || expenseData.amount <= 0) {
        toast.error('Por favor, preencha todos os campos corretamente');
        return;
      }

      const formattedData = {
        ...expenseData,
        description: expenseData.description.trim(),
        category: expenseData.category.trim(),
        amount: Number(expenseData.amount),
        isPaid: expenseData.isPaid === true ? true : false
      };

      // Log para depuração
      console.log('Dados formatados:', formattedData);

      if (isEditing) {
        await recurringExpenseService.update(id, formattedData);
        toast.success('Gasto atualizado com sucesso!');
      } else {
        await recurringExpenseService.create(formattedData);
        toast.success('Gasto adicionado com sucesso!');
      }

      await fetchExpenses();
      resetForm();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar o gasto recorrente');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este gasto recorrente?')) return;

    try {
      await recurringExpenseService.delete(id);
      toast.success('Gasto excluído com sucesso!');
      await fetchExpenses();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir o gasto recorrente');
    }
  };

  const handleTogglePaid = async (expense: RecurringExpense) => {
    try {
      const { id, ...expenseData } = expense;
      const newStatus = !expense.isPaid;

      await recurringExpenseService.update(id, { ...expenseData, isPaid: newStatus });
      toast.success(`Gasto marcado como ${newStatus ? 'pago' : 'não pago'}!`);

      // Se foi marcado como pago, cria uma transação real
      if (newStatus === true) {
        try {
          await transactionService.create({
            description: expense.description,
            amount: expense.amount,
            type: 'expense',
            category: expense.category,
            date: new Date().toISOString().slice(0, 10)
          });
          toast.success('Transação adicionada ao histórico!');
        } catch (txnError) {
          console.error('Erro ao criar transação automática:', txnError);
          toast.error('Gasto marcado como pago, mas falhou ao gerar transação no histórico.');
        }
      }

      await fetchExpenses();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar o status do pagamento');
    }
  };

  const editExpense = (expense: RecurringExpense) => {
    setCurrentExpense(expense);
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setCurrentExpense({
      id: 0,
      description: '',
      amount: 0,
      dueDate: '',
      isPaid: false,
      category: ''
    });
    setIsEditing(false);
    setShowForm(false);
  };

  return (
    <div className="animate-slide-in">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gastos Recorrentes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Gasto Recorrente
        </button>
      </div>

      {showForm && (
        <div className="card bg-white dark:bg-gray-800 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={currentExpense.description}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, description: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={currentExpense.category}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, category: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  value={currentExpense.amount}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, amount: parseFloat(e.target.value) })}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={currentExpense.dueDate}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, dueDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {isEditing ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Carregando gastos recorrentes...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Descrição</th>
                <th scope="col" className="px-6 py-3">Categoria</th>
                <th scope="col" className="px-6 py-3">Valor</th>
                <th scope="col" className="px-6 py-3">Vencimento</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4">{expense.category}</td>
                  <td className="px-6 py-4">R$ {expense.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePaid(expense)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${expense.isPaid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}
                    >
                      {expense.isPaid ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Pago
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Pendente
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editExpense(expense)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
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
        </div>
      )}
    </div>
  );
}