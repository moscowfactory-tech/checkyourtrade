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
                    telegram_id: tgUser.id, // Основной ID для БД
                    first_name: tgUser.first_name || '',
                    last_name: tgUser.last_name || '',
                    username: tgUser.username || '',
                    type: 'telegram'
                };
                
                console.log('📱 Telegram user data:', this.currentUser);
                
                // Создаем или находим пользователя в БД
                await this.ensureUserInDatabase();
                return;
            }
        }
        
        // Fallback для Telegram WebApp без данных пользователя
        console.warn('⚠️ No Telegram user data, using test user');
        this.currentUser = {
            telegram_id: 123456789, // Тестовый ID
            first_name: 'Test User',
            username: 'test_user',
            type: 'telegram_test'
        };
        
        await this.ensureUserInDatabase();
    }

    // Инициализация пользователя браузера
    async initializeBrowserUser() {
        console.log('💻 Initializing browser user...');
        
        // Получаем или создаем telegram_id для браузерного пользователя
        let browserTelegramId = localStorage.getItem('browser_telegram_id');
        
        if (!browserTelegramId) {
            // Создаем уникальный telegram_id для браузера (отрицательное число)
            browserTelegramId = -Math.floor(Date.now() / 1000); // Отрицательный timestamp
            localStorage.setItem('browser_telegram_id', browserTelegramId);
            console.log('💻 Created new browser telegram_id:', browserTelegramId);
        } else {
            browserTelegramId = parseInt(browserTelegramId);
        }
        
        this.currentUser = {
            telegram_id: browserTelegramId,
            first_name: 'Browser User',
            username: 'browser_user',
            type: 'browser'
        };
        
        // Создаем или находим пользователя в БД
        await this.ensureUserInDatabase();
    }

    // Получить текущего пользователя
    getCurrentUser() {
        if (!this.isInitialized) {
            console.warn('⚠️ USER MANAGER: Not initialized yet');
            return null;
        }
        return this.currentUser;
    }

    // Получить ID пользователя для БД (UUID из таблицы users)
    getUserId() {
        const user = this.getCurrentUser();
        return user ? user.uuid : null;
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

    // Создать или найти пользователя в БД
    async ensureUserInDatabase() {
        if (!window.supabase) {
            console.warn('⚠️ Supabase not available, skipping user creation');
            return;
        }

        console.log('💾 Ensuring user exists in database...');
        
        try {
            // Проверяем, есть ли пользователь
            const { data: existingUser, error: findError } = await window.supabase
                .from('users')
                .select('id')
                .eq('telegram_id', this.currentUser.telegram_id)
                .single();

            if (existingUser) {
                console.log('✅ User found in database:', existingUser.id);
                this.currentUser.uuid = existingUser.id;
            } else {
                console.log('🆕 Creating new user in database...');
                
                // Создаем нового пользователя
                const { data: newUser, error: createError } = await window.supabase
                    .from('users')
                    .insert({
                        telegram_id: this.currentUser.telegram_id,
                        username: this.currentUser.username,
                        first_name: this.currentUser.first_name,
                        last_name: this.currentUser.last_name
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('❌ Error creating user:', createError);
                } else {
                    console.log('✅ User created:', newUser.id);
                    this.currentUser.uuid = newUser.id;
                }
            }
        } catch (error) {
            console.error('❌ Error in ensureUserInDatabase:', error);
        }
    }
}

// Создаем глобальный экземпляр
window.userManager = new UnifiedUserManager();

console.log('👤 Unified User Manager loaded');
