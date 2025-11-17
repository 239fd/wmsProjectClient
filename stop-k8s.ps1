# PowerShell скрипт для остановки WMS Project в Kubernetes

Write-Host "🛑 Остановка WMS Project в Kubernetes..." -ForegroundColor Yellow
Write-Host ""

# Проверка наличия kubectl
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl не установлен." -ForegroundColor Red
    exit 1
}

# Удаление всех ресурсов из namespace wms
Write-Host "🗑️  Удаление всех ресурсов из namespace wms..." -ForegroundColor Cyan

# Проверяем наличие подготовленных манифестов
$manifestsDir = "$PSScriptRoot\k8s-minikube"
if (-not (Test-Path $manifestsDir)) {
    Write-Host "⚠️  Папка k8s-minikube не найдена, используем оригинальные манифесты" -ForegroundColor Yellow
    $manifestsDir = "$PSScriptRoot\k8s"
}

kubectl delete -f "$manifestsDir\08-network-policies.yaml" --ignore-not-found=true 2>$null
kubectl delete -f "$manifestsDir\07-autoscaling.yaml" --ignore-not-found=true 2>$null
kubectl delete -f "$manifestsDir\06-ingress.yaml" --ignore-not-found=true 2>$null
kubectl delete -f "$manifestsDir\09-frontend.yaml" --ignore-not-found=true
kubectl delete -f "$manifestsDir\04-backend.yaml" --ignore-not-found=true
kubectl delete -f "$manifestsDir\05-infrastructure.yaml" --ignore-not-found=true 2>$null
kubectl delete -f "$manifestsDir\03-databases.yaml" --ignore-not-found=true

Write-Host "⏳ Ожидание завершения удаления подов (20 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

kubectl delete -f "$manifestsDir\02-secrets.yaml" --ignore-not-found=true
kubectl delete -f "$manifestsDir\01-storage.yaml" --ignore-not-found=true 2>$null
kubectl delete -f "$manifestsDir\00-namespace.yaml" --ignore-not-found=true

# Очистка временной папки с манифестами
if (Test-Path "$PSScriptRoot\k8s-minikube") {
    Write-Host "🧹 Очистка временных манифестов..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "$PSScriptRoot\k8s-minikube"
}

Write-Host ""
Write-Host "✅ Все ресурсы удалены из Kubernetes" -ForegroundColor Green
Write-Host ""

# Предложение остановить Minikube
Write-Host "❓ Хотите также остановить Minikube кластер? (y/n): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y' -or $response -eq 'yes' -or $response -eq 'да') {
    Write-Host ""
    Write-Host "⏸️  Остановка Minikube кластера..." -ForegroundColor Yellow
    minikube stop
    Write-Host "✅ Minikube остановлен" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ℹ️  Minikube кластер продолжает работать" -ForegroundColor Cyan
    Write-Host "   Для остановки выполните: minikube stop" -ForegroundColor White
    Write-Host "   Для удаления кластера выполните: minikube delete" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Готово!" -ForegroundColor Green
Write-Host ""

