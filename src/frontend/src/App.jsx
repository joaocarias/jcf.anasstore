import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react'
import AbcReportPage from './components/AbcReportPage'
import AccessRulesPage from './components/AccessRulesPage'
import CashFlowReportPage from './components/CashFlowReportPage'
import CategoriesPage from './components/CategoriesPage'
import ColorsPage from './components/ColorsPage'
import CustomersListPage from './components/CustomersListPage'
import DashboardHome from './components/DashboardHome'
import GenresPage from './components/GenresPage'
import Header from './components/Header'
import ItemSizesPage from './components/ItemSizesPage'
import LabelsPage from './components/LabelsPage'
import NewSalePage from './components/NewSalePage'
import OrganizationPage from './components/OrganizationPage'
import PaymentMethodsPage from './components/PaymentMethodsPage'
import ProductsPage from './components/ProductsPage'
import ProfilePage from './components/ProfilePage'
import SalesHistoryPage from './components/SalesHistoryPage'
import SalesReportPage from './components/SalesReportPage'
import Sidebar from './components/Sidebar'
import SuppliersPage from './components/SuppliersPage'
import UsersListPage from './components/UsersListPage'

const SESSION_KEY = 'anasstore.session'
const THEME_KEY = 'anasstore.theme'
const LOGIN_PATH = '/login'
const RESET_PASSWORD_PATH = '/reset-password'
const DASHBOARD_PATH = '/dashboard'
const CUSTOMERS_PATH = '/customers'
const PRODUCTS_PATH = '/products'
const NEW_SALE_PATH = '/sales/new'
const SALES_HISTORY_PATH = '/sales/history'
const PROFILE_PATH = '/profile'
const SUPPLIERS_PATH = '/suppliers'
const USERS_PATH = '/users'
const ACCESS_RULES_PATH = '/access-rules'
const CATEGORIES_PATH = '/categories'
const COLORS_PATH = '/colors'
const GENRES_PATH = '/genres'
const ITEM_SIZES_PATH = '/item-sizes'
const PAYMENT_METHODS_PATH = '/payment-methods'
const ORGANIZATION_PATH = '/organization'
const LABELS_PATH = '/labels'
const REPORT_SALES_PATH = '/reports/sales'
const REPORT_ABC_PATH = '/reports/abc'
const REPORT_CASH_FLOW_PATH = '/reports/cash-flow'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000
const TOKEN_REFRESH_CHECK_INTERVAL_MS = 30 * 1000

function readSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function readTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
}

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getRolesFromToken(token) {
  const payload = decodeJwtPayload(token)
  if (!payload) return []
  const roleClaim =
    payload.role ??
    payload.roles ??
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role']
  if (!roleClaim) return []
  if (Array.isArray(roleClaim)) return roleClaim.filter(Boolean)
  if (typeof roleClaim === 'string') return [roleClaim]
  return []
}
function getTokenExpirationMs(token) {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  if (typeof exp !== 'number') return null
  return exp * 1000
}

function getCurrentPath() {
  const rawPath = window.location.pathname || LOGIN_PATH
  if (rawPath.length > 1 && rawPath.endsWith('/')) {
    return rawPath.slice(0, -1)
  }
  return rawPath
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name) ?? ''
}

function navigate(path, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', path)
  } else {
    window.history.pushState({}, '', path)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (response.status === 401) {
        setErrorMessage('Não foi possível realizar a autenticação, verifique o usuário e a senha.')
        return
      }

      if (!response.ok || !payload?.success || !payload?.token || !payload?.refreshToken) {
        setErrorMessage('Não foi possível autenticar.')
        return
      }

      const claims = decodeJwtPayload(payload.token)
      const displayName = claims?.name || claims?.unique_name || claims?.email || email

      onLogin({
        token: payload.token,
        refreshToken: payload.refreshToken,
        email,
        displayName,
        roles: getRolesFromToken(payload.token),
      })
    } catch {
      setErrorMessage('Não foi possível autenticar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-shell-modern">
      <div className="login-background"></div>

      <div className="login-container">
        <div className="login-left">
          <div className="login-illustration">
            <div className="illustration-circle circle-1"></div>
            <div className="illustration-circle circle-2"></div>
            <div className="illustration-circle circle-3"></div>
            <div className="user-icon-wrapper">
              <svg className="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <p className="illustration-text">Bem-vinda ao seu espaço!</p>
          </div>
        </div>

        <div className="login-right">
          <section className="login-card-modern">
            <header className="title-block-modern">
              <p className="brand-tag-modern">ANA&apos;S STORE</p>
              <h1>Entre para continuar</h1>
              <p>Acesse seu painel de gerenciamento</p>
            </header>

            <form className="form-grid-modern" onSubmit={handleSubmit}>
              <label className="field-modern">
                <span className="field-label-modern">E-mail</span>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    className="field-input-modern"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="field-modern">
                <span className="field-label-modern">Senha</span>
                <div className="input-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    className="field-input-modern"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="toggle-password-btn"
                    aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {errorMessage && <p className="error-message-modern">{errorMessage}</p>}

              <button
                type="submit"
                className="login-button-modern"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner-mini"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Conectar
                  </>
                )}
              </button>

              <button
                type="button"
                className="forgot-password-btn"
                onClick={() => navigate(RESET_PASSWORD_PATH)}
              >
                Esqueci minha senha
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

