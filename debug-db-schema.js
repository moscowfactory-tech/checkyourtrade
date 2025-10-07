// ОТЛАДОЧНЫЙ СКРИПТ ДЛЯ ПРОВЕРКИ СХЕМЫ БД
// Запустить в консоли браузера после загрузки страницы

async function debugDatabaseSchema() {
    console.log('🔍 DEBUGGING DATABASE SCHEMA...');
    
    if (!window.supabase) {
        console.error('❌ Supabase not initialized');
        return;
    }
    
    try {
        // 1. Проверяем таблицу strategies
        console.log('\n📋 CHECKING STRATEGIES TABLE:');
        const { data: strategies, error: strategiesError } = await window.supabase
            .from('strategies')
            .select('*')
            .limit(1);
            
        if (strategiesError) {
            console.error('❌ Strategies table error:', strategiesError);
        } else {
            console.log('✅ Strategies table exists');
            if (strategies && strategies.length > 0) {
                console.log('📊 Sample strategy structure:', Object.keys(strategies[0]));
                console.log('📊 Sample strategy data:', strategies[0]);
            } else {
                console.log('📊 Strategies table is empty');
            }
        }
        
        // 2. Проверяем таблицу users
        console.log('\n👥 CHECKING USERS TABLE:');
        const { data: users, error: usersError } = await window.supabase
            .from('users')
            .select('*')
            .limit(1);
            
        if (usersError) {
            console.error('❌ Users table error:', usersError);
        } else {
            console.log('✅ Users table exists');
            if (users && users.length > 0) {
                console.log('📊 Sample user structure:', Object.keys(users[0]));
                console.log('📊 Sample user data:', users[0]);
            } else {
                console.log('📊 Users table is empty');
            }
        }
        
        // 3. Проверяем таблицу analyses/analysis_results
        console.log('\n📈 CHECKING ANALYSES TABLE:');
        const { data: analyses, error: analysesError } = await window.supabase
            .from('analyses')
            .select('*')
            .limit(1);
            
        if (analysesError) {
            console.log('⚠️ "analyses" table not found, trying "analysis_results"...');
            
            const { data: analysisResults, error: analysisResultsError } = await window.supabase
                .from('analysis_results')
                .select('*')
                .limit(1);
                
            if (analysisResultsError) {
                console.error('❌ Neither "analyses" nor "analysis_results" table found:', analysisResultsError);
            } else {
                console.log('✅ analysis_results table exists');
                if (analysisResults && analysisResults.length > 0) {
                    console.log('📊 Sample analysis structure:', Object.keys(analysisResults[0]));
                } else {
                    console.log('📊 analysis_results table is empty');
                }
            }
        } else {
            console.log('✅ analyses table exists');
            if (analyses && analyses.length > 0) {
                console.log('📊 Sample analysis structure:', Object.keys(analyses[0]));
            } else {
                console.log('📊 analyses table is empty');
            }
        }
        
        // 4. Проверяем текущего пользователя Telegram
        console.log('\n👤 CHECKING CURRENT USER:');
        const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
        console.log('📱 Telegram User ID:', telegramUserId);
        
        if (telegramUserId) {
            const { data: currentUser } = await window.supabase
                .from('users')
                .select('*')
                .eq('telegram_id', telegramUserId)
                .single();
                
            if (currentUser) {
                console.log('✅ Current user found in DB:', currentUser);
            } else {
                console.log('⚠️ Current user NOT found in DB');
            }
        }
        
        console.log('\n🏁 DATABASE SCHEMA DEBUG COMPLETE');
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}

// Автоматически запускаем через 3 секунды после загрузки
setTimeout(() => {
    debugDatabaseSchema();
}, 3000);

// Также делаем доступным для ручного вызова
window.debugDatabaseSchema = debugDatabaseSchema;
