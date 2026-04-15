# Guia Rápido: Deploy Automático em Produção

## TL;DR - Setup em 5 Minutos

### No GitHub
1. Vá para **Settings → Secrets and variables → Actions**
2. Adicione os secrets (já feito! ✓):
   - `HOST` - IP/domínio do seu VPS
   - `USERNAME` - usuário SSH
   - `SSH_KEY` - chave privada SSH

### No VPS Hostinger

```bash
# 0. DNS (no painel do domínio)
# Crie/ajuste um registro A:
#   app  -> IP_PÚBLICO_DA_SUA_VPS
# Aguarde propagação (normalmente minutos, pode levar horas)

# 1. Conectar ao VPS
ssh -i /caminho/chave USERNAME@HOST

# 2. Instalar Docker (se não tiver)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Criar diretório e clonar repo
sudo mkdir -p /opt/apps/anasstoreapp
sudo chown $USER:$USER /opt/apps/anasstoreapp
cd /opt/apps/anasstoreapp
git clone -b production https://github.com/seu-usuario/seu-repo.git .

# 4. Configurar ambiente
cp .env.example .env
nano .env  # Editar com suas variáveis

# IMPORTANTE:
# - APP_DOMAIN=app.anasstore.com.br
# - PasswordReset__BaseUrl=https://app.anasstore.com.br

# 4.1 Liberar portas no firewall (se usar ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 5. Login no GHCR (Docker Registry)
docker login ghcr.io -u seu-usuario-github -p seu-token-github

# 6. Configurar SSH para GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 7. Dar permissão de execução ao script
chmod +x scripts/deploy.sh

# 8. Teste o deploy manualmente
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose ps  # Verificar status
```

## Fluxo de Deploy Automático

```
Você faz: git push origin production
    ↓
GitHub Actions detecta
    ↓
Build Docker images
    ↓
Push para GHCR (ghcr.io/seu-usuario/...)
    ↓
SSH para VPS
    ↓
git pull + docker compose (prod) pull + docker compose (prod) up -d
    ↓
✓ Live!
```

## Verificar Status

```bash
# No servidor VPS
cd /opt/apps/anasstoreapp

# Ver containers rodando
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs de deploy
tail -f /var/log/anasstore-deploy.log
```

## Variáveis de Ambiente Importantes

Edite no `.env`:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SenhaForte123!
DB_CONNECTION=Server=db;Port=5432;Database=anasstoreapp_prod;User Id=postgres;Password=SenhaForte123!;

# ASP.NET
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

# JWT
JwtSettings__SigningKey=SuaChaveSecretaComMais32Caracteres
JwtSettings__Issuer=anasstore
JwtSettings__Audience=anasstore-app
JwtSettings__ExpirationMinutes=1440

# Frontend API
VITE_API_BASE_URL=https://seu-dominio.com/api

# Reverse proxy (Caddy)
APP_DOMAIN=app.anasstore.com.br
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| "Permission denied (publickey)" | Verifique SSH key no GitHub Actions secrets |
| "docker: command not found" | Instale Docker (passo 2) |
| "Image not found" | Verifique `docker login ghcr.io` no VPS |
| "POSTGRES_PASSWORD not set" | Certifique-se que `.env` existe e tem as variáveis |
| "Connection refused" | Aguarde 10s para containers iniciarem, veja `docker compose logs` |

## Documentação Completa

Para documentação detalhada, veja: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Próximas Melhorias

- [ ] Backup automático do banco de dados
- [ ] Monitoramento com Prometheus/Grafana
- [ ] Backup automático do banco de dados
- [ ] Monitoramento com Prometheus/Grafana
- [ ] CI/CD com testes automáticos
