import { ChevronDown, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

export default function Header({ session, onLogout, theme, onToggleTheme, onToggleSidebar }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-800 transition-all duration-200 hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Ana&apos;s Store</p>
        <h1 className="hidden text-lg font-bold text-gray-900 dark:text-gray-100 sm:block">Dashboard Financeiro</h1>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-800 transition-all duration-200 hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-all duration-200 hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-blue-500 dark:hover:text-blue-400 sm:px-4"
        >
          {session.displayName}
          <ChevronDown size={16} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-12 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
              Perfil
            </button>
            <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
              Trocar Senha
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut size={16} />
              SAIR
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
