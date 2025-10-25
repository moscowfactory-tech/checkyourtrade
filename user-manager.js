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
        console.log('📱 window.Telegram exists:', !!window.Telegram);
        console.log('📱 window.Telegram.WebApp exists:', !!(window.Telegram && window.Telegram.WebApp));
        
        if (window.Telegram && window.Telegram.WebApp) {
            console.log('📱 Telegram WebApp available');
            console.log('📱 initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
            
            const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
            console.log('📱 Telegram user from initDataUnsafe:', tgUser);
            
            if (tgUser && tgUser.id) {
                this.currentUser = {
                    telegram_id: String(tgUser.id), // Преобразуем в строку
                    first_name: tgUser.first_name || '',
                    last_name: tgUser.last_name || '',
                    username: tgUser.username || '',
                    type: 'telegram'
                };
                
                console.log('✅ Telegram user data:', this.currentUser);
                
                // Создаем или находим пользователя в БД
                try {
                    await this.ensureUserInDatabase();
                    console.log('✅ User ensured in database');
                } catch (error) {
                    console.error('❌ Failed to ensure user in database:', error);
                    alert('Ошибка подключения к серверу. Проверьте интернет-соединение.');
                }
                return;
            }
        }
        
        // Fallback для Telegram WebApp без данных пользователя
        console.warn('⚠️ No Telegram user data available');
        console.warn('⚠️ Using fallback: creating unique ID based on device');
        
        // Создаем уникальный ID на основе устройства
        let deviceId = localStorage.getItem('device_telegram_id');
        if (!deviceId) {
            deviceId = String(Date.now() + Math.floor(Math.random() * 10000));
            localStorage.setItem('device_telegram_id', deviceId);
            console.log('📱 Created new device ID:', deviceId);
        }
        
        this.currentUser = {
            telegram_id: deviceId,
            first_name: 'Telegram User',
            username: 'tg_user_' + deviceId.substring(0, 6),
            type: 'telegram_fallback'
        };
        
        console.log('⚠️ Using fallback user:', this.currentUser);
        
        try {
            await this.ensureUserInDatabase();
            console.log('✅ Fallback user ensured in database');
        } catch (error) {
            console.error('❌ Failed to ensure fallback user:', error);
            alert('Ошибка подключения к серверу. Проверьте интернет-соединение.');
        }
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
        console.log('🔍 getTelegramId called, user:', user);
        const telegramId = user ? user.telegram_id : null;
        console.log('🔍 Returning telegram_id:', telegramId);
        return telegramId;
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

    // Создать или найти пользователя в БД (улучшенная версия)
    async ensureUserInDatabase() {
        console.log('💾 ENHANCED ensureUserInDatabase starting...');
        
        if (!window.supabase) {
            console.warn('⚠️ Supabase not available, skipping user creation');
            return false;
        }

        if (!this.currentUser || !this.currentUser.telegram_id) {
            console.error('❌ No current user or telegram_id available');
            return false;
        }

        console.log('💾 Ensuring user exists in database...');
        console.log('👤 Current user data:', this.currentUser);
        
        try {
            console.log('🔍 Step 1: Searching for existing user with telegram_id:', this.currentUser.telegram_id);
            
            // Проверяем, есть ли пользователь
            const { data: existingUsers, error: findError } = await window.supabase
                .from('users')
                .select('id, telegram_id, first_name')
                .eq('telegram_id', this.currentUser.telegram_id);
                
            console.log('🔍 Step 2: Database lookup result:', { 
                existingUsers, 
                findError,
                count: existingUsers?.length || 0 
            });

            if (findError) {
                console.error('❌ Database lookup error:', findError);
                return false;
            }

            if (existingUsers && existingUsers.length > 0) {
                const existingUser = existingUsers[0];
                console.log('✅ Step 3: User found in database:', existingUser);
                this.currentUser.uuid = existingUser.id;
                console.log('✅ Step 4: UUID assigned to user:', this.currentUser.uuid);
                // Зафиксируем регистрацию один раз, если ещё не фиксировали на этом устройстве
                this.trackRegistrationOnce();
                return true;
            } else {
                console.log('🆕 Step 3: No existing user found, creating new user...');
                
                const newUserData = {
                    telegram_id: this.currentUser.telegram_id,
                    username: this.currentUser.username || null,
                    first_name: this.currentUser.first_name || 'Telegram User',
                    last_name: this.currentUser.last_name || null
                };
                
                console.log('📝 Step 4: Creating user with data:', newUserData);
                
                // Создаем нового пользователя
                const { data: newUser, error: createError } = await window.supabase
                    .from('users')
                    .insert(newUserData)
                    .select('id')
                    .single();

                console.log('🔍 Step 5: Create result:', { newUser, createError });

                if (createError) {
                    console.error('❌ Error creating user:', createError);
                    // Если таблицы users нет или ошибка создания — хотя бы зафиксируем регистрацию один раз
                    this.trackRegistrationOnce();
                    return false;
                } else {
                    console.log('✅ Step 6: User created successfully:', newUser);
                    this.currentUser.uuid = newUser.id;
                    console.log('✅ Step 7: UUID assigned:', this.currentUser.uuid);
                    // Записываем событие регистрации
                    this.trackRegistrationOnce();
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Exception in ensureUserInDatabase:', error);
            // В случае исключения также попытаемся зафиксировать регистрацию один раз
            this.trackRegistrationOnce();
            return false;
        }
    }

    // Записать событие регистрации один раз на устройство/пользователя
    async trackRegistrationOnce() {
        try {
            const key = `reg_tracked_${this.currentUser?.telegram_id}`;
            if (localStorage.getItem(key)) return;
            localStorage.setItem(key, '1');
            const payload = {
                event_name: 'user_registered',
                user_id: this.currentUser?.uuid || null,
                session_id: 'registration_' + Date.now(),
                timestamp: new Date().toISOString(),
                properties: {
                    telegram_id: this.currentUser?.telegram_id,
                    source: this.currentUser?.type || 'unknown'
                }
            };
            if (window.supabase && typeof window.supabase.from === 'function') {
                await window.supabase.from('user_events').insert(payload);
                console.log('📊 user_registered event inserted via Supabase');
                return;
            }
            if (window.analytics && typeof window.analytics.trackEvent === 'function') {
                await window.analytics.trackEvent('user_registered', payload.properties);
                console.log('📊 user_registered event tracked via Analytics');
            }
        } catch (e) {
            console.warn('Registration tracking failed:', e);
        }
    }
}

// Создаем глобальный экземпляр
window.userManager = new UnifiedUserManager();

console.log('👤 Unified User Manager loaded');
