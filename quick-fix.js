// Быстрое исправление проблем с TradeAnalyzer
console.log('🔧 Loading quick fix module...');

// Функция для быстрой диагностики и исправления
async function quickFix() {
    try {
        console.log('🔍 Running quick diagnostic...');
        
        // 1. Проверяем Supabase
        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            alert('Supabase не загружен. Перезагрузите страницу.');
            return false;
        }
        
        console.log('✅ Supabase client is available');
        
        // 2. Проверяем соединение с базой данных
        try {
            const { data, error } = await window.supabase
                .from('strategies')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('❌ Database connection error:', error);
                alert(`Ошибка подключения к базе данных: ${error.message}`);
                return false;
            }
            
            console.log('✅ Database connection is working');
            
        } catch (err) {
            console.error('❌ Database connection exception:', err);
            alert('Не удается подключиться к базе данных. Проверьте интернет-соединение.');
            return false;
        }
        
        // 3. Проверяем таблицу strategies
        try {
            const { data: strategies, error } = await window.supabase
                .from('strategies')
                .select('*')
                .limit(5);
                
            if (error) {
                console.error('❌ Error accessing strategies table:', error);
                alert(`Ошибка доступа к таблице стратегий: ${error.message}`);
                return false;
            }
            
            console.log(`✅ Strategies table accessible. Found ${strategies ? strategies.length : 0} strategies`);
            
        } catch (err) {
            console.error('❌ Exception accessing strategies table:', err);
            alert('Ошибка при обращении к таблице стратегий.');
            return false;
        }
        
        // 4. Перезагружаем стратегии
        if (typeof safeLoadStrategies === 'function') {
            console.log('🔄 Reloading strategies...');
            const loadedStrategies = await safeLoadStrategies();
            
            if (typeof strategies !== 'undefined') {
                strategies.length = 0;
                strategies.push(...loadedStrategies);
                
                // Обновляем интерфейс
                if (typeof renderStrategies === 'function') {
                    renderStrategies();
                }
                
                if (typeof updateStrategySelect === 'function') {
                    updateStrategySelect();
                }
                
                console.log(`✅ Strategies reloaded. Total: ${strategies.length}`);
                alert(`Готово! Загружено ${strategies.length} стратегий.`);
                return true;
            }
        }
        
        console.log('✅ Quick fix completed successfully');
        alert('Диагностика завершена успешно!');
        return true;
        
    } catch (error) {
        console.error('❌ Error in quickFix:', error);
        alert(`Ошибка при выполнении диагностики: ${error.message}`);
        return false;
    }
}

// Функция для создания тестовой стратегии
async function createTestStrategy() {
    try {
        console.log('🧪 Creating test strategy...');
        
        if (!window.supabase) {
            alert('Supabase не доступен');
            return false;
        }
        
        const testStrategy = {
            name: 'Тестовая стратегия ' + new Date().toLocaleTimeString(),
            description: 'Автоматически созданная тестовая стратегия',
            fields: [
                {
                    name: 'Тестовое основание',
                    description: 'Проверка работы системы',
                    inputs: [
                        {
                            type: 'select',
                            label: 'Тестовый вопрос',
                            required: true,
                            options: ['Да', 'Нет', 'Не знаю']
                        }
                    ]
                }
            ]
        };
        
        const { data: savedStrategy, error } = await window.supabase
            .from('strategies')
            .insert(testStrategy)
            .select()
            .single();
            
        if (error) {
            console.error('❌ Error creating test strategy:', error);
            alert(`Ошибка создания тестовой стратегии: ${error.message}`);
            return false;
        }
        
        console.log('✅ Test strategy created:', savedStrategy);
        alert('Тестовая стратегия создана успешно!');
        
        // Перезагружаем стратегии
        await quickFix();
        
        return true;
        
    } catch (error) {
        console.error('❌ Exception creating test strategy:', error);
        alert(`Ошибка при создании тестовой стратегии: ${error.message}`);
        return false;
    }
}

// Экспорт функций
window.quickFix = quickFix;
window.createTestStrategy = createTestStrategy;

console.log('✅ Quick fix module loaded');
console.log('Available commands:');
console.log('- await quickFix() - быстрая диагностика и исправление');
console.log('- await createTestStrategy() - создать тестовую стратегию');
