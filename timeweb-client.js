// КЛИЕНТ ДЛЯ ПОДКЛЮЧЕНИЯ К TIMEWEB API
// Замена для supabase-config.js

const TIMEWEB_CONFIG = {
    // API endpoint на сервере Timeweb
    apiUrl: 'http://185.207.64.160/api',
    
    // Настройки для разработки
    development: {
        apiUrl: 'http://localhost:5000/api'
    },
    
    // Определение окружения
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

// Класс для работы с Timeweb API (эмуляция Supabase)
class TimewebClient {
    constructor(config) {
        this.config = config;
        this.apiUrl = config.isDevelopment ? config.development.apiUrl : config.apiUrl;
        console.log('🔗 Timeweb API URL:', this.apiUrl);
    }
    
    // Эмуляция Supabase .from() метода
    from(table) {
        return new TimewebTable(table, this.apiUrl);
    }
    
    // Прямой HTTP запрос
    async request(endpoint, options = {}) {
        try {
            const url = `${this.apiUrl}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Timeweb API request error:', error);
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
        this.whereConditions = {};
        this.orderByClause = '';
        this.limitClause = '';
        this.returnSingle = false;
        this.insertData = null; // Для поддержки insert().select()
    }
    
    eq(column, value) {
        this.whereConditions[column] = value;
        return this;
    }
    
    order(column, options = {}) {
        const direction = options.ascending === false ? 'desc' : 'asc';
        this.orderByClause = `${column}_${direction}`;
        return this;
    }
    
    limit(count) {
        this.limitClause = count;
        return this;
    }
    
    single() {
        this.returnSingle = true;
        return this;
    }
    
    // Выполнение SELECT запроса
    async execute() {
        try {
            const params = new URLSearchParams();
            
            // Добавляем telegram_user_id для фильтрации
            if (this.whereConditions.telegram_user_id) {
                params.append('telegram_user_id', this.whereConditions.telegram_user_id);
            }
            
            // Для strategies и analysis_results используем правильные эндпоинты
            let endpoint = this.tableName;
            if (this.tableName === 'strategies') {
                endpoint = 'strategies';
            } else if (this.tableName === 'analysis_results') {
                endpoint = 'analysis_results';
            }
            
            const url = `${this.apiUrl}/${endpoint}?${params.toString()}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (this.returnSingle && result.data && result.data.length > 0) {
                return { data: result.data[0], error: result.error };
            }
            
            return result;
            
        } catch (error) {
            console.error('Table query error:', error);
            return { data: null, error: error.message };
        }
    }
    
    // INSERT операция
    insert(data) {
        // Сохраняем данные для вставки
        this.insertData = data;
        // Возвращаем this для поддержки .select()
        return this;
    }
    
    // Метод select() - универсальный для SELECT и после INSERT
    select(columns = '*') {
        if (this.insertData) {
            // Это вызов после insert() - выполняем вставку асинхронно
            const insertPromise = (async () => {
                try {
                    const data = this.insertData;
                    
                    // Добавляем telegram_user_id если есть Telegram данные
                    const telegramUserId = this.getTelegramUserId();
                    if (telegramUserId) {
                        data.telegram_user_id = telegramUserId;
                    }
                    
                    // Используем правильные эндпоинты
                    let endpoint = this.tableName;
                    if (this.tableName === 'strategies') {
                        endpoint = 'strategies';
                    } else if (this.tableName === 'analysis_results') {
                        endpoint = 'analysis_results';
                    }
                    
                    const response = await fetch(`${this.apiUrl}/${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    this.insertData = null; // Очищаем
                    return result;
                    
                } catch (error) {
                    console.error('Insert error:', error);
                    this.insertData = null;
                    return { data: null, error: error.message };
                }
            })();
            
            // Возвращаем промис напрямую (для await)
            return insertPromise;
        } else {
            // Это обычный select для SELECT запроса
            this.selectColumns = columns;
            return this;
        }
    }
    
    // UPDATE операция
    async update(data) {
        try {
            // Для обновления нужен ID из условий
            const id = this.whereConditions.id;
            if (!id) {
                throw new Error('ID is required for update operation');
            }
            
            // Используем правильные эндпоинты
            let endpoint = this.tableName;
            if (this.tableName === 'strategies') {
                endpoint = 'strategies';
            } else if (this.tableName === 'analysis_results') {
                endpoint = 'analysis_results';
            }
            
            const response = await fetch(`${this.apiUrl}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Update error:', error);
            return { data: null, error: error.message };
        }
    }
    
    // DELETE операция
    async delete() {
        try {
            const id = this.whereConditions.id;
            if (!id) {
                throw new Error('ID is required for delete operation');
            }
            
            // Используем правильные эндпоинты
            let endpoint = this.tableName;
            if (this.tableName === 'strategies') {
                endpoint = 'strategies';
            } else if (this.tableName === 'analysis_results') {
                endpoint = 'analysis_results';
            }
            
            const response = await fetch(`${this.apiUrl}/${endpoint}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return { error: null };
            
        } catch (error) {
            console.error('Delete error:', error);
            return { error: error.message };
        }
    }
    
    // Получение Telegram User ID
    getTelegramUserId() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            return window.Telegram.WebApp.initDataUnsafe.user?.id?.toString();
        }
        return null;
    }
}

// Специальные методы для совместимости с текущим кодом
class TimewebCompatibility {
    constructor(client) {
        this.client = client;
    }
    
    // Получение статистики пользователя
    async getUserStats() {
        const telegramUserId = this.getTelegramUserId();
        if (!telegramUserId) {
            return { data: { strategies: 0, analyses: 0 }, error: null };
        }
        
        try {
            const response = await fetch(`${this.client.apiUrl}/users/stats/${telegramUserId}`);
            const result = await response.json();
            return result;
        } catch (error) {
            return { data: { strategies: 0, analyses: 0 }, error: error.message };
        }
    }
    
    // Проверка здоровья API
    async healthCheck() {
        try {
            const response = await fetch(`${this.client.apiUrl}/health`);
            const result = await response.json();
            return result;
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
    
    getTelegramUserId() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            return window.Telegram.WebApp.initDataUnsafe.user?.id?.toString();
        }
        return null;
    }
}

// Инициализация клиента
let timewebClient;
let timewebCompat;

function initializeTimeweb() {
    try {
        timewebClient = new TimewebClient(TIMEWEB_CONFIG);
        timewebCompat = new TimewebCompatibility(timewebClient);
        
        // Заменяем window.supabase для совместимости с текущим кодом
        window.supabase = timewebClient;
        
        // Добавляем дополнительные методы
        window.supabase.getUserStats = timewebCompat.getUserStats.bind(timewebCompat);
        window.supabase.healthCheck = timewebCompat.healthCheck.bind(timewebCompat);
        
        console.log('✅ Timeweb client initialized successfully');
        console.log('🔗 API URL:', timewebClient.apiUrl);
        
        return timewebClient;
        
    } catch (error) {
        console.error('❌ Error initializing Timeweb client:', error);
        return null;
    }
}

// Функция проверки подключения
async function testTimewebConnection() {
    try {
        if (!timewebCompat) {
            console.error('Timeweb client not initialized');
            return false;
        }
        
        const health = await timewebCompat.healthCheck();
        
        if (health.status === 'healthy') {
            console.log('✅ Timeweb connection successful');
            return true;
        } else {
            console.error('❌ Timeweb connection failed:', health.error);
            return false;
        }
    } catch (err) {
        console.error('❌ Timeweb connection test failed:', err);
        return false;
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing Timeweb client...');
    
    const client = initializeTimeweb();
    if (client) {
        // Тестируем подключение через 2 секунды
        setTimeout(testTimewebConnection, 2000);
    }
});

// Экспорт для использования в других файлах
window.TIMEWEB_CONFIG = TIMEWEB_CONFIG;
window.initializeTimeweb = initializeTimeweb;
window.testTimewebConnection = testTimewebConnection;

console.log('🔧 Timeweb client configuration loaded');
