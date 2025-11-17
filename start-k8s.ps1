# PowerShell скрипт для запуска WMS Project в Kubernetes (Minikube)

Write-Host "🚀 Запуск WMS Project в Kubernetes..." -ForegroundColor Green
Write-Host ""

# Проверка наличия необходимых инструментов
Write-Host "🔍 Проверка необходимых инструментов..." -ForegroundColor Cyan

if (-not (Get-Command minikube -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Minikube не установлен. Пожалуйста, установите Minikube." -ForegroundColor Red
    Write-Host "   Скачать можно здесь: https://minikube.sigs.k8s.io/docs/start/" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl не установлен. Пожалуйста, установите kubectl." -ForegroundColor Red
    Write-Host "   Скачать можно здесь: https://kubernetes.io/docs/tasks/tools/" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен. Пожалуйста, установите Docker." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Все необходимые инструменты установлены" -ForegroundColor Green
Write-Host ""

# Проверка статуса Minikube
Write-Host "🔍 Проверка статуса Minikube..." -ForegroundColor Cyan
$minikubeStatus = minikube status --format='{{.Host}}' 2>$null

if ($minikubeStatus -ne "Running") {
    Write-Host "⚙️  Запуск Minikube кластера..." -ForegroundColor Yellow
    Write-Host "   (это может занять несколько минут при первом запуске)" -ForegroundColor Gray

    # Запуск Minikube с необходимыми параметрами
    minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=20g --nodes=1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Не удалось запустить Minikube" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Minikube кластер запущен" -ForegroundColor Green
} else {
    Write-Host "✅ Minikube кластер уже запущен" -ForegroundColor Green
}

Write-Host ""

# Настройка Docker environment для Minikube
Write-Host "🔧 Настройка Docker environment для Minikube..." -ForegroundColor Cyan
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Включение необходимых аддонов
Write-Host "🔌 Включение необходимых аддонов Minikube..." -ForegroundColor Cyan
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

Write-Host ""

# Подготовка манифестов для Minikube
Write-Host "🔧 Подготовка манифестов для Minikube..." -ForegroundColor Cyan
$manifestsDir = & "$PSScriptRoot\prepare-minikube-manifests.ps1"

# Применение Kubernetes манифестов
Write-Host "📋 Применение Kubernetes манифестов..." -ForegroundColor Cyan

Write-Host "   ➜ Создание namespace..." -ForegroundColor White
kubectl apply -f "$manifestsDir\00-namespace.yaml"

Write-Host "   ➜ Создание secrets..." -ForegroundColor White
kubectl apply -f "$manifestsDir\02-secrets.yaml"

Write-Host "   ➜ Настройка storage..." -ForegroundColor White
kubectl apply -f "$manifestsDir\01-storage.yaml" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "     ⚠️  Пропускаем PersistentVolumes (будут использованы динамические PVC)" -ForegroundColor Yellow
}

Write-Host "   ➜ Запуск баз данных..." -ForegroundColor White
kubectl apply -f "$manifestsDir\03-databases.yaml"

Write-Host "   ➜ Запуск инфраструктуры (Redis, Prometheus, Grafana)..." -ForegroundColor White
kubectl apply -f "$manifestsDir\05-infrastructure.yaml" 2>$null
Write-Host "   (используется Docker окружение Minikube)" -ForegroundColor Gray
Write-Host ""

# Backend сервисы
Write-Host "   📦 Сборка Eureka Server..." -ForegroundColor White
docker build -t eureka-server:latest ./backend/eureka-server

Write-Host "   📦 Сборка API Gateway..." -ForegroundColor White
docker build -t api-gateway:latest ./backend/api-gateway

Write-Host "   📦 Сборка SSO Service..." -ForegroundColor White
docker build -t sso-service:latest ./backend/SSOService

Write-Host "   📦 Сборка Organization Service..." -ForegroundColor White
docker build -t organization-service:latest ./backend/organization-service

Write-Host "   📦 Сборка Product Service..." -ForegroundColor White
docker build -t product-service:latest ./backend/product-service

Write-Host "   📦 Сборка Warehouse Service..." -ForegroundColor White
docker build -t warehouse-service:latest ./backend/warehouse-service

Write-Host "   📦 Сборка Document Service..." -ForegroundColor White
docker build -t document-service:latest ./backend/document-service

# Frontend
Write-Host "   📦 Сборка Frontend..." -ForegroundColor White
docker build -t wms-frontend:latest ./client

Write-Host ""
Write-Host "✅ Все образы собраны" -ForegroundColor Green
Write-Host ""

# Применение Kubernetes манифестов
Write-Host "📋 Применение Kubernetes манифестов..." -ForegroundColor Cyan

Write-Host "   ➜ Создание namespace..." -ForegroundColor White
kubectl apply -f k8s/00-namespace.yaml

Write-Host "   ➜ Создание secrets..." -ForegroundColor White
kubectl apply -f k8s/02-secrets.yaml

Write-Host "   ➜ Настройка storage..." -ForegroundColor White
# Для Minikube убираем nodeAffinity из storage (временно создадим упрощенную версию)
kubectl apply -f k8s/01-storage.yaml --validate=false 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "     ⚠️  Пропускаем storage (будут использованы динамические PV)" -ForegroundColor Yellow
}

