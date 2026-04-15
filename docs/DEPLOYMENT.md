# Deploy Automático - Ana's Store

Este documento descreve como configurar o deploy automático do Ana's Store em um VPS Hostinger.

## Arquitetura

```
GitHub (branch production)
         ↓
GitHub Actions (build Docker images)
         ↓
Docker Registry (GHCR)
         ↓
VPS Hostinger (ssh deploy)
         ↓
Docker Compose (containers)
```

## Pré-requisitos

### No GitHub
- [x] Variáveis de secrets configuradas:
  - `HOST`: IP ou domínio do VPS
  - `USERNAME`: Usuário SSH do VPS
  - `SSH_KEY`: Chave privada SSH

### No VPS Hostinger
- [ ] Docker e Docker Compose instalados
- [ ] Git instalado
- [ ] Diretório `/opt/apps/anasstoreapp` criado
- [ ] Repositório clonado na branch `production`
- [ ] Arquivo `.env` configurado com variáveis de ambiente
- [ ] PostgreSQL acessível (interno ou externo)

---

## Setup do Servidor VPS

### 0. DNS (subdomínio app)

No painel do seu provedor de DNS (Hostinger / Cloudflare / etc), crie/ajuste:

- Registro `A` para `app` apontando para o IP público da sua VPS

Depois aguarde a propagação do DNS.

### 1. Conectar ao VPS via SSH

```bash
ssh -i /caminho/da/chave/privada USERNAME@HOST
```

### 2. Instalar Docker e Docker Compose (se não estiver instalado)

```bash
# Atualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

### 3. Criar diretório do projeto

```bash
sudo mkdir -p /opt/apps/anasstoreapp
sudo chown $USER:$USER /opt/apps/anasstoreapp
cd /opt/apps/anasstoreapp
```

### 4. Clonar o repositório

```bash
git clone -b production https://github.com/seu-usuario/seu-repo.git .
```

### 5. Configurar variáveis de ambiente

```bash
# Criar arquivo .env baseado em .env.example (se existir)
cp .env.example .env

# Editar o arquivo com suas configurações
nano .env
```

**Exemplo de `.env` para produção:**

```env
# Domain / Reverse proxy (Caddy)
APP_DOMAIN=app.anasstore.com.br

# Database
POSTGRES_DB=anasstoreapp_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha_muito_segura_aqui
DB_CONNECTION=Server=db;Port=5432;Database=anasstoreapp_prod;User Id=postgres;Password=senha_muito_segura_aqui;

# ASP.NET Core
ASPNETCORE_URLS=http://+:8080
ASPNETCORE_ENVIRONMENT=Production

# JWT
JwtSettings__SigningKey=chave_super_secreta_de_minimo_32_caracteres
JwtSettings__Issuer=anasstore
JwtSettings__Audience=anasstore-app
JwtSettings__ExpirationMinutes=1440

# Database Migrations
Database__AutoMigrate=true
Seed__EnableLookupSeed=false
Seed__EnableDefaultUsers=false

# Frontend API
VITE_API_BASE_URL=https://seu-dominio.com/api
```

### 5.1 Liberar portas no firewall (se usar ufw)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 6. Configurar autenticação Docker Registry

Para que o GitHub Actions possa fazer push das imagens, você precisará autenticar no GitHub Container Registry (GHCR).

No servidor VPS, configure o acesso ao GHCR:

```bash
# Fazer login no GHCR
docker login ghcr.io -u seu-usuario-github -p seu-token-github

# Token: Generate no https://github.com/settings/tokens
# Escopos necessários: read:packages, write:packages
```

### 7. Ajustar docker-compose.yml para produção

No arquivo `docker-compose.yml`, certifique-se de que as imagens estão apontando para o registry correto:

```yaml
services:
  backend:
    image: ghcr.io/seu-usuario-github/anasstore-backend:latest
    # ...
  
  frontend:
    image: ghcr.io/seu-usuario-github/anasstore-frontend:latest
    # ...
```

### 8. Configurar permissões SSH no servidor

Adicione a chave SSH pública do GitHub Actions ao arquivo `~/.ssh/authorized_keys`:

```bash
# Gerar par de chaves (se não tiver)
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""

# Adicionar chave pública às authorized keys
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys

