# ⚡ Quick Start - SSL/TLS na VPS Hostgator

## Resumido em 5 passos:

### 1️⃣ Verifique as portas (SSH na VPS)
```bash
# Login na sua VPS
ssh usuario@seu_ip_vps

# Teste se portas estão abertas
sudo nc -zv seu_ip 80
sudo nc -zv seu_ip 443
# Resultado: "succeeded!" ✅
```

### 2️⃣ Clone o projeto
```bash
git clone seu_repositorio
cd seu_repositorio
```

### 3️⃣ Configure .env
```bash
# Copie e edite
cp .env.example .env
nano .env

# Mude estes valores:
POSTGRES_PASSWORD=sua_senha_forte
JwtSettings__SigningKey=sua_chave_secreta_32_bytes
RESEND_APITOKEN=seu_token_resend
```

### 4️⃣ Inicie os containers
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 5️⃣ Verifique certificado
```bash
# Aguarde ~1 minuto
docker logs anasstore-caddy

# Procure por: "Certificate obtained successfully" ✅
```

## ✅ Teste final
```bash
# No navegador ou curl:
curl https://app.anasstore.com.br

# Sem erros de certificado! 🎉
```

---

## ⚠️ Se der erro:

```bash
# Ver logs detalhados
docker logs anasstore-caddy -f

# Reiniciar Caddy
docker restart anasstore-caddy

# Limpar cache certificado
docker exec anasstore-caddy rm -rf /data/caddy
docker restart anasstore-caddy
```

## 🔍 Verificar domínio
```bash
nslookup app.anasstore.com.br
# Deve retornar: seu IP da VPS
```

---

**Pronto!** Seu app terá HTTPS válido e automático! 🚀
