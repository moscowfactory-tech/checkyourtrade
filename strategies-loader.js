// Надежный загрузчик стратегий для TradeAnalyzer
console.log('📥 Loading strategies loader module...');

// Функция для надежной загрузки стратегий
async function loadStrategiesFromDB() {
    try {
        console.log('🔄 Loading strategies from database...');
        
        // Проверяем доступность Supabase
        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            return { success: false, error: 'Supabase client not available', strategies: [] };
        }
        
        // Проверяем, что клиент функционален
        if (typeof window.supabase.from !== 'function') {
            console.error('❌ Supabase client is not functional - missing .from() method');
            return { success: false, error: 'Supabase client is not functional', strategies: [] };
        }
        
        // Выполняем запрос к базе данных
        const { data: strategiesData, error } = await window.supabase
            .from('strategies')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Database error:', error);
            return { 
                success: false, 
                error: `Database error: ${error.message}`, 
                strategies: [] 
            };
        }
        
        // Проверяем и форматируем данные
        const formattedStrategies = [];
        
        if (strategiesData && Array.isArray(strategiesData)) {
            for (const strategy of strategiesData) {
                try {
                    // Проверяем обязательные поля
                    if (!strategy.id || !strategy.name) {
                        console.warn('⚠️ Invalid strategy data:', strategy);
                        continue;
                    }
                    
                    // Проверяем поле fields
                    let fields = [];
                    if (strategy.fields) {
                        if (typeof strategy.fields === 'string') {
                            try {
                                fields = JSON.parse(strategy.fields);
                            } catch (parseError) {
                                console.warn('⚠️ Failed to parse strategy fields:', parseError);
                                fields = [];
                            }
                        } else if (Array.isArray(strategy.fields)) {
                            fields = strategy.fields;
                        }
                    }
                    
                    // Добавляем отформатированную стратегию
                    formattedStrategies.push({
                        id: strategy.id,
                        name: strategy.name,
                        description: strategy.description || '',
                        fields: fields,
                        created_at: strategy.created_at
                    });
                    
                } catch (formatError) {
                    console.warn('⚠️ Error formatting strategy:', formatError);
                }
            }
        }
        
        console.log(`✅ Successfully loaded ${formattedStrategies.length} strategies`);
        return { 
            success: true, 
            error: null, 
            strategies: formattedStrategies 
        };
        
    } catch (error) {
        console.error('❌ Exception in loadStrategiesFromDB:', error);
        return { 
            success: false, 
            error: `Exception: ${error.message}`, 
            strategies: [] 
        };
    }
}

// Функция для обновления глобальных переменных и интерфейса
async function updateStrategiesInApp() {
    try {
        console.log('🔄 Updating strategies in app...');
        
        const result = await loadStrategiesFromDB();
        
        if (!result.success) {
            console.error('❌ Failed to load strategies:', result.error);
            
            // Показываем ошибку пользователю
            if (typeof createInlineNotification === 'function') {
                createInlineNotification(`Ошибка загрузки стратегий: ${result.error}`, 'error', 5000);
            } else {
                console.error('CRITICAL: Failed to load strategies:', result.error);
            }
            
            return false;
        }
        
        // Обновляем глобальную переменную strategies
        if (typeof strategies !== 'undefined') {
            strategies.length = 0; // Очищаем массив
            strategies.push(...result.strategies); // Добавляем новые данные
            console.log(`📋 Updated global strategies array with ${strategies.length} items`);
        } else {
            console.warn('⚠️ Global strategies variable not found');
        }
        
        // Обновляем интерфейс
        try {
            if (typeof renderStrategies === 'function') {
                renderStrategies();
                console.log('✅ Strategies rendered');
            }
            
            if (typeof updateStrategySelect === 'function') {
                updateStrategySelect();
                console.log('✅ Strategy select updated');
            }
        } catch (uiError) {
            console.error('❌ Error updating UI:', uiError);
        }
        
        // Показываем успешное уведомление
        if (result.strategies.length > 0) {
            if (typeof createInlineNotification === 'function') {
                createInlineNotification(`Загружено ${result.strategies.length} стратегий`, 'success', 3000);
            }
        } else {
            console.log('📝 No strategies found in database');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Exception in updateStrategiesInApp:', error);
        
        if (typeof createInlineNotification === 'function') {
            createInlineNotification('Неожиданная ошибка при обновлении стратегий', 'error', 5000);
        }
        
        return false;
    }
}

// Функция для проверки подключения к базе данных
async function testDatabaseConnection() {
    try {
        console.log('🔍 Testing database connection...');
        
        if (!window.supabase) {
            return { success: false, error: 'Supabase client not available' };
        }
        
        if (typeof window.supabase.from !== 'function') {
            return { success: false, error: 'Supabase client is not functional' };
        }
        
        // Простой тест подключения
        const { data, error } = await window.supabase
            .from('strategies')
            .select('count')
            .limit(1);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        console.log('✅ Database connection test successful');
        return { success: true, error: null };
        
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return { success: false, error: error.message };
    }
}

// Функция для инициализации загрузчика стратегий
async function initializeStrategiesLoader() {
    try {
        console.log('🚀 Initializing strategies loader...');
        
        // Ждем инициализации Supabase
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд
        
        while ((!window.supabase || typeof window.supabase.from !== 'function') && attempts < maxAttempts) {
            console.log(`⏳ Waiting for functional Supabase client... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            console.error('❌ Functional Supabase client not available after waiting');
            return false;
        }
        
        // Тестируем подключение
        const connectionTest = await testDatabaseConnection();
        if (!connectionTest.success) {
            console.error('❌ Database connection failed:', connectionTest.error);
            
            if (typeof createInlineNotification === 'function') {
                createInlineNotification(`Ошибка подключения к БД: ${connectionTest.error}`, 'error', 5000);
            }
            
            return false;
        }
        
        // Загружаем стратегии
        const success = await updateStrategiesInApp();
        
        if (success) {
            console.log('✅ Strategies loader initialized successfully');
        } else {
            console.error('❌ Failed to initialize strategies loader');
        }
        
        return success;
        
    } catch (error) {
        console.error('❌ Exception in initializeStrategiesLoader:', error);
        return false;
    }
}

// Экспорт функций
window.loadStrategiesFromDB = loadStrategiesFromDB;
window.updateStrategiesInApp = updateStrategiesInApp;
window.testDatabaseConnection = testDatabaseConnection;
window.initializeStrategiesLoader = initializeStrategiesLoader;

console.log('✅ Strategies loader module loaded');
console.log('Available functions:');
console.log('- await loadStrategiesFromDB() - загрузить стратегии из БД');
console.log('- await updateStrategiesInApp() - обновить стратегии в приложении');
console.log('- await testDatabaseConnection() - проверить подключение к БД');
console.log('- await initializeStrategiesLoader() - инициализировать загрузчик');
