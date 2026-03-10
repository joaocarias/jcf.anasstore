import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react'
import AccessRulesPage from './components/AccessRulesPage'
import CategoriesPage from './components/CategoriesPage'
import Charts from './components/Charts'
import ColorsPage from './components/ColorsPage'
import CustomersListPage from './components/CustomersListPage'
import DashboardCards from './components/DashboardCards'
import GenresPage from './components/GenresPage'
import Header from './components/Header'
import ItemSizesPage from './components/ItemSizesPage'
import PaymentMethodsPage from './components/PaymentMethodsPage'
import ProductsPage from './components/ProductsPage'
import SalesTable from './components/SalesTable'
import Sidebar from './components/Sidebar'
import StockTable from './components/StockTable'
import SuppliersPage from './components/SuppliersPage'
import UsersListPage from './components/UsersListPage'

const SESSION_KEY = 'anasstore.session'
const THEME_KEY = 'anasstore.theme'
const LOGIN_PATH = '/login'
const DASHBOARD_PATH = '/dashboard'
const CUSTOMERS_PATH = '/customers'
const PRODUCTS_PATH = '/products'
const SUPPLIERS_PATH = '/suppliers'
const USERS_PATH = '/users'
const ACCESS_RULES_PATH = '/access-rules'
const CATEGORIES_PATH = '/categories'
const COLORS_PATH = '/colors'
const GENRES_PATH = '/genres'
const ITEM_SIZES_PATH = '/item-sizes'
const PAYMENT_METHODS_PATH = '/payment-methods'
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

function getTokenExpirationMs(token) {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  if (typeof exp !== 'number') return null
  return exp * 1000
}

function getCurrentPath() {
  return window.location.pathname || LOGIN_PATH
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
      })
    } catch {
      setErrorMessage('Não foi possível autenticar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <header className="title-block">
          <p className="brand-tag">Ana&apos;s Store - Conforto Íntimo</p>
          <h1>Painel de vendas</h1>
          <p>Entre com seu e-mail e senha para abrir o painel de controle.</p>
        </header>

        <form className="form-grid" onSubmit={handleSubmit}>
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
                placeholder="voce@anasstore.com.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Senha</span>
            <div className="relative">
              <KeyRound
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="field-input !pl-10"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" className="login-button inline-flex items-center justify-center gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <ShieldCheck size={16} />
                Autenticando...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Entrar
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  )
}

function DashboardPage({ session, onLogout, theme, onToggleTheme, currentPath, onNavigate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const currentPage =
    currentPath === CUSTOMERS_PATH
      ? 'customers'
      : currentPath === PRODUCTS_PATH
        ? 'products'
      : currentPath === SUPPLIERS_PATH
        ? 'suppliers'
      : currentPath === USERS_PATH
        ? 'users'
        : currentPath === ACCESS_RULES_PATH
          ? 'access-rules'
          : currentPath === CATEGORIES_PATH
            ? 'categories'
      : currentPath === COLORS_PATH
        ? 'colors'
        : currentPath === GENRES_PATH
          ? 'genres'
          : currentPath === ITEM_SIZES_PATH
            ? 'item-sizes'
            : currentPath === PAYMENT_METHODS_PATH
              ? 'payment-methods'
        : 'dashboard'

  return (
    <main className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar
        mobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={onNavigate}
        currentPage={currentPage}
      />

      <div className="flex-1 lg:ml-72">
        <Header
          session={session}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        />

        <div className="space-y-6 p-4 sm:p-6">
          {currentPage === 'dashboard' && (
            <>
              <DashboardCards />
              <Charts />

              <div className="grid gap-6 2xl:grid-cols-2">
                <SalesTable />
                <StockTable />
              </div>
            </>
          )}

          {currentPage === 'customers' && <CustomersListPage token={session.token} />}
          {currentPage === 'products' && <ProductsPage token={session.token} />}
          {currentPage === 'suppliers' && <SuppliersPage token={session.token} />}
          {currentPage === 'users' && <UsersListPage token={session.token} />}
          {currentPage === 'access-rules' && <AccessRulesPage token={session.token} />}
          {currentPage === 'categories' && <CategoriesPage token={session.token} />}
          {currentPage === 'colors' && <ColorsPage token={session.token} />}
          {currentPage === 'genres' && <GenresPage token={session.token} />}
          {currentPage === 'item-sizes' && <ItemSizesPage token={session.token} />}
          {currentPage === 'payment-methods' && <PaymentMethodsPage token={session.token} />}
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
    if (!session && path !== LOGIN_PATH) {
      navigate(LOGIN_PATH, true)
      return
    }

    if (session && path === LOGIN_PATH) {
      navigate(DASHBOARD_PATH, true)
    }
  }, [path, session])

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
        handleLogout()
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
    return <LoginPage onLogin={handleLogin} />
  }

  if (
    currentPath === DASHBOARD_PATH ||
    currentPath === '/' ||
    currentPath === CUSTOMERS_PATH ||
    currentPath === PRODUCTS_PATH ||
    currentPath === SUPPLIERS_PATH ||
    currentPath === USERS_PATH ||
    currentPath === ACCESS_RULES_PATH ||
    currentPath === CATEGORIES_PATH ||
    currentPath === COLORS_PATH ||
    currentPath === GENRES_PATH ||
    currentPath === ITEM_SIZES_PATH
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
