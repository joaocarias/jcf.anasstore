import {
  Building2,
  ChevronDown,
  CreditCard,
  Factory,
  History,
  House,
  Palette,
  PlusCircle,
  ReceiptText,
  Ruler,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Tags,
  UserCircle2,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'

function SidebarItem({ icon, label, active = false, hasChildren = false, expanded = false, onClick }) {
  const IconComponent = icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
      }`}
    >
      <IconComponent size={18} />
      <span>{label}</span>
      {hasChildren && (
        <ChevronDown
          size={16}
          className={`ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : 'rotate-0'}`}
        />
      )}
    </button>
  )
}

function SidebarSubItem({ icon, label, active = false, onClick }) {
  const IconComponent = icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-white'
          : 'text-gray-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
      }`}
    >
      <IconComponent size={15} />
      {label}
    </button>
  )
}

function SidebarContent({ expandedMenu, onToggleMenu, onNavigate, currentPage, onClose }) {
  return (
    <>
      <div className="mb-8 border-b border-gray-200 pb-4 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            onNavigate('dashboard')
            onClose()
          }}
          className="text-left text-sm font-extrabold uppercase tracking-[0.24em] text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
        >
          ANA&apos;S STORE
        </button>
      </div>

      <nav className="space-y-2">
        <SidebarItem
          icon={House}
          label="Home"
          active={currentPage === 'dashboard'}
          onClick={() => {
            onNavigate('dashboard')
            onClose()
          }}
        />

        <SidebarItem
          icon={ReceiptText}
          label="Vendas"
          active={expandedMenu === 'vendas'}
          hasChildren
          expanded={expandedMenu === 'vendas'}
          onClick={() => onToggleMenu('vendas')}
        />
        {expandedMenu === 'vendas' && (
          <div className="ml-7 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-800">
            <SidebarSubItem
              icon={PlusCircle}
              label="Nova Venda"
              active={currentPage === 'new-sale'}
              onClick={() => {
                onNavigate('new-sale')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={History}
              label="Histórico de Vendas"
              active={currentPage === 'sales-history'}
              onClick={() => {
                onNavigate('sales-history')
                onClose()
              }}
            />
          </div>
        )}

        <SidebarItem
          icon={UsersRound}
          label="Gestão"
          active={expandedMenu === 'Gestão'}
          hasChildren
          expanded={expandedMenu === 'Gestão'}
          onClick={() => onToggleMenu('Gestão')}
        />
        {expandedMenu === 'Gestão' && (
          <div className="ml-7 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-800">
            <SidebarSubItem
              icon={UserCircle2}
              label="Clientes"
              active={currentPage === 'customers'}
              onClick={() => {
                onNavigate('customers')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={ShoppingBag}
              label="Produtos"
              active={currentPage === 'products'}
              onClick={() => {
                onNavigate('products')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={Factory}
              label="Fornecedores"
              active={currentPage === 'suppliers'}
              onClick={() => {
                onNavigate('suppliers')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={UsersRound}
              label="Usuários"
              active={currentPage === 'users'}
              onClick={() => {
                onNavigate('users')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={ShieldCheck}
              label="Regras de Acesso"
              active={currentPage === 'access-rules'}
              onClick={() => {
                onNavigate('access-rules')
                onClose()
              }}
            />
          </div>
        )}

        <SidebarItem
          icon={Settings}
          label="Utilidades"
          active={expandedMenu === 'Utilidades'}
          hasChildren
          expanded={expandedMenu === 'Utilidades'}
          onClick={() => onToggleMenu('Utilidades')}
        />
        {expandedMenu === 'Utilidades' && (
          <div className="ml-7 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-800">
            <SidebarSubItem
              icon={Tags}
              label="Etiquetas"
              active={currentPage === 'labels'}
              onClick={() => {
                onNavigate('labels')
                onClose()
              }}
            />
          </div>
        )}

        <SidebarItem
          icon={Settings}
          label="Configurações"
          active={expandedMenu === 'Configurações'}
          hasChildren
          expanded={expandedMenu === 'Configurações'}
          onClick={() => onToggleMenu('Configurações')}
        />
        {expandedMenu === 'Configurações' && (
          <div className="ml-7 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-800">
            <SidebarSubItem
              icon={Building2}
              label="Organização"
              active={currentPage === 'organization'}
              onClick={() => {
                onNavigate('organization')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={Tags}
              label="Categorias"
              active={currentPage === 'categories'}
              onClick={() => {
                onNavigate('categories')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={Palette}
              label="Cores"
              active={currentPage === 'colors'}
              onClick={() => {
                onNavigate('colors')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={CreditCard}
              label="Formas de Pagamento"
              active={currentPage === 'payment-methods'}
              onClick={() => {
                onNavigate('payment-methods')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={Ruler}
              label="Tamanhos"
              active={currentPage === 'item-sizes'}
              onClick={() => {
                onNavigate('item-sizes')
                onClose()
              }}
            />
            <SidebarSubItem
              icon={Shirt}
              label="Gêneros"
              active={currentPage === 'genres'}
              onClick={() => {
                onNavigate('genres')
                onClose()
              }}
            />
          </div>
        )}
      </nav>
    </>
  )
}

export default function Sidebar({
  mobileOpen = false,
  onClose = () => {},
  onNavigate = () => {},
  currentPage = 'dashboard',
}) {
  const [expandedMenu, setExpandedMenu] = useState(null)

  function handleToggleMenu(menuKey) {
    setExpandedMenu((current) => (current === menuKey ? null : menuKey))
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col overflow-y-auto bg-white px-4 py-6 text-gray-700 shadow-2xl dark:bg-gray-900 dark:text-gray-300 lg:flex">
        <SidebarContent
          expandedMenu={expandedMenu}
          onToggleMenu={handleToggleMenu}
          onNavigate={onNavigate}
          currentPage={currentPage}
          onClose={onClose}
        />
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
          <aside className="fixed left-0 top-0 z-50 flex h-screen w-[85vw] max-w-72 flex-col overflow-y-auto bg-white px-4 py-6 text-gray-700 shadow-2xl dark:bg-gray-900 dark:text-gray-300 lg:hidden">
            <SidebarContent
              expandedMenu={expandedMenu}
              onToggleMenu={handleToggleMenu}
              onNavigate={onNavigate}
              currentPage={currentPage}
              onClose={onClose}
            />
          </aside>
        </>
      )}
    </>
  )
}


