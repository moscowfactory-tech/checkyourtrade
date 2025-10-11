const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 8000;

// Telegram Bot Token (замените на ваш токен)
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// Создаем бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'Пользователь';
    
    console.log(`🚀 New user started bot: ${firstName} (ID: ${userId})`);
    
    const welcomeMessage = `
🎯 *Добро пожаловать в TradeAnalyzer!*

Привет, ${firstName}! 

TradeAnalyzer поможет вам:
📊 Создавать торговые стратегии
📈 Анализировать сделки
📋 Вести учет результатов

Нажмите кнопку ниже, чтобы открыть приложение:
    `;
    
    const keyboard = {
        inline_keyboard: [[
            {
                text: '🚀 Открыть TradeAnalyzer',
                web_app: {
                    url: `https://your-domain.com` // Замените на ваш домен
                }
            }
        ]]
    };
    
    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
📖 *Помощь по TradeAnalyzer*

*Основные функции:*
🏗️ *Конструктор стратегий* - создавайте свои торговые стратегии
📊 *Анализ сделок* - анализируйте результаты торговли
📈 *Статистика* - отслеживайте свой прогресс

*Команды бота:*
/start - Запуск приложения
/help - Эта справка
/app - Открыть приложение

Для работы с приложением используйте веб-интерфейс.
    `;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Обработчик команды /app
bot.onText(/\/app/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
        inline_keyboard: [[
            {
                text: '🚀 Открыть TradeAnalyzer',
                web_app: {
                    url: `https://your-domain.com` // Замените на ваш домен
                }
            }
        ]]
    };
    
    bot.sendMessage(chatId, '🚀 Нажмите кнопку для открытия приложения:', {
        reply_markup: keyboard
    });
});

// Обработчик всех остальных сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Игнорируем команды, которые уже обработаны
    if (text && text.startsWith('/')) {
        return;
    }
    
    // Отвечаем на обычные сообщения
    if (text) {
        bot.sendMessage(chatId, 
            '👋 Привет! Используйте /start для запуска TradeAnalyzer или /help для получения справки.'
        );
    }
});

// Обработка ошибок бота
bot.on('error', (error) => {
    console.error('❌ Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error);
});

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API маршрут для проверки статуса
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        bot_running: true
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Web App: http://localhost:${PORT}`);
    console.log(`🤖 Telegram Bot: ${BOT_TOKEN ? 'Connected' : 'Token not set'}`);
    
    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.log('⚠️  Please set BOT_TOKEN environment variable or update server.js');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down server...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Shutting down server...');
    bot.stopPolling();
    process.exit(0);
});
