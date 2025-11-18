#!/bin/bash

# Script para verificar el estado del despliegue de YEGA/Manda2
# Uso: ./check-status.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     YEGA/Manda2 - Verificación de Estado del Despliegue   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar servicio
check_service() {
    local name=$1
    local command=$2
    
    echo -n "Verificando $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FALLO${NC}"
        return 1
    fi
}

# Verificar MongoDB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. BASE DE DATOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "MongoDB" "systemctl is-active mongod"
check_service "Conexión MongoDB" "mongosh --quiet --eval 'db.adminCommand(\"ping\")'"

# Contar documentos
echo -n "Usuarios en DB: "
mongosh --quiet manda2 --eval "db.usuarios.countDocuments()" 2>/dev/null || echo "0"
echo -n "Tiendas en DB: "
mongosh --quiet manda2 --eval "db.tiendas.countDocuments()" 2>/dev/null || echo "0"
echo -n "Productos en DB: "
mongosh --quiet manda2 --eval "db.productos.countDocuments()" 2>/dev/null || echo "0"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. BACKEND (Node.js + PM2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "PM2 Backend" "pm2 describe manda2-backend | grep -q 'online'"
check_service "Backend Puerto 5000" "curl -sf http://localhost:5000/api/health"

# Mostrar info del backend
if pm2 describe manda2-backend > /dev/null 2>&1; then
    echo -n "Estado PM2: "
    pm2 describe manda2-backend | grep "status" | head -1 | awk '{print $4}'
    echo -n "Uptime: "
    pm2 describe manda2-backend | grep "uptime" | head -1 | awk '{print $3}'
    echo -n "Reinicios: "
    pm2 describe manda2-backend | grep "restarts" | head -1 | awk '{print $3}'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. FRONTEND (Caddy)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "Caddy Puerto 80" "sudo lsof -i :80 | grep -q caddy"
check_service "Frontend Accesible" "curl -sf -o /dev/null http://localhost:80/"
check_service "API via Caddy" "curl -sf http://localhost:80/api/health"

# Mostrar PID de Caddy
CADDY_PID=$(sudo lsof -ti :80 | head -1)
if [ ! -z "$CADDY_PID" ]; then
    echo "PID de Caddy: $CADDY_PID"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. CONECTIVIDAD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# IP Local
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "IP Local: $LOCAL_IP"

# Verificar acceso local
check_service "Frontend Local" "curl -sf -o /dev/null http://$LOCAL_IP/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. URLS DE ACCESO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend:"
echo "  - http://localhost"
echo "  - http://$LOCAL_IP"
echo ""
echo "API Backend:"
echo "  - http://localhost/api"
echo "  - http://$LOCAL_IP/api"
echo ""
echo "Health Check:"
echo "  - http://localhost/api/health"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. CREDENCIALES DE PRUEBA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: admin@manda2.com"
echo "Password: admin123"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. COMANDOS ÚTILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Ver logs backend:    pm2 logs manda2-backend"
echo "Ver logs Caddy:      tail -f /tmp/caddy.log"
echo "Reiniciar backend:   pm2 restart manda2-backend"
echo "Estado PM2:          pm2 status"
echo "Monitor PM2:         pm2 monit"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Verificación Completada                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
