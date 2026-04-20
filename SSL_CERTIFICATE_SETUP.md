# Configuração de Certificado SSL/TLS com Let's Encrypt

## ✅ Configuração Atual

O Caddyfile foi atualizado para usar **Let's Encrypt** com validação via **Route53 (AWS)**.

## 🔧 Pré-requisitos

1. **Domínio válido**: `app.anasstore.com.br` (já configurado)
2. **DNS configurado**: O domínio deve apontar para o servidor onde Caddy está rodando
3. **Credenciais AWS**: Para validar o domínio via Route53

## 📋 Configuração das Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```bash
# AWS Credentials para Let's Encrypt (Route53 DNS Challenge)
AWS_ACCESS_KEY_ID=seu_access_key_aqui
AWS_SECRET_ACCESS_KEY=seu_secret_access_key_aqui

# Email para Let's Encrypt (para renovação automática)
# Já configurado no Caddyfile: admin@anasstore.com.br
```

## 🌐 Opções de Validação DNS

Você pode escolher entre diferentes provedores de DNS. Alguns exemplos:

### Route53 (AWS) - Recomendado
```
acme_dns route53 {
  aws_access_key_id {env.AWS_ACCESS_KEY_ID}
  aws_secret_access_key {env.AWS_SECRET_ACCESS_KEY}
  aws_region us-east-1
}
```

### Cloudflare
```
acme_dns cloudflare {
  api_token {env.CLOUDFLARE_API_TOKEN}
}
```

### DigitalOcean
```
acme_dns digitalocean {
  api_token {env.DIGITALOCEAN_API_TOKEN}
}
```

### Validação HTTP (simples, sem DNS)
Remova a configuração `acme_dns` e certifique-se que a porta 80 está aberta. Caddy fará validação automática via HTTP.

## 🚀 Como Implementar

### 1. Se usar Route53 (AWS):
```bash
# Instale AWS CLI
aws configure
# Configure suas credenciais

# Adicione ao .env:
AWS_ACCESS_KEY_ID=seu_key
AWS_SECRET_ACCESS_KEY=seu_secret
```

### 2. Se usar Cloudflare:
Atualize o Caddyfile:
```
acme_dns cloudflare {
  api_token {env.CLOUDFLARE_API_TOKEN}
}
```

### 3. Se usar validação HTTP simples:
```
{$APP_DOMAIN} {
  encode zstd gzip
  reverse_proxy frontend:80
}
```

## ✨ Benefícios

- ✅ Certificado válido confiável
- ✅ Renovação automática (a cada 60 dias)
- ✅ Sem avisos de segurança no navegador
- ✅ HSTS automático habilitado
- ✅ Grade A no SSL Labs

## 🔄 Reiniciar Caddy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart caddy
```

Caddy automaticamente:
1. Solicitará um certificado ao Let's Encrypt
2. Validará o domínio
3. Instalará o certificado
4. Renovará automaticamente antes de expirar

## 📊 Verificar Certificado

```bash
# Ver detalhes do certificado
openssl s_client -connect app.anasstore.com.br:443

# Verificar data de expiração
echo | openssl s_client -connect app.anasstore.com.br:443 | openssl x509 -noout -dates
```

## ⚠️ Troubleshooting

Se houver problemas:

1. **Porta 80/443 aberta**: Certifique-se que as portas estão acessíveis
2. **DNS propagado**: Aguarde DNS ser propagado globalmente (~24h)
3. **Rate limiting**: Let's Encrypt tem limites (50/domínio/semana). Aguarde se exceder.
4. **Logs Caddy**: `docker logs anasstore-caddy`

## 🎯 Próximos Passos

1. Configure as credenciais AWS (ou outro provedor DNS)
2. Reinicie o Caddy
3. Acesse `https://app.anasstore.com.br` no navegador
4. O certificado deve ser válido e sem avisos ✅
