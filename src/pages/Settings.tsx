import { useState } from 'react';
import { Switch } from '@headlessui/react';
import { SunIcon, BellIcon, UserCircleIcon, KeyIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  // Estados para as configurações
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState('BRL');
  const [language, setLanguage] = useState('pt-BR');

  // Função para alternar o modo escuro
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Em uma implementação real, isso atualizaria o tema do aplicativo
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="animate-slide-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configurações</h1>

      <div className="space-y-6">
        {/* Seção de Aparência */}
        <div className="card bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <SunIcon className="h-5 w-5 mr-2 text-primary-600" />
            Aparência
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Modo Escuro</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ative para usar o tema escuro</p>
              </div>
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                className={`${darkMode ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
              >
                <span className="sr-only">Ativar modo escuro</span>
                <span
                  className={`${darkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* Seção de Notificações */}
        <div className="card bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-primary-600" />
            Notificações
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notificações de Orçamento</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receba alertas quando estiver próximo do limite</p>
              </div>
              <Switch
                checked={notifications}
                onChange={setNotifications}
                className={`${notifications ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
              >
                <span className="sr-only">Ativar notificações</span>
                <span
                  className={`${notifications ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* Seção de Preferências */}
        <div className="card bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-primary-600" />
            Preferências
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Moeda
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="BRL">Real Brasileiro (R$)</option>
                <option value="USD">Dólar Americano ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">Libra Esterlina (£)</option>
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Idioma
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (United States)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seção de Conta */}
        <div className="card bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserCircleIcon className="h-5 w-5 mr-2 text-primary-600" />
            Conta
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Perfil</h3>
              <button className="btn btn-secondary w-full sm:w-auto">
                Editar Perfil
              </button>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Senha</h3>
              <button className="btn btn-secondary w-full sm:w-auto flex items-center justify-center">
                <KeyIcon className="h-4 w-4 mr-2" />
                Alterar Senha
              </button>
            </div>

            <div className="pt-4 border-t dark:border-gray-700">
              <button className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                Excluir Conta
              </button>
            </div>
          </div>
        </div>

        {/* Seção de Exportação de Dados */}
        <div className="card bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exportação de Dados</h2>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Exporte seus dados financeiros para análise externa ou backup.
            </p>

            <div className="flex flex-wrap gap-3">
              <button className="btn btn-secondary">
                Exportar CSV
              </button>
              <button className="btn btn-secondary">
                Exportar PDF
              </button>
              <button className="btn btn-secondary">
                Backup Completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}