// Диагностика загрузки стратегий
console.log('🔍 Starting strategies debug...');

async function debugStrategies() {
    try {
        console.log('🔍 Debugging strategies loading...');
        
        // Проверяем подключение к Supabase
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return;
        }
        
        console.log('✅ Supabase client available');
        
        // Проверяем таблицу strategies
        console.log('📊 Checking strategies table...');
        const { data: strategiesData, error: strategiesError } = await supabase
            .from('strategies')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (strategiesError) {
            console.error('❌ Error loading strategies:', strategiesError);
            return;
        }
        
        console.log(`📋 Found ${strategiesData.length} strategies in database:`);
        strategiesData.forEach((strategy, index) => {
            console.log(`${index + 1}. ID: ${strategy.id}, Name: "${strategy.name}"`);
            console.log(`   Description: "${strategy.description}"`);
            console.log(`   Fields type: ${typeof strategy.fields}`);
            if (strategy.fields) {
                console.log(`   Fields content:`, strategy.fields);
            }
            console.log(`   Created: ${strategy.created_at}`);
            console.log('---');
        });
        
        // Проверяем функцию StrategyDB.getAll()
        console.log('🔍 Testing StrategyDB.getAll()...');
        if (typeof StrategyDB !== 'undefined' && StrategyDB.getAll) {
            const strategies = await StrategyDB.getAll();
            console.log(`📋 StrategyDB.getAll() returned ${strategies.length} strategies:`);
            strategies.forEach((strategy, index) => {
                console.log(`${index + 1}. ID: ${strategy.id}, Name: "${strategy.name}"`);
                console.log(`   Fields count: ${strategy.fields ? strategy.fields.length : 0}`);
            });
        } else {
            console.error('❌ StrategyDB.getAll() not available');
        }
        
        // Проверяем глобальную переменную strategies
        console.log('🔍 Checking global strategies variable...');
        if (typeof strategies !== 'undefined') {
            console.log(`📋 Global strategies array has ${strategies.length} items:`);
            strategies.forEach((strategy, index) => {
                console.log(`${index + 1}. ID: ${strategy.id}, Name: "${strategy.name}"`);
            });
        } else {
            console.error('❌ Global strategies variable not defined');
        }
        
        // Проверяем отображение стратегий
        console.log('🔍 Checking strategies display...');
        const strategiesContainer = document.getElementById('strategiesContainer');
        if (strategiesContainer) {
            console.log(`📋 Strategies container found, children: ${strategiesContainer.children.length}`);
            console.log('Container HTML:', strategiesContainer.innerHTML.substring(0, 200) + '...');
        } else {
            console.error('❌ Strategies container not found');
        }
        
        console.log('✅ Debug completed');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Функция для принудительной перезагрузки стратегий
async function reloadStrategies() {
    try {
        console.log('🔄 Reloading strategies...');
        
        if (typeof loadDataFromDatabase === 'function') {
            const dbData = await loadDataFromDatabase();
            if (typeof strategies !== 'undefined') {
                strategies.length = 0; // Очищаем массив
                strategies.push(...dbData.strategies); // Добавляем новые данные
                console.log(`✅ Reloaded ${strategies.length} strategies`);
                
                // Перерисовываем интерфейс
                if (typeof renderStrategies === 'function') {
                    renderStrategies();
                }
                if (typeof updateStrategySelect === 'function') {
                    updateStrategySelect();
                }
            }
        }
    } catch (error) {
        console.error('❌ Reload failed:', error);
    }
}

// Функция для добавления тестовых стратегий
async function addTestStrategies() {
    try {
        console.log('📝 Adding test strategies...');
        
        const testStrategy = {
            name: "Тестовая стратегия " + new Date().getTime(),
            description: "Описание тестовой стратегии",
            fields: [
                {
                    name: "Тестовое основание",
                    description: "Описание основания",
                    inputs: [
                        {
                            type: "select",
                            label: "Тестовый вопрос",
                            required: true,
                            options: ["Да", "Нет", "Не знаю"]
                        }
                    ]
                }
            ]
        };
        
        if (typeof StrategyDB !== 'undefined' && StrategyDB.create) {
            const result = await StrategyDB.create(testStrategy);
            if (result) {
                console.log('✅ Test strategy created:', result);
                await reloadStrategies();
            } else {
                console.error('❌ Failed to create test strategy');
            }
        } else {
            console.error('❌ StrategyDB.create not available');
        }
        
    } catch (error) {
        console.error('❌ Add test strategy failed:', error);
    }
}

// Экспорт функций
window.debugStrategies = debugStrategies;
window.reloadStrategies = reloadStrategies;
window.addTestStrategies = addTestStrategies;

console.log('✅ Debug strategies module loaded');
console.log('Available commands:');
console.log('- await debugStrategies() - полная диагностика');
console.log('- await reloadStrategies() - перезагрузка стратегий');
console.log('- await addTestStrategies() - добавить тестовую стратегию');
