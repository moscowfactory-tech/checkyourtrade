// Telegram WebApp Authentication
let telegramUser = null;
let isTelegramWebApp = false;

// Инициализация Telegram WebApp
function initializeTelegramWebApp() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            isTelegramWebApp = true;
            const tg = window.Telegram.WebApp;
            
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const user = initializeTelegramWebApp();
    if (user) {
        // Скрываем кнопку входа и показываем кнопку выхода
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        if (loginBtn && logoutBtn) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
        }
    }
});

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

// Делаем функции глобально доступными
window.getTelegramUserId = getTelegramUserId;
window.getTelegramUserData = getTelegramUserData;
window.telegramUser = telegramUser;

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
// Функция обновления статистики ПОЛНОСТЬЮ УДАЛЕНА
// Используем только stats-counter.js для статистики

// Остальные функции Telegram
function getCurrentUserId() {
    // Возвращаем UUID пользователя для совместимости
    return telegramUser ? telegramUser.id : null;
}

// Экспорт функций в глобальную область
window.getTelegramUserId = getTelegramUserId;
window.getTelegramUserData = getTelegramUserData;
window.syncTelegramTheme = syncTelegramTheme;
window.sendToTelegram = sendToTelegram;
window.showTelegramMainButton = showTelegramMainButton;
window.hideTelegramMainButton = hideTelegramMainButton;
// window.updateUserStats удалена - используем stats-counter.js
