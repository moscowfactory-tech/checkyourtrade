// Модуль обработки ошибок для TradeAnalyzer
console.log('🛠️ Loading error handler module...');

// Функция для показа уведомлений с улучшенной обработкой
function showNotificationSafe(message, type = 'info', duration = 5000) {
    try {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Проверяем, существует ли функция showNotification
        if (typeof showNotification === 'function') {
            showNotification(message, type, duration);
        } else {
            // Создаем простое уведомление в интерфейсе
            createInlineNotification(message, type, duration);
        }
    } catch (error) {
        console.error('Error showing notification:', error);
        // Только для критических ошибок показываем alert
        if (type === 'error') {
            console.error('CRITICAL ERROR:', message);
        }
    }
}

// Функция для создания встроенного уведомления
function createInlineNotification(message, type = 'info', duration = 5000) {
    try {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.inline-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `inline-notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        
        // Устанавливаем цвет в зависимости от типа
        switch (type) {
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#000';
                break;
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }
        
        notification.textContent = message;
        
        // Добавляем обработчик клика для закрытия
        notification.addEventListener('click', () => {
            notification.remove();
        });
        
        // Добавляем в DOM
        document.body.appendChild(notification);
        
        // Автоматически удаляем через указанное время
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
        
    } catch (error) {
        console.error('Error creating inline notification:', error);
    }
}

// Функция для безопасной загрузки стратегий
async function safeLoadStrategies() {
    try {
        console.log('🔄 Safe loading strategies...');
        
        // Проверяем доступность Supabase
        if (!window.supabase) {
            console.warn('⚠️ Supabase client not available');
            showNotificationSafe('База данных недоступна. Используется автономный режим.', 'warning');
            return [];
        }
        
        // Проверяем соединение
        console.log('🔍 Testing database connection...');
        const connectionTest = await Promise.race([
            window.supabase.from('strategies').select('count').limit(1),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 10000))
        ]);
        
        if (connectionTest.error) {
            console.error('❌ Database connection error:', connectionTest.error);
            showNotificationSafe('Ошибка подключения к базе данных', 'error');
            return [];
        }
        
        // Загружаем стратегии
        console.log('📥 Loading strategies from database...');
        const { data: strategies, error } = await Promise.race([
            window.supabase
                .from('strategies')
                .select('*')
                .order('created_at', { ascending: false }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Load timeout')), 15000))
        ]);
        
        if (error) {
            console.error('❌ Error loading strategies:', error);
            showNotificationSafe('Ошибка загрузки стратегий из базы данных', 'error');
            return [];
        }
        
        if (!strategies || strategies.length === 0) {
            console.log('📝 No strategies found in database');
            // Не показываем уведомление для пустой базы - это нормально
            return [];
        }
        
        console.log(`✅ Successfully loaded ${strategies.length} strategies`);
        // Показываем успешное уведомление только если есть стратегии
        if (strategies.length > 0) {
            showNotificationSafe(`Загружено ${strategies.length} стратегий`, 'success', 3000);
        }
        return strategies;
        
    } catch (error) {
        console.error('❌ Exception in safeLoadStrategies:', error);
        
        if (error.message === 'Connection timeout') {
            showNotificationSafe('Превышено время ожидания подключения к базе данных', 'error');
        } else if (error.message === 'Load timeout') {
            showNotificationSafe('Превышено время ожидания загрузки стратегий', 'error');
        } else {
            showNotificationSafe('Неожиданная ошибка при загрузке стратегий', 'error');
        }
        
        return [];
    }
}

// Функция для безопасного сохранения стратегии
async function safeSaveStrategy(strategyData) {
    try {
        console.log('💾 Safe saving strategy:', strategyData.name);
        
        // Проверяем доступность Supabase
        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            showNotificationSafe('База данных недоступна. Стратегия не может быть сохранена.', 'error');
            return null;
        }
        
        // Валидация данных
        if (!strategyData.name || !strategyData.name.trim()) {
            showNotificationSafe('Название стратегии не может быть пустым', 'error');
            return null;
        }
        
        if (!strategyData.fields || !Array.isArray(strategyData.fields) || strategyData.fields.length === 0) {
            showNotificationSafe('Стратегия должна содержать хотя бы одно основание', 'error');
            return null;
        }
        
        // Сохраняем стратегию с таймаутом
        const { data: savedStrategy, error } = await Promise.race([
            window.supabase
                .from('strategies')
                .insert({
                    name: strategyData.name.trim(),
                    description: strategyData.description ? strategyData.description.trim() : '',
                    fields: strategyData.fields
                })
                .select()
                .single(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Save timeout')), 10000))
        ]);
        
        if (error) {
            console.error('❌ Error saving strategy:', error);
            showNotificationSafe('Ошибка сохранения стратегии: ' + error.message, 'error');
            return null;
        }
        
        console.log('✅ Strategy saved successfully:', savedStrategy);
        showNotificationSafe('Стратегия успешно сохранена!', 'success');
        return savedStrategy;
        
    } catch (error) {
        console.error('❌ Exception in safeSaveStrategy:', error);
        
        if (error.message === 'Save timeout') {
            showNotificationSafe('Превышено время ожидания сохранения стратегии', 'error');
        } else {
            showNotificationSafe('Неожиданная ошибка при сохранении стратегии', 'error');
        }
        
        return null;
    }
}

// Функция для инициализации приложения с обработкой ошибок
async function safeInitializeApp() {
    try {
        console.log('🚀 Safe initializing TradeAnalyzer...');
        
        // Ждем инициализации Supabase
        let attempts = 0;
        const maxAttempts = 30; // 3 секунды
        
        while (!window.supabase && attempts < maxAttempts) {
            console.log(`⏳ Waiting for Supabase... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabase) {
            console.warn('⚠️ Supabase not available after waiting');
            showNotificationSafe('База данных недоступна. Приложение работает в автономном режиме.', 'warning', 4000);
        } else {
            console.log('✅ Supabase client is available');
        }
        
        // Загружаем стратегии
        const loadedStrategies = await safeLoadStrategies();
        
        // Обновляем глобальную переменную strategies
        if (typeof strategies !== 'undefined') {
            strategies.length = 0; // Очищаем массив
            strategies.push(...loadedStrategies); // Добавляем загруженные стратегии
        }
        
        // Обновляем интерфейс
        if (typeof renderStrategies === 'function') {
            renderStrategies();
        }
        
        if (typeof updateStrategySelect === 'function') {
            updateStrategySelect();
        }
        
        console.log('✅ App initialization completed');
        return true;
        
    } catch (error) {
        console.error('❌ Error in safeInitializeApp:', error);
        showNotificationSafe('Ошибка инициализации приложения', 'error');
        return false;
    }
}

// Экспорт функций
window.showNotificationSafe = showNotificationSafe;
window.safeLoadStrategies = safeLoadStrategies;
window.safeSaveStrategy = safeSaveStrategy;
window.safeInitializeApp = safeInitializeApp;

console.log('✅ Error handler module loaded');
console.log('Available functions:');
console.log('- showNotificationSafe(message, type, duration)');
console.log('- await safeLoadStrategies()');
console.log('- await safeSaveStrategy(strategyData)');
console.log('- await safeInitializeApp()');