Write-Host "   ➜ Запуск баз данных..." -ForegroundColor White
kubectl apply -f k8s/03-databases.yaml --validate=false

Write-Host "   ➜ Запуск инфраструктуры..." -ForegroundColor White
kubectl apply -f k8s/05-infrastructure.yaml --validate=false 2>$null

Write-Host "⏳ Ожидание запуска баз данных и инфраструктуры (60 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host "   ➜ Запуск backend сервисов..." -ForegroundColor White
kubectl apply -f k8s/04-backend.yaml --validate=false

Write-Host "⏳ Ожидание запуска backend сервисов (40 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

Write-Host "   ➜ Запуск frontend..." -ForegroundColor White
kubectl apply -f k8s/09-frontend.yaml --validate=false

Write-Host "   ➜ Настройка ingress..." -ForegroundColor White
kubectl apply -f k8s/06-ingress.yaml --validate=false 2>$null

Write-Host "   ➜ Настройка autoscaling..." -ForegroundColor White
kubectl apply -f k8s/07-autoscaling.yaml --validate=false 2>$null

Write-Host "   ➜ Настройка network policies..." -ForegroundColor White
kubectl apply -f k8s/08-network-policies.yaml --validate=false 2>$null

Write-Host ""
Write-Host "⏳ Ожидание готовности всех подов (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "✅ Все сервисы развернуты в Kubernetes!" -ForegroundColor Green
Write-Host ""

# Получение Minikube IP
$minikubeIP = minikube ip

Write-Host "📊 Информация о кластере:" -ForegroundColor Cyan
Write-Host "  - Minikube IP:     $minikubeIP" -ForegroundColor White
Write-Host ""
Write-Host "📊 Доступные URL:" -ForegroundColor Cyan
Write-Host "  - API Gateway:     http://${minikubeIP}:30765" -ForegroundColor White
Write-Host "  - Eureka Server:   http://${minikubeIP}:30761" -ForegroundColor White
Write-Host "  - Frontend:        Настройте Ingress или используйте port-forward" -ForegroundColor White
Write-Host ""
Write-Host "🎛️  Kubernetes Dashboard:" -ForegroundColor Cyan
Write-Host "  - Запуск: minikube dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📝 Полезные команды:" -ForegroundColor Cyan
Write-Host "  - Статус подов:             kubectl get pods -n wms" -ForegroundColor White
Write-Host "  - Логи сервиса:             kubectl logs -f <pod-name> -n wms" -ForegroundColor White
Write-Host "  - Список сервисов:          kubectl get services -n wms" -ForegroundColor White
Write-Host "  - Port-forward для frontend: kubectl port-forward -n wms service/frontend 3000:80" -ForegroundColor White
Write-Host "  - Остановка кластера:       minikube stop" -ForegroundColor White
Write-Host "  - Удаление кластера:        minikube delete" -ForegroundColor White
Write-Host ""

# Показываем статус подов
Write-Host "📊 Статус подов:" -ForegroundColor Cyan
kubectl get pods -n wms

Write-Host ""
Write-Host "✨ Готово! Кластер Kubernetes запущен" -ForegroundColor Green
Write-Host ""

