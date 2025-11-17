# PowerShell скрипт для остановки WMS Project (Docker Compose)

Write-Host "🛑 Остановка WMS Project (Docker Compose)..." -ForegroundColor Yellow
Write-Host ""

# Проверка наличия Docker Compose
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose не установлен." -ForegroundColor Red
    exit 1
}

# Остановка всех контейнеров
Write-Host "⏸️  Остановка всех контейнеров..." -ForegroundColor Cyan
docker-compose down

Write-Host ""
Write-Host "✅ Все контейнеры остановлены" -ForegroundColor Green
Write-Host ""

# Предложение удалить volumes
Write-Host "❓ Хотите также удалить volumes (базы данных будут очищены)? (y/n): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y' -or $response -eq 'yes' -or $response -eq 'да') {
    Write-Host ""
    Write-Host "🗑️  Удаление volumes..." -ForegroundColor Yellow
    docker-compose down -v
    Write-Host "✅ Volumes удалены" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ℹ️  Volumes сохранены" -ForegroundColor Cyan
    Write-Host "   Для полного удаления выполните: docker-compose down -v" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Готово!" -ForegroundColor Green
Write-Host ""

