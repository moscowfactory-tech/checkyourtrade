// Улучшенная система сохранения стратегий
console.log('💾 Loading strategy saver module...');

// Функция для сохранения стратегии в базу данных
async function saveStrategyToDatabase(strategyData) {
    try {
        console.log('💾 Saving strategy to database:', strategyData.name);
        
        // Проверяем доступность Supabase
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return null;
        }
        
        // Сохраняем стратегию
        const { data: savedStrategy, error } = await window.supabase
            .from('strategies')
            .insert({
                name: strategyData.name,
                description: strategyData.description,
                fields: strategyData.fields
            })
            .select()
            .single();
            
        if (error) {
            console.error('❌ Error saving strategy:', error);
            return null;
        }
        
        console.log('✅ Strategy saved successfully:', savedStrategy);
        return savedStrategy;
        
    } catch (error) {
        console.error('❌ Exception saving strategy:', error);
        return null;
    }
}

// Функция для загрузки всех стратегий из базы данных
async function loadStrategiesFromDatabase() {
    try {
        console.log('📥 Loading strategies from database...');
        
        // Проверяем доступность Supabase
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return [];
        }
        
        // Загружаем стратегии
        const { data: strategiesData, error } = await window.supabase
            .from('strategies')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('❌ Error loading strategies:', error);
            return [];
        }
        
        // Преобразуем данные в нужный формат
        const formattedStrategies = strategiesData
            .filter(strategy => strategy.fields && Array.isArray(strategy.fields))
            .map(strategy => ({
                id: strategy.id,
                name: strategy.name,
                description: strategy.description,
                fields: strategy.fields
            }));
        
        console.log(`✅ Loaded ${formattedStrategies.length} strategies from database`);
        return formattedStrategies;
        
    } catch (error) {
        console.error('❌ Exception loading strategies:', error);
        return [];
    }
}

// Функция для проверки существования стратегии в базе данных
async function checkStrategyExists(strategyId) {
    try {
        if (typeof window.supabase === 'undefined') {
            return false;
        }
        
        const { data, error } = await window.supabase
            .from('strategies')
            .select('id')
            .eq('id', strategyId)
            .single();
            
        return !error && data;
        
    } catch (error) {
        console.error('❌ Error checking strategy existence:', error);
        return false;
    }
}

// Функция для удаления стратегии из базы данных
async function deleteStrategyFromDatabase(strategyId) {
    try {
        console.log('🗑️ Deleting strategy from database:', strategyId);
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return false;
        }
        
        const { error } = await window.supabase
            .from('strategies')
            .delete()
            .eq('id', strategyId);
            
        if (error) {
            console.error('❌ Error deleting strategy:', error);
            return false;
        }
        
        console.log('✅ Strategy deleted successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Exception deleting strategy:', error);
        return false;
    }
}

// Функция для синхронизации локальных стратегий с базой данных
async function syncStrategiesWithDatabase() {
    try {
        console.log('🔄 Syncing strategies with database...');
        
        const dbStrategies = await loadStrategiesFromDatabase();
        
        // Обновляем глобальную переменную strategies
        if (typeof strategies !== 'undefined') {
            strategies.length = 0; // Очищаем массив
            strategies.push(...dbStrategies); // Добавляем данные из БД
            
            console.log(`✅ Synced ${strategies.length} strategies`);
            
            // Перерисовываем интерфейс
            if (typeof renderStrategies === 'function') {
                renderStrategies();
            }
            if (typeof updateStrategySelect === 'function') {
                updateStrategySelect();
            }
        }
        
        return dbStrategies;
        
    } catch (error) {
        console.error('❌ Error syncing strategies:', error);
        return [];
    }
}

// Экспорт функций
window.saveStrategyToDatabase = saveStrategyToDatabase;
window.loadStrategiesFromDatabase = loadStrategiesFromDatabase;
window.checkStrategyExists = checkStrategyExists;
window.deleteStrategyFromDatabase = deleteStrategyFromDatabase;
window.syncStrategiesWithDatabase = syncStrategiesWithDatabase;

console.log('✅ Strategy saver module loaded');
console.log('Available functions:');
console.log('- await saveStrategyToDatabase(strategy)');
console.log('- await loadStrategiesFromDatabase()');
console.log('- await syncStrategiesWithDatabase()');
console.log('- await checkStrategyExists(id)');
console.log('- await deleteStrategyFromDatabase(id)');
