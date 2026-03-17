@echo off
echo Запуск webDNDBattles...
echo.

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
    echo.
)

REM Запуск API сервера в фоновом режиме
echo [1/2] Запуск API сервера на порту 3001...
start "webDNDBattles API" cmd /k "npm run server"
timeout /t 2 /nobreak > nul

REM Запуск frontend
echo [2/2] Запуск frontend на порту 5173...
start "webDNDBattles Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo webDNDBattles запущен!
echo.
echo Открой в браузере:
echo   Локально: https://localhost:5173
echo   В сети:   https://192.168.3.121:5173
echo ========================================
echo.
echo Для остановки закрой окна консоли
echo.
echo ⚠ При первом заходе браузер предупредит о сертификате
echo   — это нормально, нажми "Принять риск" или "Продолжить"
echo ========================================
echo.
pause
