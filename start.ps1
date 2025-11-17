# PowerShell скрипт для запуска всего проекта WMS

Write-Host "🚀 WMS Project - Система управления складом" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Выберите способ запуска:" -ForegroundColor Cyan
Write-Host "  1. Docker Compose (рекомендуется для разработки)" -ForegroundColor White
Write-Host "  2. Kubernetes (Minikube) (для продакшн-подобного окружения)" -ForegroundColor White
Write-Host "  3. Выход" -ForegroundColor White
Write-Host ""
Write-Host "Введите номер (1-3): " -ForegroundColor Yellow -NoNewline

$choice = Read-Host

Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "▶️  Запуск через Docker Compose..." -ForegroundColor Cyan
        Write-Host ""
        & "$PSScriptRoot\start-docker.ps1"
    }
    "2" {
        Write-Host "▶️  Запуск через Kubernetes (Minikube)..." -ForegroundColor Cyan
        Write-Host ""
        & "$PSScriptRoot\start-k8s.ps1"
    }
    "3" {
        Write-Host "👋 До свидания!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "❌ Неверный выбор. Пожалуйста, выберите 1, 2 или 3." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Скрипт завершен" -ForegroundColor Green
Write-Host ""
exit 0

# ==================================================================
# СТАРЫЙ КОД DOCKER COMPOSE (перенесен в start-docker.ps1)
# ==================================================================
