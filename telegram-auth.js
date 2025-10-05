// Telegram WebApp Authentication
let telegramUser = null;
let isTelegramWebApp = false;

// Инициализация Telegram WebApp
function initializeTelegramWebApp() {
    try {
        if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            isTelegramWebApp = true;
            
            // Настройка WebApp
            tg.ready();
            tg.expand();
            
            // Получение данных пользователя
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                telegramUser = tg.initDataUnsafe.user;
                console.log('Telegram user authenticated:', telegramUser);
                
                // Обновляем интерфейс с данными пользователя
                updateUserInterface(telegramUser);
                
                return telegramUser;
            } else {
                console.log('Telegram WebApp detected but no user data');
            }
        } else {
            console.log('Not running in Telegram WebApp environment');
        }
    } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
    }
    
    return null;
}

// Обновление интерфейса пользователя
function updateUserInterface(user) {
    const userName = document.getElementById('userName');
    const userStatus = document.getElementById('userStatus');
    const userAvatar = document.querySelector('.user-avatar i');
    
    if (userName && user) {
        // Отображаем имя пользователя или username
        let displayName = user.first_name;
        if (user.last_name) {
            displayName += ` ${user.last_name}`;
        }
        if (user.username) {
            displayName += ` (@${user.username})`;
        }
        userName.textContent = displayName;
    }
    
    if (userStatus) {
        userStatus.textContent = user ? 'Авторизован через Telegram' : 'Не авторизован';
    }
    
    // Можно добавить аватар пользователя если есть photo_url
    if (user && user.photo_url && userAvatar) {
        const img = document.createElement('img');
        img.src = user.photo_url;
        img.alt = 'User Avatar';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.borderRadius = '50%';
        userAvatar.parentNode.replaceChild(img, userAvatar);
    }
    
    // Обновляем статистику
    updateUserStats();
}

// Получение ID пользователя для базы данных
function getTelegramUserId() {
    return telegramUser ? telegramUser.id : null;
}

// Получение данных пользователя
function getTelegramUserData() {
    return telegramUser;
}

// Проверка, запущено ли в Telegram
function isRunningInTelegram() {
    return isTelegramWebApp && telegramUser !== null;
}

// Настройка темы в соответствии с Telegram
function syncTelegramTheme() {
    if (isTelegramWebApp && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Применяем цвета темы Telegram
        if (tg.colorScheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        
        // Применяем цвета Telegram
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
    }
}

// Отправка данных в Telegram (для уведомлений)
function sendToTelegram(message) {
    if (isTelegramWebApp && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.sendData(JSON.stringify(message));
        } catch (error) {
            console.error('Error sending data to Telegram:', error);
        }
    }
}

// Показать главную кнопку Telegram
function showTelegramMainButton(text, callback) {
    if (isTelegramWebApp && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.MainButton.setText(text);
        tg.MainButton.show();
        tg.MainButton.onClick(callback);
    }
}

// Скрыть главную кнопку Telegram
function hideTelegramMainButton() {
    if (isTelegramWebApp && window.Telegram.WebApp) {
        window.Telegram.WebApp.MainButton.hide();
    }
}

// Функция обновления статистики пользователя
function updateUserStats() {
    const analysesCountEl = document.getElementById('analysesCount');
    const strategiesCountEl = document.getElementById('strategiesCount');
    
    if (analysesCountEl && strategiesCountEl) {
        // Получаем количество анализов
        let analysesCount = 0;
        if (typeof window.savedAnalyses !== 'undefined' && Array.isArray(window.savedAnalyses)) {
            analysesCount = window.savedAnalyses.length;
        } else {
            // Пробуем получить из localStorage как fallback
            const localAnalyses = localStorage.getItem('savedAnalyses');
            if (localAnalyses) {
                try {
                    const parsed = JSON.parse(localAnalyses);
                    analysesCount = Array.isArray(parsed) ? parsed.length : 0;
                } catch (e) {
                    analysesCount = 0;
                }
            }
        }
        
        // Получаем количество стратегий
        let strategiesCount = 0;
        if (typeof window.strategies !== 'undefined' && Array.isArray(window.strategies)) {
            strategiesCount = window.strategies.length;
        } else {
            // Пробуем получить из localStorage как fallback
            const localStrategies = localStorage.getItem('strategies');
            if (localStrategies) {
                try {
                    const parsed = JSON.parse(localStrategies);
                    strategiesCount = Array.isArray(parsed) ? parsed.length : 0;
                } catch (e) {
                    strategiesCount = 0;
                }
            }
        }
        
        analysesCountEl.textContent = analysesCount;
        strategiesCountEl.textContent = strategiesCount;
    }
}

// Экспорт функций
window.initializeTelegramWebApp = initializeTelegramWebApp;
window.getTelegramUserId = getTelegramUserId;
window.getTelegramUserData = getTelegramUserData;
window.isRunningInTelegram = isRunningInTelegram;
window.syncTelegramTheme = syncTelegramTheme;
window.sendToTelegram = sendToTelegram;
window.showTelegramMainButton = showTelegramMainButton;
window.hideTelegramMainButton = hideTelegramMainButton;
window.updateUserStats = updateUserStats;