function ResetPasswordPage() {
  const initialEmail = getQueryParam('email')
  const [activeTab, setActiveTab] = useState(initialEmail ? 'confirm' : 'request')
  const [email, setEmail] = useState(initialEmail)
  const [tempPassword, setTempPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequest(event) {
    event.preventDefault()
    setErrorMessage('')
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const msg = payload?.message || 'Nao foi possivel solicitar a senha temporaria.'
        setErrorMessage(msg)
        return
      }

      setMessage(payload?.message || 'Senha temporaria enviada para seu email.')
      setActiveTab('confirm')
    } catch {
      setErrorMessage('Nao foi possivel solicitar a senha temporaria.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirm(event) {
    event.preventDefault()
    setErrorMessage('')
    setMessage('')

    if (!tempPassword || !newPassword) {
      setErrorMessage('Informe a senha temporaria e a nova senha.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmacao da senha nao confere.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/confirm-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, temporaryPassword: tempPassword, newPassword }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        let msg = payload?.message || 'Nao foi possivel atualizar a senha.'
        if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
          msg = payload.errors.join(' ')
        }
        setErrorMessage(msg)
        return
      }

      setMessage(payload?.message || 'Senha atualizada com sucesso.')
      setTempPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setErrorMessage('Nao foi possivel atualizar a senha.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <header className="title-block">
          <p className="brand-tag">ANA&apos;S STORE</p>
          <h1>Resetar senha</h1>
          <p>Receba uma senha temporaria e finalize a troca com uma nova senha.</p>
        </header>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === 'request'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('request')}
          >
            Solicitar senha
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === 'confirm'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('confirm')}
          >
            Trocar senha
          </button>
        </div>

        {activeTab === 'request' ? (
          <form className="form-grid" onSubmit={handleRequest}>
            <label className="field">
              <span className="field-label">E-mail</span>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="field-input !pl-10"
                  type="email"
                  autoComplete="email"
                  placeholder="seuemail@anastore.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {message && <p className="success-message">{message}</p>}

            <button type="submit" className="login-button inline-flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar senha temporaria'}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleConfirm}>
            <label className="field">
              <span className="field-label">E-mail</span>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="field-input !pl-10"
                  type="email"
                  autoComplete="email"
                  placeholder="seuemail@anastore.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Senha temporaria</span>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="field-input !pl-10"
                  type="password"
                  autoComplete="one-time-code"
                  placeholder="Digite a senha temporaria"
                  value={tempPassword}
                  onChange={(event) => setTempPassword(event.target.value)}
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Nova senha</span>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="field-input !pl-10"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Confirmar nova senha</span>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="field-input !pl-10"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            </label>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {message && <p className="success-message">{message}</p>}

            <button type="submit" className="login-button inline-flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        )}

        <button
          type="button"
          className="mt-4 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
          onClick={() => navigate(LOGIN_PATH)}
        >
          Voltar para o login
        </button>
      </section>
    </main>
  )
}

function DashboardPage({ session, onLogout, theme, onToggleTheme, currentPath, onNavigate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const currentPage =
    {
      [CUSTOMERS_PATH]: 'customers',
      [PRODUCTS_PATH]: 'products',
      [NEW_SALE_PATH]: 'new-sale',
      [SALES_HISTORY_PATH]: 'sales-history',
      [PROFILE_PATH]: 'profile',
      [SUPPLIERS_PATH]: 'suppliers',
      [USERS_PATH]: 'users',
      [ACCESS_RULES_PATH]: 'access-rules',
      [CATEGORIES_PATH]: 'categories',
      [COLORS_PATH]: 'colors',
      [GENRES_PATH]: 'genres',
      [ITEM_SIZES_PATH]: 'item-sizes',
      [PAYMENT_METHODS_PATH]: 'payment-methods',
      [ORGANIZATION_PATH]: 'organization',
      [LABELS_PATH]: 'labels',
      [REPORT_SALES_PATH]: 'report-sales',
      [REPORT_ABC_PATH]: 'report-abc',
      [REPORT_CASH_FLOW_PATH]: 'report-cash-flow',
    }[currentPath] ?? 'dashboard'

  const isAdmin = (session?.roles ?? getRolesFromToken(session?.token ?? '')).includes('Admin')


  return (
    <main className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar
        mobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={onNavigate}
        currentPage={currentPage}
      />

      <div className="min-w-0 flex-1 overflow-x-hidden lg:ml-72">
        <Header
          session={session}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
          onNavigate={onNavigate}
        />

        <div className="space-y-6 p-4 sm:p-6">
          {currentPage === 'dashboard' && (
            <DashboardHome token={session.token} onNavigate={onNavigate} />
          )}

          {currentPage === 'customers' && <CustomersListPage token={session.token} />}
          {currentPage === 'products' && <ProductsPage token={session.token} />}
          {currentPage === 'new-sale' && <NewSalePage token={session.token} />}
          {currentPage === 'sales-history' && <SalesHistoryPage token={session.token} />}
          {currentPage === 'profile' && <ProfilePage session={session} token={session.token} />}
          {currentPage === 'suppliers' && <SuppliersPage token={session.token} />}
          {currentPage === 'users' && <UsersListPage token={session.token} />}
          {currentPage === 'access-rules' && <AccessRulesPage token={session.token} />}
          {currentPage === 'categories' && <CategoriesPage token={session.token} />}
          {currentPage === 'colors' && <ColorsPage token={session.token} />}
          {currentPage === 'genres' && <GenresPage token={session.token} />}
          {currentPage === 'item-sizes' && <ItemSizesPage token={session.token} />}
          {currentPage === 'payment-methods' && <PaymentMethodsPage token={session.token} />}
          {currentPage === 'organization' && <OrganizationPage token={session.token} isAdmin={isAdmin} />}
          {currentPage === 'labels' && <LabelsPage token={session.token} />}
          {currentPage === 'report-sales' && <SalesReportPage token={session.token} />}
          {currentPage === 'report-abc' && <AbcReportPage token={session.token} />}
          {currentPage === 'report-cash-flow' && <CashFlowReportPage token={session.token} />}
        </div>
      </div>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(() => readSession())
  const [path, setPath] = useState(() => getCurrentPath())
  const [theme, setTheme] = useState(() => readTheme())
  const refreshInFlightRef = useRef(false)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    function syncPath() {
      setPath(getCurrentPath())
    }

    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    if (!session && path !== LOGIN_PATH && path !== RESET_PASSWORD_PATH) {
      navigate(LOGIN_PATH, true)
      return
    }

    if (session && path === LOGIN_PATH) {
      navigate(DASHBOARD_PATH, true)
    }
  }, [path, session])

  useEffect(() => {
    if (!session?.token) {
      return
    }

    const currentRoles = Array.isArray(session.roles) ? session.roles : null
    if (currentRoles && currentRoles.length > 0) {
      return
    }

    const roles = getRolesFromToken(session.token)
    const nextSession = { ...session, roles }
    writeSession(nextSession)
    setSession(nextSession)
  }, [session])
  useEffect(() => {
    if (!session) {
      return
    }

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (response.status === 401) {
          handleLogout()
        }

        return response
      } catch (error) {
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [session])

  function handleLogin(nextSession) {
    writeSession(nextSession)
    setSession(nextSession)
    navigate(DASHBOARD_PATH, true)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    navigate(LOGIN_PATH, true)
  }

  async function refreshSession(currentSession) {
    if (!currentSession?.refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
      })

      if (!response.ok) {
        return null
      }

      const payload = await response.json()
      if (!payload?.success || !payload?.token || !payload?.refreshToken) {
        return null
      }

      return {
        ...currentSession,
        token: payload.token,
        refreshToken: payload.refreshToken,
        roles: getRolesFromToken(payload.token),
      }
    } catch {
      return null
    }
  }

  function handleToggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  function handleNavigatePage(page) {
    if (page === 'customers') {
      navigate(CUSTOMERS_PATH)
      return
    }

    if (page === 'users') {
      navigate(USERS_PATH)
      return
    }

    if (page === 'products') {
      navigate(PRODUCTS_PATH)
      return
    }

    if (page === 'new-sale') {
      navigate(NEW_SALE_PATH)
      return
    }

    if (page === 'sales-history') {
      navigate(SALES_HISTORY_PATH)
      return
    }

    if (page === 'profile') {
      navigate(PROFILE_PATH)
      return
    }

    if (page === 'suppliers') {
      navigate(SUPPLIERS_PATH)
      return
    }

    if (page === 'access-rules') {
      navigate(ACCESS_RULES_PATH)
      return
    }

    if (page === 'categories') {
      navigate(CATEGORIES_PATH)
      return
    }

    if (page === 'colors') {
      navigate(COLORS_PATH)
      return
    }

    if (page === 'genres') {
      navigate(GENRES_PATH)
      return
    }

    if (page === 'item-sizes') {
      navigate(ITEM_SIZES_PATH)
      return
    }

    if (page === 'payment-methods') {
      navigate(PAYMENT_METHODS_PATH)
      return
    }

    if (page === 'organization') {
      navigate(ORGANIZATION_PATH)
      return
    }

    if (page === 'labels') {
      navigate(LABELS_PATH)
      return
    }

    if (page === 'report-sales') {
      navigate(REPORT_SALES_PATH)
      return
    }

    if (page === 'report-abc') {
      navigate(REPORT_ABC_PATH)
      return
    }

    if (page === 'report-cash-flow') {
      navigate(REPORT_CASH_FLOW_PATH)
      return
    }

    navigate(DASHBOARD_PATH)
  }

  const currentPath = useMemo(() => {
    if (!session) return LOGIN_PATH
    return path === LOGIN_PATH ? DASHBOARD_PATH : path
  }, [path, session])

  useEffect(() => {
    if (!session?.token) {
      return
    }

    const expirationMs = getTokenExpirationMs(session.token)
    if (!expirationMs || expirationMs <= Date.now()) {
      handleLogout()
      return
    }

    const intervalId = window.setInterval(() => {
      const nextExpirationMs = getTokenExpirationMs(session.token)
      if (!nextExpirationMs || nextExpirationMs <= Date.now()) {
        handleLogout()
      }
    }, 15 * 1000)

    return () => window.clearInterval(intervalId)
  }, [session?.token])

  useEffect(() => {
    if (!session?.token || !session?.refreshToken) {
      return
    }

    let cancelled = false

    async function ensureValidAccessToken() {
      if (refreshInFlightRef.current) {
        return
      }

      const expirationMs = getTokenExpirationMs(session.token)
      if (!expirationMs) {
        return
      }

      if (expirationMs - Date.now() > TOKEN_REFRESH_WINDOW_MS) {
        return
      }

      refreshInFlightRef.current = true
      try {
        const nextSession = await refreshSession(session)
        if (!nextSession) {
          if (!cancelled) {
            handleLogout()
          }
          return
        }

        if (!cancelled) {
          writeSession(nextSession)
          setSession(nextSession)
        }
      } finally {
        refreshInFlightRef.current = false
      }
    }

    ensureValidAccessToken()
    const intervalId = window.setInterval(ensureValidAccessToken, TOKEN_REFRESH_CHECK_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [session])

  if (!session) {
    if (path === RESET_PASSWORD_PATH) {
      return <ResetPasswordPage />
    }
    return <LoginPage onLogin={handleLogin} />
  }

  if (
    currentPath === DASHBOARD_PATH ||
    currentPath === '/' ||
    currentPath === CUSTOMERS_PATH ||
    currentPath === PRODUCTS_PATH ||
    currentPath === NEW_SALE_PATH ||
    currentPath === SALES_HISTORY_PATH ||
    currentPath === PROFILE_PATH ||
    currentPath === SUPPLIERS_PATH ||
    currentPath === USERS_PATH ||
    currentPath === ACCESS_RULES_PATH ||
    currentPath === CATEGORIES_PATH ||
    currentPath === COLORS_PATH ||
    currentPath === GENRES_PATH ||
    currentPath === ITEM_SIZES_PATH ||
    currentPath === PAYMENT_METHODS_PATH ||
    currentPath === ORGANIZATION_PATH ||
    currentPath === LABELS_PATH ||
    currentPath === REPORT_SALES_PATH ||
    currentPath === REPORT_ABC_PATH ||
    currentPath === REPORT_CASH_FLOW_PATH
  ) {
    return (
      <DashboardPage
        session={session}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentPath={currentPath}
        onNavigate={handleNavigatePage}
      />
    )
  }

  navigate(DASHBOARD_PATH, true)
  return null
}

export default App









