# AGENTS.md

## Visao geral
Este repositorio contem uma aplicacao full-stack para gestao de vendas da Ana's Store, com frontend React (Vite) e backend ASP.NET Core (arquitetura em camadas).

## Stack usada
- Frontend:
  - React 19 + Vite 7
  - Tailwind CSS 4 (`@tailwindcss/vite`)
  - Lucide React (icones)
  - Recharts (graficos)
  - ESLint 9
- Backend:
  - .NET 10 (`net10.0`)
  - ASP.NET Core Web API
  - Entity Framework Core 10
  - ASP.NET Core Identity
  - JWT Bearer Authentication
  - PostgreSQL (Npgsql)
  - Dapper (consultas read-side)
  - Swagger / OpenAPI
- Testes backend:
  - xUnit
  - Microsoft.NET.Test.Sdk
  - coverlet.collector

## Comandos de build
### Frontend (`src/frontend`)
- Instalar dependencias:
  - `npm install`
- Desenvolvimento:
  - `npm run dev`
- Build de producao:
  - `npm run build`
- Preview local do build:
  - `npm run preview`
- Lint:
  - `npm run lint`

### Backend (`src/backend/jcf.anasstore`)
- Restaurar pacotes:
  - `dotnet restore jcf.anasstore.slnx`
- Build da solucao:
  - `dotnet build jcf.anasstore.slnx`
- Build em Release:
  - `dotnet build jcf.anasstore.slnx -c Release`
- Executar API:
  - `dotnet run --project src/Jcf.AnasStore.Api/Jcf.AnasStore.Api.csproj`

## Comandos de teste
### Backend
- Executar todos os testes:
  - `dotnet test jcf.anasstore.slnx`
- Executar em Release:
  - `dotnet test jcf.anasstore.slnx -c Release`
- Executar apenas projeto de testes:
  - `dotnet test tests/Jcf.AnasStore.Tests/Jcf.AnasStore.Tests.csproj`

### Frontend
- Nao ha suite de testes automatizados configurada atualmente (apenas lint).

## Estrutura de pastas
```text
.
|- src/
|  |- frontend/
|  |  |- src/
|  |  |  |- components/        # paginas e componentes UI
|  |  |  |- data/              # dados/mock para dashboard
|  |  |  |- App.jsx            # fluxo de autenticacao + roteamento por path
|  |  |  |- main.jsx           # bootstrap React
|  |  |  |- index.css          # estilos globais + Tailwind
|  |  |- public/
|  |  |- package.json
|  |  |- vite.config.js        # proxy /api -> backend local
|  |
|  |- backend/jcf.anasstore/
|     |- src/
|     |  |- Jcf.AnasStore.Api/            # controllers, contratos HTTP, Program.cs
|     |  |- Jcf.AnasStore.Application/    # abstracoes e casos de uso (features)
|     |  |- Jcf.AnasStore.Domain/         # entidades e regras de dominio
|     |  |- Jcf.AnasStore.Infrastructure/ # EF Core, Identity, seguranca, repositorios
|     |- tests/
|     |  |- Jcf.AnasStore.Tests/          # testes unitarios
|     |- jcf.anasstore.slnx
|- .github/
|- README.md
```

## Padroes de codigo
### Backend
- Arquitetura em camadas: `Api` -> `Application` -> `Domain`, com detalhes tecnicos em `Infrastructure`.
- Entidades de dominio com encapsulamento:
  - setters privados
  - validacoes em construtores/metodos de atualizacao
- Persistencia com EF Core e configuracoes por entidade em `Persistence/Configurations`.
- Soft delete e filtros globais por `IsActive` no `AppDbContext`.
- Entidades usam `Id` (long) interno e `Uid` (Guid) para exposicao externa.
- Endpoints REST em controllers com `async/await`, `CancellationToken` e DTOs em `Api/Contracts`.
- CQRS simples via abstractions (`ICommand`, `IQuery`, handlers/dispatchers) para alguns fluxos de aplicacao.
- Autenticacao/autorizacao com JWT + Identity, fallback de autorizacao global e roles em endpoints sensiveis.

### Frontend
- React funcional com hooks (`useState`, `useEffect`, `useMemo`, `useRef`).
- Roteamento manual baseado em `window.history` e `popstate` (sem React Router).
- Sessao e tema persistidos em `localStorage`.
- Integracao HTTP com `fetch`, token JWT e fluxo de refresh token.
- Estilizacao hibrida:
  - utilitarios Tailwind
  - CSS global em `index.css` com variaveis e temas claro/escuro
- Componentizacao por dominio de tela em `src/components`.

## Convencoes praticas para contribuicao
- Manter nomes e namespaces consistentes com o modulo (`Jcf.AnasStore.*`).
- Sempre propagar `CancellationToken` em operacoes async no backend.
- Em novas entidades, preservar o padrao:
  - validacao de invariantes no dominio
  - configuracao EF dedicada
  - DTOs/Contracts para entrada e saida da API
- Em novos endpoints, explicitar codigos de resposta e contratos (`ProducesResponseType`).
- No frontend, preferir componentes pequenos por pagina/feature e centralizar chaves de armazenamento/paths em constantes.
- Rodar antes de PR:
  - Frontend: `npm run lint` e `npm run build`
  - Backend: `dotnet build` e `dotnet test`
