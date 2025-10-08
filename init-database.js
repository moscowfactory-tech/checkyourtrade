// Инициализация базы данных и добавление примеров стратегий
console.log('🗄️ Initializing database...');

// Примеры стратегий для добавления в БД
const sampleStrategies = [
    {
        name: "Технический анализ движения",
        description: "Анализ технических индикаторов и движения цены",
        is_public: true,
        fields: [
            {
                name: "Анализ тренда",
                description: "Определение направления основного тренда",
                sort_order: 1,
                inputs: [
                    {
                        type: "select",
                        label: "Направление тренда",
                        required: true,
                        options: ["Восходящий", "Нисходящий", "Боковой"],
                        sort_order: 1
                    },
                    {
                        type: "select",
                        label: "Сила тренда",
                        required: true,
                        options: ["Сильный", "Умеренный", "Слабый"],
                        sort_order: 2
                    }
                ]
            },
            {
                name: "Уровни поддержки и сопротивления",
                description: "Анализ ключевых уровней",
                sort_order: 2,
                inputs: [
                    {
                        type: "select",
                        label: "Близость к поддержке",
                        required: true,
                        options: ["Очень близко", "Близко", "Далеко"],
                        sort_order: 1
                    },
                    {
                        type: "select",
                        label: "Близость к сопротивлению",
                        required: true,
                        options: ["Очень близко", "Близко", "Далеко"],
                        sort_order: 2
                    }
                ]
            }
        ]
    },
    {
        name: "Фундаментальный анализ",
        description: "Анализ новостей и фундаментальных факторов",
        is_public: true,
        fields: [
            {
                name: "Анализ новостей",
                description: "Оценка влияния новостей на рынок",
                sort_order: 1,
                inputs: [
                    {
                        type: "select",
                        label: "Тип новостей",
                        required: true,
                        options: ["Позитивные", "Негативные", "Нейтральные"],
                        sort_order: 1
                    },
                    {
                        type: "select",
                        label: "Важность новостей",
                        required: true,
                        options: ["Высокая", "Средняя", "Низкая"],
                        sort_order: 2
                    }
                ]
            },
            {
                name: "Экономические показатели",
                description: "Анализ ключевых экономических данных",
                sort_order: 2,
                inputs: [
                    {
                        type: "select",
                        label: "Состояние экономики",
                        required: true,
                        options: ["Растущая", "Стабильная", "Падающая"],
                        sort_order: 1
                    }
                ]
            }
        ]
    },
    {
        name: "Пробой",
        description: "Стратегия торговли на пробоях уровней",
        is_public: true,
        fields: [
            {
                name: "Анализ уровня пробоя",
                description: "Оценка силы и качества пробоя",
                sort_order: 1,
                inputs: [
                    {
                        type: "select",
                        label: "Тип уровня",
                        required: true,
                        options: ["Поддержка", "Сопротивление", "Трендовая линия"],
                        sort_order: 1
                    },
                    {
                        type: "select",
                        label: "Сила пробоя",
                        required: true,
                        options: ["Сильный", "Умеренный", "Слабый"],
                        sort_order: 2
                    }
                ]
            },
            {
                name: "Подтверждение пробоя",
                description: "Анализ подтверждающих сигналов",
                sort_order: 2,
                inputs: [
                    {
                        type: "select",
                        label: "Объем при пробое",
                        required: true,
                        options: ["Высокий", "Средний", "Низкий"],
                        sort_order: 1
                    },
                    {
                        type: "select",
                        label: "Ретест уровня",
                        required: true,
                        options: ["Успешный", "Неуспешный", "Не было"],
                        sort_order: 2
                    }
                ]
            }
        ]
    }
];

// Функция инициализации базы данных
async function initializeDatabase() {
    try {
        console.log('🚀 Starting database initialization...');
        
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return false;
        }
        
        // Проверяем подключение к базе данных
        const { data: testData, error: testError } = await supabase
            .from('strategies')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.error('❌ Database connection failed:', testError);
            return false;
        }
        
        console.log('✅ Database connection successful');
        
        // Проверяем, есть ли уже стратегии в базе
        const { data: existingStrategies, error: checkError } = await supabase
            .from('strategies')
            .select('id');
            
        if (checkError) {
            console.error('❌ Error checking existing strategies:', checkError);
            return false;
        }
        
        if (existingStrategies && existingStrategies.length > 0) {
            console.log('ℹ️ Sample strategies already exist in database');
            return true;
        }
        
        // Добавляем примеры стратегий
        console.log('📝 Adding sample strategies to database...');
        
        for (const strategy of sampleStrategies) {
            const { data, error } = await supabase
                .from('strategies')
                .insert({
                    name: strategy.name,
                    description: strategy.description,
                    fields: strategy.fields // Сохраняем поля в JSONB формате
                })
                .select()
                .single();
                
            if (error) {
                console.error('❌ Error adding strategy:', error);
            } else {
                console.log(`✅ Added strategy: ${strategy.name}`);
            }
        }
        
        console.log('✅ Database initialization completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

// Функция добавления стратегии в базу данных
async function addStrategyToDatabase(strategyData) {
    try {
        console.log(`📋 Adding strategy: ${strategyData.name}`);
        
        // Добавляем стратегию
        const { data: strategy, error: strategyError } = await supabase
            .from('strategies')
            .insert({
                name: strategyData.name,
                description: strategyData.description,
                is_public: strategyData.is_public,
                user_id: null // Публичные стратегии без привязки к пользователю
            })
            .select()
            .single();
            
        if (strategyError) {
            console.error('❌ Error adding strategy:', strategyError);
            return;
        }
        
        console.log(`✅ Strategy added with ID: ${strategy.id}`);
        
        // Добавляем поля стратегии
        for (const field of strategyData.fields) {
            const { data: strategyField, error: fieldError } = await supabase
                .from('strategy_fields')
                .insert({
                    strategy_id: strategy.id,
                    name: field.name,
                    description: field.description,
                    sort_order: field.sort_order
                })
                .select()
                .single();
                
            if (fieldError) {
                console.error('❌ Error adding field:', fieldError);
                continue;
            }
            
            console.log(`  ✅ Field added: ${field.name}`);
            
            // Добавляем входные данные для поля
            for (const input of field.inputs) {
                const { error: inputError } = await supabase
                    .from('field_inputs')
                    .insert({
                        field_id: strategyField.id,
                        type: input.type,
                        label: input.label,
                        required: input.required,
                        options: input.options,
                        sort_order: input.sort_order
                    });
                    
                if (inputError) {
                    console.error('❌ Error adding input:', inputError);
                    continue;
                }
                
                console.log(`    ✅ Input added: ${input.label}`);
            }
        }
    } catch (error) {
        console.error('❌ Error in addStrategyToDatabase:', error);
    }
}

// Экспорт функций
window.initializeDatabase = initializeDatabase;
window.sampleStrategies = sampleStrategies;

console.log('✅ Database initialization module loaded');
