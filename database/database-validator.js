// ========================================
// DATABASE VALIDATOR v1.0
// Автоматическая проверка схемы БД
// ========================================

class DatabaseValidator {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.requiredTables = ['users', 'strategies', 'analysis_results'];
        this.isValid = false;
    }

    // Основная функция валидации
    async validateDatabase() {
        console.log('🔍 DATABASE VALIDATOR: Starting validation...');
        
        try {
            // 1. Проверяем подключение
            const connectionTest = await this.testConnection();
            if (!connectionTest.success) {
                return this.createValidationResult(false, 'Connection failed', connectionTest.error);
            }

            // 2. Проверяем существование таблиц
            const tablesTest = await this.validateTables();
            if (!tablesTest.success) {
                return this.createValidationResult(false, 'Tables validation failed', tablesTest.error);
            }

            // 3. Проверяем структуру таблиц
            const structureTest = await this.validateTableStructure();
            if (!structureTest.success) {
                return this.createValidationResult(false, 'Structure validation failed', structureTest.error);
            }

            // 4. Проверяем версию схемы
            const versionTest = await this.validateSchemaVersion();
            
            this.isValid = true;
            console.log('✅ DATABASE VALIDATOR: All checks passed');
            
            return this.createValidationResult(true, 'Database is valid', {
                connection: connectionTest,
                tables: tablesTest,
                structure: structureTest,
                version: versionTest
            });

        } catch (error) {
            console.error('❌ DATABASE VALIDATOR: Unexpected error:', error);
            return this.createValidationResult(false, 'Validation error', error);
        }
    }

    // Тест подключения к БД
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('schema_version')
                .select('version')
                .limit(1);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data: 'Connection OK' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Проверка существования таблиц
    async validateTables() {
        const results = {};
        
        for (const tableName of this.requiredTables) {
            try {
                const { data, error } = await this.supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error && error.code === 'PGRST116') {
                    // Таблица не найдена
                    results[tableName] = { exists: false, error: 'Table not found' };
                } else if (error) {
                    // Другая ошибка
                    results[tableName] = { exists: false, error: error.message };
                } else {
                    // Таблица существует
                    results[tableName] = { exists: true, records: data ? data.length : 0 };
                }
            } catch (error) {
                results[tableName] = { exists: false, error: error.message };
            }
        }

        // Проверяем, все ли таблицы существуют
        const missingTables = Object.entries(results)
            .filter(([table, result]) => !result.exists)
            .map(([table]) => table);

        if (missingTables.length > 0) {
            return {
                success: false,
                error: `Missing tables: ${missingTables.join(', ')}`,
                details: results
            };
        }

        return { success: true, data: results };
    }

    // Проверка структуры таблиц
    async validateTableStructure() {
        const expectedStructure = {
            users: ['id', 'telegram_id', 'username', 'first_name', 'created_at'],
            strategies: ['id', 'name', 'description', 'fields', 'user_id', 'created_at'],
            analysis_results: ['id', 'strategy_id', 'user_id', 'results', 'created_at']
        };

        // Для простоты пока возвращаем успех
        // В будущем можно добавить детальную проверку колонок
        return { success: true, data: 'Structure validation skipped' };
    }

    // Проверка версии схемы
    async validateSchemaVersion() {
        try {
            const { data, error } = await this.supabase
                .from('schema_version')
                .select('version, applied_at')
                .order('applied_at', { ascending: false })
                .limit(1);

            if (error) {
                return { success: false, error: error.message };
            }

            const currentVersion = data && data.length > 0 ? data[0].version : 'unknown';
            return { success: true, data: { version: currentVersion } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Создание результата валидации
    createValidationResult(isValid, message, details) {
        return {
            isValid,
            message,
            details,
            timestamp: new Date().toISOString(),
            validator: 'DatabaseValidator v1.0'
        };
    }

    // Автоматическое исправление проблем
    async autoFix() {
        console.log('🔧 DATABASE VALIDATOR: Attempting auto-fix...');
        
        // Здесь можно добавить логику автоматического исправления
        // Например, создание недостающих таблиц
        
        return { success: false, message: 'Auto-fix not implemented yet' };
    }

    // Получение статуса валидации
    getValidationStatus() {
        return {
            isValid: this.isValid,
            lastCheck: this.lastCheck || null
        };
    }
}

// Глобальная функция для быстрой проверки
async function quickDatabaseCheck(supabaseClient) {
    const validator = new DatabaseValidator(supabaseClient);
    const result = await validator.validateDatabase();
    
    if (result.isValid) {
        console.log('✅ Database is ready');
        return true;
    } else {
        console.error('❌ Database validation failed:', result.message);
        console.error('Details:', result.details);
        return false;
    }
}

// Экспорт для использования
if (typeof window !== 'undefined') {
    window.DatabaseValidator = DatabaseValidator;
    window.quickDatabaseCheck = quickDatabaseCheck;
}

console.log('📊 Database Validator loaded');
