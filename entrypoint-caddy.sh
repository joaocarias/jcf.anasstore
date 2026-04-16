#!/bin/sh
# Substitui variáveis de ambiente no Caddyfile e inicia Caddy

if [ -z "$APP_DOMAIN" ]; then
  echo "ERROR: APP_DOMAIN não foi definido!"
  exit 1
fi

# Fazer backup do original
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak

# Substituir variável de ambiente
sed "s/{\$APP_DOMAIN}/$APP_DOMAIN/g" /etc/caddy/Caddyfile.bak > /etc/caddy/Caddyfile.tmp
mv /etc/caddy/Caddyfile.tmp /etc/caddy/Caddyfile

echo "APP_DOMAIN expandido para: $APP_DOMAIN"
cat /etc/caddy/Caddyfile

# Iniciar Caddy
exec caddy run --config /etc/caddy/Caddyfile
