// 👤 UNIFIED USER MANAGER - Единое управление пользователями
// Работает и в браузере, и в Telegram WebApp

class UnifiedUserManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    // Инициализация пользователя
    async initialize() {
        console.log('👤 USER MANAGER: Initializing...');
        
        try {
            // Определяем пользователя в зависимости от окружения
            if (IS_TELEGRAM_WEBAPP) {
                await this.initializeTelegramUser();
            } else {
                await this.initializeBrowserUser();
            }
            
            this.isInitialized = true;
            console.log('✅ USER MANAGER: User initialized:', this.currentUser);
            return this.currentUser;
        } catch (error) {
            console.error('❌ USER MANAGER: Initialization failed:', error);
            return null;
        }
    }

    // Инициализация пользователя Telegram WebApp
    async initializeTelegramUser() {
        console.log('📱 Initializing Telegram user...');
        
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            
            if (tgUser && tgUser.id) {
                this.currentUser = {
                    id: `tg_${tgUser.id}`, // Префикс для Telegram пользователей
                    telegram_id: tgUser.id,
                    first_name: tgUser.first_name || '',
                    last_name: tgUser.last_name || '',
                    username: tgUser.username || '',
                    type: 'telegram'
                };
                
                console.log('📱 Telegram user data:', this.currentUser);
                return;
            }
        }
        
        // Fallback для Telegram WebApp без данных пользователя
        console.warn('⚠️ No Telegram user data, using fallback');
        this.currentUser = {
            id: 'tg_anonymous',
            telegram_id: 0,
            first_name: 'Telegram User',
            username: 'telegram_user',
            type: 'telegram_anonymous'
        };
    }

    // Инициализация пользователя браузера
    async initializeBrowserUser() {
        console.log('💻 Initializing browser user...');
        
        // Получаем или создаем ID для браузерного пользователя
        let browserId = localStorage.getItem('browser_user_id');
        
        if (!browserId) {
            browserId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('browser_user_id', browserId);
            console.log('💻 Created new browser user ID:', browserId);
        }
        
        this.currentUser = {
            id: browserId,
            telegram_id: null,
            first_name: 'Browser User',
            username: 'browser_user',
            type: 'browser'
        };
    }

    // Получить текущего пользователя
    getCurrentUser() {
        if (!this.isInitialized) {
            console.warn('⚠️ USER MANAGER: Not initialized yet');
            return null;
        }
        return this.currentUser;
    }

    // Получить ID пользователя для БД
    getUserId() {
        const user = this.getCurrentUser();
        return user ? user.id : null;
    }

    // Получить Telegram ID (если есть)
    getTelegramId() {
        const user = this.getCurrentUser();
        return user ? user.telegram_id : null;
    }

    // Проверить, является ли пользователь Telegram пользователем
    isTelegramUser() {
        const user = this.getCurrentUser();
        return user && user.type.startsWith('telegram');
    }

    // Получить отображаемое имя пользователя
    getDisplayName() {
        const user = this.getCurrentUser();
        if (!user) return 'Unknown User';
        
        if (user.first_name) {
            return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
        }
        
        return user.username || 'User';
    }
}

// Создаем глобальный экземпляр
window.userManager = new UnifiedUserManager();

console.log('👤 Unified User Manager loaded');
