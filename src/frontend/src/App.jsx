function App() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--rose-600)]">Ana&apos;s Store</p>
          <h1 className="text-3xl font-extrabold text-[var(--ink-900)] md:text-4xl">Acesso ao sistema de vendas</h1>
          <p className="text-sm text-[var(--ink-700)] md:text-base">
            Entre com seu e-mail e senha para abrir o painel de controle.
          </p>
        </header>

        <form className="space-y-5" method="post" action="/login">
          <label className="field">
            <span className="field-label">E-mail</span>
            <input
              className="field-input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="voce@anasstore.com.br"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Senha</span>
            <input
              className="field-input"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
            />
          </label>

          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
