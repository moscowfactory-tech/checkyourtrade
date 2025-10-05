#!/bin/bash

# Скрипт для остановки локального сервера TradeAnalyzer
echo "🛑 Stopping TradeAnalyzer local server..."

# Находим и убиваем процессы на порту 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔍 Found server running on port 8000"
    kill -9 $(lsof -ti:8000) 2>/dev/null
    echo "✅ Server stopped successfully"
else
    echo "ℹ️  No server running on port 8000"
fi

# Также проверяем другие возможные порты
for port in 8080 3000 5000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "🔍 Found server running on port $port"
        kill -9 $(lsof -ti:$port) 2>/dev/null
        echo "✅ Server on port $port stopped"
    fi
done

echo "🏁 All servers stopped"
