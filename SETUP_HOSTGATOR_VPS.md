# 🚀 Setup Certificado SSL/TLS em VPS Hostgator

## ✅ Configuração para sua VPS

O Caddyfile foi atualizado para usar **HTTP Challenge** - o método mais simples e recomendado para VPS.

Caddy automaticamente:
- Solicita certificado ao Let's Encrypt
- Valida via HTTP (porta 80)
- Instala certificado HTTPS
- Renova automaticamente

## 📋 Pré-requisitos

- ✅ Domínio: `app.anasstore.com.br`
- ✅ Porta 80 aberta (liberada no firewall da VPS)
- ✅ Porta 443 aberta (liberada no firewall da VPS)
- ✅ DNS apontando para IP da VPS

## 🔧 Verificar DNS

```bash
# Verifique se o domínio aponta para seu IP
nslookup app.anasstore.com.br
# ou
dig app.anasstore.com.br

# Resultado esperado: seu IP da VPS
```

## 🌐 Verificar Portas Abertas

Na Hostgator, verifique se as portas 80 e 443 estão abertas:

### Via cPanel (se tiver):
1. Acesse cPanel
2. Vá para "Security" → "Firewall"
3. Certifique-se que portas 80 e 443 estão **OPEN**

### Via SSH:
```bash
# Login na VPS
ssh seu_usuario@seu_ip_vps

# Teste porta 80
sudo nc -zv seu_ip 80

# Teste porta 443
sudo nc -zv seu_ip 443

# Resultado esperado: "succeeded!" ou "open"
```

## 📝 Arquivo .env para VPS

Crie um arquivo `.env` simplificado (sem credenciais AWS):

```bash
# Database
POSTGRES_DB=anasstore
POSTGRES_USER=anasstore
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
DB_CONNECTION=Host=db;Port=5432;Username=anasstore;Password=SUA_SENHA_FORTE_AQUI;Database=anasstore

# Domain
APP_DOMAIN=app.anasstore.com.br

# Backend
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
JwtSettings__SigningKey=CHANGE_ME_SUPER_SECRET_KEY_32_BYTES_MIN
JwtSettings__Issuer=Jcf.AnasStore
JwtSettings__Audience=Jcf.AnasStore.Client
JwtSettings__ExpirationMinutes=60
Database__AutoMigrate=false
Seed__EnableLookupSeed=false
Seed__EnableDefaultUsers=false

# Email
RESEND_APITOKEN=SUA_API_TOKEN_RESEND
Resend__ApiToken=SUA_API_TOKEN_RESEND
Resend__FromEmail=no-reply@anasstore.com.br
Resend__FromName=Ana's Store
PasswordReset__BaseUrl=https://app.anasstore.com.br
PasswordReset__Path=/reset-password

# Frontend
VITE_API_BASE_URL=/api
```

## 🚀 Deploy na VPS

### 1. Clone o repositório
```bash
git clone seu_repositorio seu_pasta
cd seu_pasta
```

### 2. Configure o .env
```bash
cp .env.example .env
# Edite .env com seus valores
nano .env
```

### 3. Inicie os containers
```bash
# Com compose file de produção
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Ou se preferir simples
docker compose up -d
```

### 4. Monitore os logs
```bash
# Ver logs do Caddy (certificado)
docker logs anasstore-caddy -f

# Ver logs do backend
docker logs anasstore-backend -f

# Ver logs do frontend
docker logs anasstore-frontend -f
```

## ✨ Esperado nos Logs

Quando Caddy obtém certificado, você verá:
```
[INFO] [acme.http.challenge] starting listener
[INFO] [acme] Obtaining certificate for app.anasstore.com.br
[INFO] [acme] Certificate obtained successfully
[INFO] [caddy] completed initial configuration
```

## ✅ Testar HTTPS

```bash
# Deve retornar certificado válido
curl -I https://app.anasstore.com.br

# Ou abra no navegador:
# https://app.anasstore.com.br
```

## 🔍 Verificar Certificado SSL

```bash
# Ver detalhes do certificado
openssl s_client -connect app.anasstore.com.br:443 -showcerts

# Ver data de expiração
echo | openssl s_client -connect app.anasstore.com.br:443 | openssl x509 -noout -dates
```

## 📊 SSL Labs Test

Teste sua configuração:
```
https://www.ssllabs.com/ssltest/analyze.html?d=app.anasstore.com.br
```

Você deve obter **Grade A** ✅

## 🔄 Renovação Automática

Let's Encrypt válido por 90 dias. Caddy renova automaticamente aos 60 dias.

Você não precisa fazer nada - tudo é automático! 🎉

## ⚠️ Troubleshooting

### Erro: "Failed to obtain certificate"
**Solução**: Verifique se:
- Porta 80 está aberta
- DNS está propagado: `nslookup app.anasstore.com.br`
- Firewall não está bloqueando

### Erro: "Connection refused"
**Solução**: Reinicie Caddy
```bash
docker restart anasstore-caddy
```

### Certificado antigo persiste
**Solução**: Limpe cache do Caddy
```bash
docker exec anasstore-caddy rm -rf /data/caddy
docker restart anasstore-caddy
```

## 📞 Contato Hostgator Support

Se tiver problemas com firewall/portas:
1. Abra ticket no painel Hostgator
2. Peça para liberar portas 80 e 443
3. Confirme se o domínio aponta para o IP correto

## 🎯 Checklist Final

- [ ] Domínio aponta para IP da VPS
- [ ] Portas 80 e 443 abertas
- [ ] .env configurado com valores corretos
- [ ] Docker Compose iniciado: `docker compose up -d`
- [ ] Logs mostram certificado obtido
- [ ] HTTPS funciona: `https://app.anasstore.com.br`
- [ ] Sem erros de certificado no navegador

**Tudo pronto!** 🎉 Seu app terá certificado SSL válido automático!
