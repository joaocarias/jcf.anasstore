#!/bin/bash

# Deploy script para Ana's Store
# Este script é executado no servidor VPS

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
DEPLOY_DIR="/opt/apps/anasstoreapp"
LOG_FILE="/var/log/anasstore-deploy.log"
BACKUP_DIR="/opt/apps/anasstoreapp-backups"

# Funções
log_info() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar se temos os direitos necessários
if [ ! -w "$DEPLOY_DIR" ]; then
    log_error "Sem permissão de escrita em $DEPLOY_DIR"
    exit 1
fi

log_info "Iniciando deploy do Ana's Store..."

# Compose files de producao (garante uso do docker-compose.prod.yml e do .env)
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
ENV_FILE=(--env-file .env)

# 1. Backup do estado atual
log_info "Fazendo backup do docker-compose.yml..."
mkdir -p "$BACKUP_DIR"
cp "$DEPLOY_DIR/docker-compose.yml" "$BACKUP_DIR/docker-compose.$(date +%s).yml"
if [ -f "$DEPLOY_DIR/docker-compose.prod.yml" ]; then
    cp "$DEPLOY_DIR/docker-compose.prod.yml" "$BACKUP_DIR/docker-compose.prod.$(date +%s).yml"
fi

# 2. Atualizar repositório
log_info "Atualizando repositório git..."
cd "$DEPLOY_DIR"
git fetch origin
git checkout production
git pull origin production

# 3. Puxar novas imagens Docker
log_info "Puxando imagens Docker atualizadas..."
docker compose "${ENV_FILE[@]}" "${COMPOSE_FILES[@]}" pull || {
    log_error "Falha ao fazer pull das imagens Docker"
    exit 1
}

# 4. Parar containers existentes
log_info "Parando containers..."
docker compose "${ENV_FILE[@]}" "${COMPOSE_FILES[@]}" down

# 5. Iniciar novos containers
log_info "Iniciando novos containers..."
docker compose "${ENV_FILE[@]}" "${COMPOSE_FILES[@]}" up -d || {
    log_error "Falha ao iniciar containers"
    exit 1
}

# 6. Aguardar serviços ficarem prontos
log_info "Aguardando serviços ficarem prontos..."
sleep 10

# 7. Verificar health do backend
log_info "Verificando saúde da aplicação..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5117/health || echo "000")

if [ "$BACKEND_HEALTH" -eq 200 ]; then
    log_info "✓ Backend está saudável"
else
    log_warning "Backend health check retornou: $BACKEND_HEALTH"
fi

# 8. Limpeza de imagens antigas
log_info "Limpando imagens Docker antigas..."
docker image prune -f --filter "until=72h"

log_info "✓ Deploy concluído com sucesso!"
log_info "Resumo: use o domínio configurado (APP_DOMAIN) via HTTPS. Debug local: Frontend http://localhost:5173, Backend http://localhost:5117"

exit 0
