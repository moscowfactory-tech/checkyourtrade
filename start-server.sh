#!/bin/bash

# Скрипт для запуска локального сервера TradeAnalyzer
echo "🚀 Starting TradeAnalyzer local server..."

# Переходим в директорию проекта
cd "$(dirname "$0")"

# Проверяем, свободен ли порт 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8000 is already in use. Trying to kill existing process..."
    kill -9 $(lsof -ti:8000) 2>/dev/null || true
    sleep 2
fi

# Проверяем доступность Python
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Using Python"
    python -m http.server 8000
else
    echo "❌ Python not found. Please install Python."
    exit 1
fi
