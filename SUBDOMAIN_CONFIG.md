# Configuração de Subdomínio com Caddy

## Seu Cenário

- **Domínio principal**: `anasstore.com.br` (site/ecomerce)
- **Subdomínio**: `app.anasstore.com.br` (frontend da aplicação)
- **Registrador DNS**: Hostinger
- **Servidor**: VPS com Docker
- **Reverse proxy**: Caddy (já configurado!)

## ✅ DNS já está Configurado

Você já fez a parte mais importante no Hostinger:

```
Tipo: A
Name: app
Apontado para: IP_DA_VPS (seu IP público)
TTL: 14400
```

**Status**: ✓ Propagação completa (pode levar até 24h, mas geralmente minutos)

Verifique se propagou:
```bash
nslookup app.anasstore.com.br
# ou
dig app.anasstore.com.br
```

## ✓ Caddy já está Configurado

Seu `Caddyfile` já faz o roteamento automático:

```caddyfile
{$APP_DOMAIN} {
  encode zstd gzip
  reverse_proxy frontend:80
}
```

**O que acontece**:
1. Caddy lê a variável `APP_DOMAIN` do `.env`
2. Cria automaticamente certificado HTTPS (Let's Encrypt)
3. Redireciona tráfego para o container `frontend` na porta 80
4. Frontend (nginx) redireciona `/api/*` para backend na network interna

## 🚀 Na sua VPS - Passo a Passo

### 1. Arquivo `.env` com Subdomínio

```bash
# Em /opt/apps/anasstoreapp/.env

APP_DOMAIN=app.anasstore.com.br
PasswordReset__BaseUrl=https://app.anasstore.com.br
VITE_API_BASE_URL=/api
```

### 2. Firewall - Liberar Portas

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### 3. Iniciar Aplicação com Compose

```bash
cd /opt/apps/anasstoreapp

# Com ambos os arquivos (dev + prod)
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verificar
docker compose ps
```

### 4. Verificar Status dos Containers

```bash
# Ver todos rodando
docker compose ps

# Ver logs em tempo real
docker compose logs -f caddy
docker compose logs -f frontend
docker compose logs -f backend

# Verificar health check
docker compose exec caddy curl -I http://frontend:80/
```

## 🔍 Fluxo de Requisição

```
Navegador
    ↓ https://app.anasstore.com.br
    ↓ (DNS resolve para IP_DA_VPS)
    ↓
┌─ VPS (IP_DA_VPS:443) ─────────┐
│                                │
│  Caddy (container)             │
│  • Escuta: 80, 443             │
│  • Domain: app.anasstore.com.br│
│  • Gera certificado HTTPS auto │
│  • Reverse proxy → frontend    │
│                 │              │
│                 ↓              │
│  Frontend (container nginx)    │
│  • Escuta: 80 (interno)        │
│  • Serve: /usr/share/nginx/html│
│  • Route: /api/* → backend:8080│
│                 │              │
│                 ↓              │
│  Backend (container)           │
│  • ASP.NET Core                │
│  • Escuta: 8080 (interno)      │
│  • Conecta: DB (container)     │
│                                │
└────────────────────────────────┘
```

## ✅ Teste de Acesso

```bash
# No seu computador local, após DNS propagar:

# 1. Verificar DNS
nslookup app.anasstore.com.br

# 2. Testar HTTPS
curl -I https://app.anasstore.com.br

# 3. Testar no navegador
# Acesse: https://app.anasstore.com.br

# 4. Testar API
curl https://app.anasstore.com.br/api/health
```

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Timed out" / "Conexão recusada" | Firewall bloqueando 80/443. Execute `sudo ufw allow 80/tcp` e `sudo ufw allow 443/tcp` |
| "ERR_NAME_NOT_RESOLVED" | DNS ainda não propagou. Aguarde 24h ou verifique no Hostinger |
| "NET::ERR_CERT_AUTHORITY_INVALID" | Caddy ainda gerando certificado. Aguarde 1-2 min e recarregue |
| "Connection refused" | Containers não iniciaram. Execute `docker compose ps` e `docker compose logs caddy` |
| "502 Bad Gateway" | Frontend/Backend offline. Check: `docker compose logs frontend backend` |
| "VITE_API_BASE_URL não funciona" | Frontend precisa ser rebuildo. `docker compose pull && docker compose up -d` |

## 📝 Variáveis Importantes no `.env`

```env
# OBRIGATÓRIO - Caddy usa isso
APP_DOMAIN=app.anasstore.com.br

# Links de reset de senha
PasswordReset__BaseUrl=https://app.anasstore.com.br
PasswordReset__Path=/reset-password

# Frontend - por padrão usa /api (relativo)
VITE_API_BASE_URL=/api

# Se precisar API absoluta (raro):
# VITE_API_BASE_URL=https://app.anasstore.com.br/api
```

## 🔐 Certificado HTTPS

O Caddy gera automaticamente via Let's Encrypt quando:
- `APP_DOMAIN` está configurado
- Porta 443 está aberta
- DNS está propagado

**Renovação**: Automática a cada 60 dias (você não precisa fazer nada)

Verificar certificado:
```bash
docker compose exec caddy caddy list-certificates

# Ou no navegador:
# 1. Acesse https://app.anasstore.com.br
# 2. Clique no ícone de cadeado
# 3. Veja detalhes do certificado
```

## 🎯 Próximos Passos

1. ✓ DNS configurado (você já fez)
2. Aguarde propagação DNS (pode levar até 24h)
3. Configure `.env` com `APP_DOMAIN=app.anasstore.com.br`
4. Execute deploy com `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
5. Teste em https://app.anasstore.com.br

---

**Dúvidas?** Verifique logs com:
```bash
docker compose logs -f
```
