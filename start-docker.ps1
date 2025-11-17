# PowerShell скрипт для запуска WMS Project через Docker Compose

Write-Host "🚀 Запуск WMS Project через Docker Compose..." -ForegroundColor Green
Write-Host ""

# Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен. Пожалуйста, установите Docker." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose." -ForegroundColor Red
    exit 1
}

# Создаем сеть, если её нет
docker network create wms-network 2>$null

# Запуск основных сервисов
Write-Host "📦 Запуск основных сервисов (БД и Redis)..." -ForegroundColor Cyan
docker-compose up -d postgres-sso postgres-org postgres-warehouse postgres-product redis

# Ждем пока БД запустятся
Write-Host "⏳ Ожидание запуска баз данных (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Запуск Eureka Server
Write-Host "🔍 Запуск Eureka Server..." -ForegroundColor Cyan
docker-compose up -d eureka-server

# Ждем пока Eureka запустится (сокращено, т.к. нет health check)
Write-Host "⏳ Ожидание запуска Eureka Server (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Запуск остальных бэкенд-сервисов
Write-Host "🏗️  Запуск бэкенд-сервисов..." -ForegroundColor Cyan
docker-compose up -d sso-service organization-service product-service warehouse-service document-service

# Запуск API Gateway
Write-Host "🌐 Запуск API Gateway..." -ForegroundColor Cyan
docker-compose up -d api-gateway

# Ждем пока сервисы запустятся
Write-Host "⏳ Ожидание запуска сервисов (20 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Запуск Frontend
Write-Host "🎨 Запуск Frontend..." -ForegroundColor Cyan
docker-compose up -d client

Write-Host ""
Write-Host "✅ Все сервисы запущены!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Доступные URL:" -ForegroundColor Cyan
Write-Host "  - Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "  - API Gateway:     http://localhost:8765" -ForegroundColor White
Write-Host "  - Eureka Server:   http://localhost:8761" -ForegroundColor White
Write-Host ""
Write-Host "💾 Базы данных:" -ForegroundColor Cyan
Write-Host "  - SSO DB:          localhost:5432" -ForegroundColor White
Write-Host "  - Organization DB: localhost:5433" -ForegroundColor White
Write-Host "  - Warehouse DB:    localhost:5434" -ForegroundColor White
Write-Host "  - Product DB:      localhost:5435" -ForegroundColor White
Write-Host "  - Redis:           localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📝 Для просмотра логов: docker-compose logs -f [service-name]" -ForegroundColor Yellow
Write-Host "🛑 Для остановки: .\stop-docker.ps1 или docker-compose down" -ForegroundColor Yellow
Write-Host ""

# Показываем статус контейнеров
docker-compose ps

Write-Host ""
Write-Host "✨ Готово!" -ForegroundColor Green
Write-Host ""

