import { useEffect, useMemo, useState } from 'react'
import Charts from './components/Charts'
import CustomersListPage from './components/CustomersListPage'
import DashboardCards from './components/DashboardCards'
import Header from './components/Header'
import SalesTable from './components/SalesTable'
import Sidebar from './components/Sidebar'
import StockTable from './components/StockTable'

const SESSION_KEY = 'anasstore.session'
const THEME_KEY = 'anasstore.theme'
const LOGIN_PATH = '/login'
const DASHBOARD_PATH = '/dashboard'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

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

      if (!response.ok || !payload?.success || !payload?.token) {
        setErrorMessage('Não foi possível autenticar.')
        return
      }

      const claims = decodeJwtPayload(payload.token)
      const displayName = claims?.name || claims?.unique_name || claims?.email || email

      onLogin({
        token: payload.token,
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
          <p className="brand-tag">Ana&apos;s Store</p>
          <h1>Acesso ao sistema de vendas</h1>
          <p>Entre com seu e-mail e senha para abrir o painel de controle.</p>
        </header>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">E-mail</span>
            <input
              className="field-input"
              type="email"
              autoComplete="email"
              placeholder="voce@anasstore.com.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Senha</span>
            <input
              className="field-input"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

function DashboardPage({ session, onLogout, theme, onToggleTheme }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  function handleNavigate(page) {
    setCurrentPage(page)
  }

  return (
    <main className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar
        mobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
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
        </div>
      </div>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(() => readSession())
  const [path, setPath] = useState(() => getCurrentPath())
  const [theme, setTheme] = useState(() => readTheme())

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

  function handleToggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const currentPath = useMemo(() => {
    if (!session) return LOGIN_PATH
    return path === LOGIN_PATH ? DASHBOARD_PATH : path
  }, [path, session])

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (currentPath === DASHBOARD_PATH || currentPath === '/') {
    return (
      <DashboardPage
        session={session}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    )
  }

  navigate(DASHBOARD_PATH, true)
  return null
}

export default App
