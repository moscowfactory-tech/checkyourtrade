// Проверка состояния базы данных
console.log('🔍 Checking database status...');

async function checkDatabaseTables() {
    try {
        console.log('📊 Checking database tables...');
        
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return false;
        }
        
        // Проверяем таблицу strategies
        console.log('🔍 Checking strategies table...');
        const { data: strategiesData, error: strategiesError } = await supabase
            .from('strategies')
            .select('id, name, is_public')
            .limit(5);
            
        if (strategiesError) {
            console.error('❌ Error accessing strategies table:', strategiesError);
        } else {
            console.log(`✅ Strategies table OK - found ${strategiesData.length} records`);
            strategiesData.forEach(strategy => {
                console.log(`  📋 ${strategy.name} (public: ${strategy.is_public})`);
            });
        }
        
        // Проверяем таблицу strategy_fields
        console.log('🔍 Checking strategy_fields table...');
        const { data: fieldsData, error: fieldsError } = await supabase
            .from('strategy_fields')
            .select('id, name, strategy_id')
            .limit(5);
            
        if (fieldsError) {
            console.error('❌ Error accessing strategy_fields table:', fieldsError);
        } else {
            console.log(`✅ Strategy_fields table OK - found ${fieldsData.length} records`);
            fieldsData.forEach(field => {
                console.log(`  📝 ${field.name}`);
            });
        }
        
        // Проверяем таблицу field_inputs
        console.log('🔍 Checking field_inputs table...');
        const { data: inputsData, error: inputsError } = await supabase
            .from('field_inputs')
            .select('id, label, type, options')
            .limit(5);
            
        if (inputsError) {
            console.error('❌ Error accessing field_inputs table:', inputsError);
        } else {
            console.log(`✅ Field_inputs table OK - found ${inputsData.length} records`);
            inputsData.forEach(input => {
                console.log(`  🔧 ${input.label} (${input.type})`);
            });
        }
        
        // Проверяем таблицу analysis_results
        console.log('🔍 Checking analysis_results table...');
        const { data: analysesData, error: analysesError } = await supabase
            .from('analysis_results')
            .select('id, created_at')
            .limit(5);
            
        if (analysesError) {
            console.error('❌ Error accessing analysis_results table:', analysesError);
        } else {
            console.log(`✅ Analysis_results table OK - found ${analysesData.length} records`);
        }
        
        // Проверяем таблицу users
        console.log('🔍 Checking users table...');
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, telegram_id')
            .limit(5);
            
        if (usersError) {
            console.error('❌ Error accessing users table:', usersError);
        } else {
            console.log(`✅ Users table OK - found ${usersData.length} records`);
        }
        
        console.log('✅ Database check completed');
        return true;
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
        return false;
    }
}

// Проверка полной структуры стратегий
async function checkStrategiesStructure() {
    try {
        console.log('🏗️ Checking strategies structure...');
        
        const { data: strategies, error } = await supabase
            .from('strategies')
            .select(`
                id,
                name,
                description,
                is_public,
                strategy_fields (
                    id,
                    name,
                    description,
                    sort_order,
                    field_inputs (
                        id,
                        type,
                        label,
                        required,
                        options,
                        sort_order
                    )
                )
            `)
            .eq('is_public', true);
            
        if (error) {
            console.error('❌ Error loading strategies structure:', error);
            return false;
        }
        
        console.log(`📊 Found ${strategies.length} public strategies:`);
        
        strategies.forEach(strategy => {
            console.log(`\n📋 Strategy: ${strategy.name}`);
            console.log(`   Description: ${strategy.description}`);
            console.log(`   Fields: ${strategy.strategy_fields.length}`);
            
            strategy.strategy_fields.forEach(field => {
                console.log(`   📝 Field: ${field.name}`);
                console.log(`      Inputs: ${field.field_inputs.length}`);
                
                field.field_inputs.forEach(input => {
                    console.log(`      🔧 ${input.label} (${input.type})`);
                    if (input.options && input.options.length > 0) {
                        console.log(`         Options: ${input.options.join(', ')}`);
                    }
                });
            });
        });
        
        return strategies.length > 0;
        
    } catch (error) {
        console.error('❌ Error checking strategies structure:', error);
        return false;
    }
}

// Экспорт функций
window.checkDatabaseTables = checkDatabaseTables;
window.checkStrategiesStructure = checkStrategiesStructure;

console.log('✅ Database check module loaded');
