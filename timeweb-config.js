// КОНФИГУРАЦИЯ ПОДКЛЮЧЕНИЯ К TIMEWEB POSTGRESQL
// Замена для supabase-config.js

const TIMEWEB_CONFIG = {
    // Настройки подключения к PostgreSQL на Timeweb
    host: 'your-server.timeweb.ru', // Замените на ваш хост
    port: 5432,
    database: 'tradeanalyzer',
    username: 'tradeanalyzer_app',
    password: 'SECURE_PASSWORD_HERE', // Замените на безопасный пароль
    ssl: true,
    
    // API endpoint для запросов (будет создан на сервере)
    apiUrl: 'https://your-server.timeweb.ru/api',
    
    // Настройки для разработки
    development: {
        host: 'localhost',
        port: 5432,
        database: 'tradeanalyzer_dev'
    }
};

// Класс для работы с Timeweb PostgreSQL
class TimewebClient {
    constructor(config) {
        this.config = config;
        this.apiUrl = config.apiUrl;
    }
    
    // Эмуляция Supabase API для совместимости
    from(table) {
        return new TimewebTable(table, this.apiUrl);
    }
    
    // Метод для прямых SQL запросов
    async query(sql, params = []) {
        try {
            const response = await fetch(`${this.apiUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql, params })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return { data: result.rows, error: null };
        } catch (error) {
            console.error('Database query error:', error);
            return { data: null, error: error.message };
        }
    }
}

// Класс для работы с таблицами (эмуляция Supabase)
class TimewebTable {
    constructor(tableName, apiUrl) {
        this.tableName = tableName;
        this.apiUrl = apiUrl;
        this.selectColumns = '*';
        this.whereConditions = [];
        this.orderByClause = '';
        this.limitClause = '';
    }
    
    select(columns = '*') {
        this.selectColumns = columns;
        return this;
    }
    
    eq(column, value) {
        this.whereConditions.push(`${column} = '${value}'`);
        return this;
    }
    
    order(column, options = {}) {
        const direction = options.ascending === false ? 'DESC' : 'ASC';
        this.orderByClause = `ORDER BY ${column} ${direction}`;
        return this;
    }
    
    limit(count) {
        this.limitClause = `LIMIT ${count}`;
        return this;
    }
    
    single() {
        this.limitClause = 'LIMIT 1';
        this.returnSingle = true;
        return this;
    }
    
    async execute() {
        try {
            let sql = `SELECT ${this.selectColumns} FROM ${this.tableName}`;
            
            if (this.whereConditions.length > 0) {
                sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
            }
            
            if (this.orderByClause) {
                sql += ` ${this.orderByClause}`;
            }
            
            if (this.limitClause) {
                sql += ` ${this.limitClause}`;
            }
            
            const response = await fetch(`${this.apiUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (this.returnSingle) {
                return { data: result.rows[0] || null, error: null };
            }
            
            return { data: result.rows, error: null };
            
        } catch (error) {
            console.error('Table query error:', error);
            return { data: null, error: error.message };
        }
    }
    
    // Методы для INSERT, UPDATE, DELETE
    async insert(data) {
        try {
            const columns = Object.keys(data).join(', ');
            const values = Object.values(data).map(v => `'${v}'`).join(', ');
            const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${values}) RETURNING *`;
            
            const response = await fetch(`${this.apiUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql })
            });
            
            const result = await response.json();
            return { data: result.rows[0], error: null };
            
        } catch (error) {
            return { data: null, error: error.message };
        }
    }
    
    async update(data) {
        try {
            const setClause = Object.entries(data)
                .map(([key, value]) => `${key} = '${value}'`)
                .join(', ');
                
            let sql = `UPDATE ${this.tableName} SET ${setClause}`;
            
            if (this.whereConditions.length > 0) {
                sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
            }
            
            sql += ' RETURNING *';
            
            const response = await fetch(`${this.apiUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql })
            });
            
            const result = await response.json();
            return { data: result.rows, error: null };
            
        } catch (error) {
            return { data: null, error: error.message };
        }
    }
    
    async delete() {
        try {
            let sql = `DELETE FROM ${this.tableName}`;
            
            if (this.whereConditions.length > 0) {
                sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
            }
            
            const response = await fetch(`${this.apiUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql })
            });
            
            return { error: null };
            
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Инициализация клиента
let timewebClient;

function initializeTimeweb() {
    try {
        timewebClient = new TimewebClient(TIMEWEB_CONFIG);
        
        // Заменяем window.supabase для совместимости
        window.supabase = timewebClient;
        
        console.log('✅ Timeweb client initialized successfully');
        console.log('🔗 API URL:', TIMEWEB_CONFIG.apiUrl);
        
        return timewebClient;
        
    } catch (error) {
        console.error('❌ Error initializing Timeweb client:', error);
        return null;
    }
}

// Функция проверки подключения
async function testTimewebConnection() {
    try {
        const { data, error } = await timewebClient.query('SELECT 1 as test');
        
        if (error) {
            console.error('Timeweb connection error:', error);
            return false;
        }
        
        console.log('✅ Timeweb connection successful');
        return true;
    } catch (err) {
        console.error('Timeweb connection failed:', err);
        return false;
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing Timeweb client...');
    
    const client = initializeTimeweb();
    if (client) {
        // Тестируем подключение через 1 секунду
        setTimeout(testTimewebConnection, 1000);
    }
});

// Экспорт для использования в других файлах
window.TIMEWEB_CONFIG = TIMEWEB_CONFIG;
window.initializeTimeweb = initializeTimeweb;
window.testTimewebConnection = testTimewebConnection;
