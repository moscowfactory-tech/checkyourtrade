// ========================================
// APP INITIALIZER v1.0
// Централизованная инициализация приложения
// ========================================

class AppInitializer {
    constructor() {
        this.initSteps = [];
        this.isInitialized = false;
        this.initErrors = [];
        this.managers = {};
    }

    // Добавление шага инициализации
    addInitStep(name, asyncFunction, required = true) {
        this.initSteps.push({
            name,
            function: asyncFunction,
            required,
            completed: false,
            error: null
        });
    }

    // Основная функция инициализации
    async initialize() {
        console.log('🚀 APP INITIALIZER: Starting application initialization...');
        
        try {
            // Регистрируем стандартные шаги
            this.registerStandardSteps();
            
            // Выполняем шаги по порядку
            for (const step of this.initSteps) {
                await this.executeStep(step);
            }

            // Проверяем результаты
            const criticalErrors = this.initSteps.filter(s => s.required && s.error);
            
            if (criticalErrors.length > 0) {
                throw new Error(`Critical initialization errors: ${criticalErrors.map(s => s.name).join(', ')}`);
            }

            this.isInitialized = true;
            console.log('✅ APP INITIALIZER: Application initialized successfully');
            
            // Отправляем событие о завершении инициализации
            this.notifyInitializationComplete();
            
            return {
                success: true,
                steps: this.initSteps,
                managers: this.managers
            };

        } catch (error) {
            console.error('❌ APP INITIALIZER: Initialization failed:', error);
            
            return {
                success: false,
                error: error.message,
                steps: this.initSteps
            };
        }
    }

    // Регистрация стандартных шагов инициализации
    registerStandardSteps() {
        // 1. Инициализация Supabase
        this.addInitStep('Supabase Connection', async () => {
            console.log('🔌 Initializing Supabase connection...');
            
            if (!window.supabase) {
                throw new Error('Supabase client not found');
            }

            // Тестируем подключение
            const { data, error } = await window.supabase
                .from('schema_version')
                .select('version')
                .limit(1);

            if (error) {
                throw new Error(`Supabase connection failed: ${error.message}`);
            }

            console.log('✅ Supabase connected');
            return { supabase: window.supabase };
        });

        // 2. Валидация базы данных
        this.addInitStep('Database Validation', async () => {
            console.log('🔍 Validating database schema...');
            
            if (!window.DatabaseValidator) {
                console.warn('⚠️ DatabaseValidator not available, skipping validation');
                return { skipped: true };
            }

            const validator = new window.DatabaseValidator(window.supabase);
            const result = await validator.validateDatabase();
            
            if (!result.isValid) {
                throw new Error(`Database validation failed: ${result.message}`);
            }

            console.log('✅ Database schema validated');
            return result;
        });

        // 3. Инициализация Telegram
        this.addInitStep('Telegram Integration', async () => {
            console.log('📱 Initializing Telegram integration...');
            
            let telegramUser = null;
            
            if (window.initializeTelegramWebApp) {
                telegramUser = window.initializeTelegramWebApp();
            }

            console.log('✅ Telegram integration initialized');
            return { telegramUser };
        });

        // 4. Инициализация UserManager
        this.addInitStep('User Manager', async () => {
            console.log('👤 Initializing User Manager...');
            
            if (!window.UserManager) {
                throw new Error('UserManager not available');
            }

            const userManager = new window.UserManager(window.supabase);
            await userManager.initialize();
            
            this.managers.userManager = userManager;
            
            console.log('✅ User Manager initialized');
            return { userManager };
        }, false); // Не критично

        // 5. Инициализация StrategyManager
        this.addInitStep('Strategy Manager', async () => {
            console.log('🎯 Initializing Strategy Manager...');
            
            if (!window.StrategyManager) {
                throw new Error('StrategyManager not available');
            }

            const strategyManager = new window.StrategyManager(
                window.supabase, 
                this.managers.userManager
            );
            
            await strategyManager.initialize();
            
            this.managers.strategyManager = strategyManager;
            
            console.log('✅ Strategy Manager initialized');
            return { strategyManager };
        });

        // 6. Инициализация UI компонентов
        this.addInitStep('UI Components', async () => {
            console.log('🎨 Initializing UI components...');
            
            // Инициализируем модальные окна
            if (window.initializeModals) {
                window.initializeModals();
            }

            // Инициализируем обработчики событий
            if (window.initializeEventHandlers) {
                window.initializeEventHandlers();
            }

            // Обновляем статистику
            if (window.updateUserStats) {
                setTimeout(window.updateUserStats, 1000);
            }

            console.log('✅ UI components initialized');
            return { ui: 'initialized' };
        }, false); // Не критично
    }

    // Выполнение одного шага
    async executeStep(step) {
        console.log(`⏳ Executing step: ${step.name}`);
        
        try {
            const startTime = Date.now();
            const result = await step.function();
            const duration = Date.now() - startTime;
            
            step.completed = true;
            step.result = result;
            step.duration = duration;
            
            console.log(`✅ Step completed: ${step.name} (${duration}ms)`);
            
        } catch (error) {
            step.error = error;
            step.completed = false;
            
            console.error(`❌ Step failed: ${step.name}`, error);
            
            if (step.required) {
                throw error;
            }
        }
    }

    // Уведомление о завершении инициализации
    notifyInitializationComplete() {
        const event = new CustomEvent('appInitialized', {
            detail: {
                success: this.isInitialized,
                steps: this.initSteps,
                managers: this.managers
            }
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    // Получение статуса инициализации
    getInitializationStatus() {
        return {
            isInitialized: this.isInitialized,
            steps: this.initSteps.map(step => ({
                name: step.name,
                completed: step.completed,
                required: step.required,
                error: step.error ? step.error.message : null,
                duration: step.duration || null
            })),
            managers: Object.keys(this.managers)
        };
    }

    // Получение менеджера по имени
    getManager(name) {
        return this.managers[name] || null;
    }

    // Проверка готовности приложения
    isAppReady() {
        return this.isInitialized;
    }
}

// Глобальная функция для быстрой инициализации
async function initializeApp() {
    const initializer = new AppInitializer();
    const result = await initializer.initialize();
    
    // Сохраняем инициализатор глобально
    window.appInitializer = initializer;
    
    return result;
}

// Экспорт
if (typeof window !== 'undefined') {
    window.AppInitializer = AppInitializer;
    window.initializeApp = initializeApp;
}

console.log('🚀 App Initializer loaded');
