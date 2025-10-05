// Enhanced Database operations for TradeAnalyzer
console.log('🗄️ Loading enhanced database module...');

let supabase;

// Initialize database connection
export async function initializeDatabase() {
    try {
        // Ждем инициализации Supabase
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд максимум
        
        while (typeof window.supabase === 'undefined' && attempts < maxAttempts) {
            console.log(`⏳ Waiting for Supabase client... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase;
            console.log('✅ Supabase client initialized');
            
            // Инициализируем базу данных с примерами стратегий
            if (typeof window.initializeDatabase === 'function') {
                const dbInitialized = await window.initializeDatabase();
                if (dbInitialized) {
                    console.log('✅ Database initialized with sample data');
                }
            }
            
            return true;
        } else {
            console.error('❌ Supabase client not found after waiting');
            return false;
        }
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

// Strategy Database Operations
export const StrategyDB = {
    // Получить все стратегии
    async getAll() {
        try {
            console.log('📋 Loading strategies from database...');
            
            // Сначала пробуем загрузить стратегии с полями из отдельных таблиц
            const { data: strategiesWithFields, error: fieldsError } = await supabase
                .from('strategies')
                .select(`
                    *,
                    strategy_fields (
                        *,
                        field_inputs (*)
                    )
                `)
                .order('created_at', { ascending: true });
            
            if (!fieldsError && strategiesWithFields && strategiesWithFields.length > 0) {
                // Если есть данные в отдельных таблицах, используем их
                const formattedStrategies = strategiesWithFields
                    .filter(strategy => strategy.strategy_fields && strategy.strategy_fields.length > 0)
                    .map(strategy => ({
                        id: strategy.id,
                        name: strategy.name,
                        description: strategy.description,
                        fields: strategy.strategy_fields
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map(field => ({
                                name: field.name,
                                description: field.description,
                                inputs: field.field_inputs
                                    .sort((a, b) => a.sort_order - b.sort_order)
                                    .map(input => ({
                                        type: input.type,
                                        label: input.label,
                                        required: input.required,
                                        options: input.options || []
                                    }))
                            }))
                    }));
                
                if (formattedStrategies.length > 0) {
                    console.log(`✅ Loaded ${formattedStrategies.length} strategies from relational tables`);
                    return formattedStrategies;
                }
            }
            
            // Если нет данных в отдельных таблицах, пробуем загрузить из JSONB поля
            const { data: strategiesWithJsonb, error: jsonbError } = await supabase
                .from('strategies')
                .select('*')
                .order('created_at', { ascending: true });
                
            if (jsonbError) {
                console.error('❌ Error loading strategies:', jsonbError);
                return [];
            }
            
            // Преобразуем данные из JSONB формата
            const formattedStrategies = strategiesWithJsonb
                .filter(strategy => strategy.fields && Array.isArray(strategy.fields))
                .map(strategy => ({
                    id: strategy.id,
                    name: strategy.name,
                    description: strategy.description,
                    fields: strategy.fields
                }));
            
            console.log(`✅ Loaded ${formattedStrategies.length} strategies from JSONB field`);
            return formattedStrategies;
            
        } catch (error) {
            console.error('❌ Error in StrategyDB.getAll:', error);
            return [];
        }
    },

    // Создать новую стратегию
    async create(strategyData) {
        try {
            console.log('📝 Creating new strategy:', strategyData.name);
            
            const { data: strategy, error: strategyError } = await supabase
                .from('strategies')
                .insert({
                    name: strategyData.name,
                    description: strategyData.description,
                    fields: strategyData.fields // Сохраняем поля в JSONB формате
                })
                .select()
                .single();
                
            if (strategyError) {
                console.error('❌ Error creating strategy:', strategyError);
                return null;
            }
            
            console.log('✅ Strategy created successfully');
            return strategy;
            
        } catch (error) {
            console.error('❌ Error in StrategyDB.create:', error);
            return null;
        }
    },

    // Удалить стратегию
    async delete(strategyId) {
        try {
            console.log('🗑️ Deleting strategy:', strategyId);
            
            const { error } = await supabase
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
            console.error('❌ Error in StrategyDB.delete:', error);
            return false;
        }
    }
};

// Analysis Database Operations
export const AnalysisDB = {
    // Получить все анализы пользователя
    async getAll() {
        try {
            console.log('📊 Loading analyses from database...');
            
            const { data: analyses, error } = await supabase
                .from('analysis_results')
                .select(`
                    *,
                    strategies (name)
                `)
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('❌ Error loading analyses:', error);
                return [];
            }
            
            // Преобразуем данные в формат, ожидаемый фронтендом
            const formattedAnalyses = analyses.map(analysis => ({
                id: analysis.id,
                strategyName: analysis.strategies?.name || 'Неизвестная стратегия',
                strategyId: analysis.strategy_id,
                date: analysis.created_at,
                answers: analysis.answers,
                recommendation: analysis.recommendation
            }));
            
            console.log(`✅ Loaded ${formattedAnalyses.length} analyses from database`);
            return formattedAnalyses;
            
        } catch (error) {
            console.error('❌ Error in AnalysisDB.getAll:', error);
            return [];
        }
    },

    // Создать новый анализ
    async create(analysisData) {
        try {
            console.log('📝 Creating new analysis');
            
            const { data: analysis, error } = await supabase
                .from('analysis_results')
                .insert({
                    strategy_id: analysisData.strategyId,
                    answers: analysisData.answers,
                    recommendation: analysisData.recommendation || null,
                    user_id: null // TODO: Добавить user_id после авторизации
                })
                .select()
                .single();
                
            if (error) {
                console.error('❌ Error creating analysis:', error);
                return null;
            }
            
            console.log('✅ Analysis created successfully');
            return analysis;
            
        } catch (error) {
            console.error('❌ Error in AnalysisDB.create:', error);
            return null;
        }
    },

    // Удалить анализ
    async delete(analysisId) {
        try {
            console.log('🗑️ Deleting analysis:', analysisId);
            
            const { error } = await supabase
                .from('analysis_results')
                .delete()
                .eq('id', analysisId);
                
            if (error) {
                console.error('❌ Error deleting analysis:', error);
                return false;
            }
            
            console.log('✅ Analysis deleted successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error in AnalysisDB.delete:', error);
            return false;
        }
    }
};

// Функция для загрузки данных из базы данных
export async function loadDataFromDatabase() {
    try {
        console.log('📂 Loading all data from database...');
        
        const [strategies, analyses] = await Promise.all([
            StrategyDB.getAll(),
            AnalysisDB.getAll()
        ]);
        
        return {
            strategies,
            analyses
        };
        
    } catch (error) {
        console.error('❌ Error loading data from database:', error);
        return {
            strategies: [],
            analyses: []
        };
    }
}

// Экспорт для глобального доступа
window.StrategyDB = StrategyDB;
window.AnalysisDB = AnalysisDB;
window.loadDataFromDatabase = loadDataFromDatabase;

console.log('✅ Enhanced database module loaded');