# Definir permissões corretas
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Copiar a chave PRIVADA para GitHub Secrets
cat ~/.ssh/deploy_key
```

### 9. Criar diretório de logs

```bash
sudo mkdir -p /var/log
sudo touch /var/log/anasstore-deploy.log
sudo chown $USER:$USER /var/log/anasstore-deploy.log
```

### 10. Dar permissão de execução ao script de deploy

```bash
chmod +x scripts/deploy.sh
```

---

## Configuração no GitHub

### 1. Adicionar secrets

Vá para: **Settings → Secrets and variables → Actions**

Adicione os seguintes secrets:
- `HOST`: IP ou domínio do seu VPS
- `USERNAME`: Usuário SSH
- `SSH_KEY`: Conteúdo da chave privada SSH

### 2. Verificar workflow

O arquivo `.github/workflows/deploy-production.yml` está pronto. Ele será acionado automaticamente quando você fazer push na branch `production`.

---

## Primeiro Deploy Manual

Para testar se tudo está funcionando:

```bash
# No servidor VPS
cd /opt/apps/anasstoreapp

# Fazer pull das imagens
docker compose pull

# Iniciar containers
docker compose up -d

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
```

---

## Monitoramento e Manutenção

### Ver logs em tempo real

```bash
# Todos os serviços
docker compose logs -f

# Apenas backend
docker compose logs -f backend

# Apenas frontend
docker compose logs -f frontend

# Deploy log
tail -f /var/log/anasstore-deploy.log
```

### Parar/reiniciar serviços

```bash
# Parar tudo
docker compose down

# Reiniciar tudo
docker compose up -d

# Reiniciar apenas um serviço
docker compose restart backend
```

### Limpar espaço em disco

```bash
# Remover imagens antigas
docker image prune -a

# Remover volumes não usados
docker volume prune

# Remover containers parados
docker container prune
```

---

## Troubleshooting

### Erro: "Permission denied" ao fazer SSH

Verifique as permissões da chave SSH:
```bash
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Erro: "docker: command not found"

Docker não está instalado. Execute o passo 2 do setup.

### Erro: "Image not found" ao fazer docker compose pull

Verifique se:
1. As imagens estão sendo built corretamente no GitHub Actions
2. Você está autenticado no GHCR: `docker login ghcr.io`
3. Os nomes das imagens no `docker-compose.yml` estão corretos

### Erro: "Connection refused" na porta 5173 ou 5117

Verifique se os containers estão rodando:
```bash
docker compose ps
docker compose logs
```

### Erro: "POSTGRES_PASSWORD not set"

Certifique-se de que o arquivo `.env` existe e tem as variáveis corretas:
```bash
cat .env | grep POSTGRES
```

---

## Fluxo de Deploy Automático

1. Você faz `git push` na branch `production`
2. GitHub Actions detecta o push
3. GitHub Actions faz build das imagens Docker
4. GitHub Actions faz push para GHCR
5. GitHub Actions conecta via SSH ao VPS
6. Script de deploy no VPS:
   - Faz `git pull`
   - Faz `docker compose pull`
   - Reinicia os containers
7. Aplicação está online com as novas mudanças

---

## Variáveis de Ambiente Importantes

### Backend (.NET)

- `ASPNETCORE_ENVIRONMENT`: Development, Staging ou Production
- `ASPNETCORE_URLS`: URL da API (ex: `http://+:8080`)
- `ConnectionStrings__DefaultConnection`: String de conexão PostgreSQL
- `JwtSettings__*`: Configurações JWT
- `Database__AutoMigrate`: Se true, roda migrations automaticamente

### Frontend (React/Vite)

- `VITE_API_BASE_URL`: URL base da API (ex: `https://seu-dominio.com/api`)

### Database

- `POSTGRES_DB`: Nome do banco de dados
- `POSTGRES_USER`: Usuário PostgreSQL
- `POSTGRES_PASSWORD`: Senha PostgreSQL

---

## Checklist de Produção

- [ ] DNS `app` apontando para a VPS
- [ ] Portas 80/443 liberadas (firewall)
- [ ] Domínio customizado apontando para o VPS
- [ ] Backup do banco de dados configurado
- [ ] Monitoramento de logs configurado
- [ ] Health checks configurados
- [ ] Rate limiting configurado no backend
- [ ] CORS configurado corretamente
- [ ] Senhas e secrets não estão no repositório
- [ ] Build Docker otimizado (multi-stage)
- [ ] Limite de recursos definido (memory, CPU)

---

## Próximos Passos

1. Testar deploy com `git push` em production
2. Monitorar logs em tempo real
3. Configurar backup automático do banco de dados
4. Configurar SSL/HTTPS com Let's Encrypt
5. Configurar domínio customizado
6. Monitorar performance e logs

Para dúvidas ou problemas, verifique os logs do GitHub Actions e do servidor VPS!
