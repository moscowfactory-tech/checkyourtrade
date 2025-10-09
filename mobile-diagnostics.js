// 📱 МОБИЛЬНАЯ ДИАГНОСТИКА ДЛЯ TELEGRAM WEBAPP
// Показывает результаты прямо в интерфейсе

// Создаем диагностическую панель
function createDiagnosticPanel() {
    // Удаляем старую панель если есть
    const existingPanel = document.getElementById('diagnosticPanel');
    if (existingPanel) {
        existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'diagnosticPanel';
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        right: 10px;
        background: #1a1a1a;
        color: #00ff00;
        padding: 15px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid #00ff00;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #00ff00;
    `;
    
    const title = document.createElement('h3');
    title.textContent = '🔍 TELEGRAM WEBAPP DIAGNOSTICS';
    title.style.cssText = 'margin: 0; color: #00ff00;';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌';
    closeBtn.style.cssText = `
        background: #ff0000;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
    `;
    closeBtn.onclick = () => panel.remove();
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.id = 'diagnosticContent';
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #333;
    `;
    
    // Кнопки диагностики
    const buttons = [
        { text: '🔍 Полная диагностика', action: 'fullDiagnostic' },
        { text: '👥 Проверить пользователей', action: 'checkUsers' },
        { text: '🔧 Синхронизация пользователя', action: 'syncUser' },
        { text: '📊 Тест загрузки', action: 'testLoad' },
        { text: '🔒 Тест доступа БД', action: 'fixRLS' },
        { text: '🔍 Детальная синхронизация', action: 'detailedSync' },
        { text: '🧪 Создать тест', action: 'createTest' },
        { text: '🔄 Очистить', action: 'clear' }
    ];
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.cssText = `
            background: #333;
            color: #00ff00;
            border: 1px solid #00ff00;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 11px;
        `;
        button.onclick = () => handleDiagnosticAction(btn.action);
        buttonsDiv.appendChild(button);
    });
    
    panel.appendChild(header);
    panel.appendChild(buttonsDiv);
    panel.appendChild(content);
    document.body.appendChild(panel);
    
    return content;
}

// Обработчик действий диагностики
async function handleDiagnosticAction(action) {
    const content = document.getElementById('diagnosticContent');
    
    switch (action) {
        case 'clear':
            content.innerHTML = '';
            break;
        case 'fullDiagnostic':
            await runFullMobileDiagnostic();
            break;
        case 'checkUsers':
            await checkUsersVisual();
            break;
        case 'testLoad':
            await testLoadVisual();
            break;
        case 'createTest':
            await createTestVisual();
            break;
        case 'syncUser':
            await syncUserVisual();
            break;
        case 'fixRLS':
            await fixRLSVisual();
            break;
        case 'detailedSync':
            await detailedSyncVisual();
            break;
    }
}

// Добавить сообщение в панель
function addDiagnosticMessage(message, type = 'info') {
    const content = document.getElementById('diagnosticContent');
    if (!content) return;
    
    const colors = {
        info: '#00ff00',
        error: '#ff0000',
        warning: '#ffff00',
        success: '#00ff00'
    };
    
    const div = document.createElement('div');
    div.style.cssText = `
        margin: 5px 0;
        padding: 5px;
        color: ${colors[type] || colors.info};
        border-left: 3px solid ${colors[type] || colors.info};
        padding-left: 10px;
    `;
    div.textContent = message;
    content.appendChild(div);
    content.scrollTop = content.scrollHeight;
}

// Полная диагностика
async function runFullMobileDiagnostic() {
    addDiagnosticMessage('🔍 Starting full diagnostic...', 'info');
    
    // Проверка окружения
    const isTelegram = !!(window.Telegram && window.Telegram.WebApp);
    addDiagnosticMessage(`📱 Telegram WebApp: ${isTelegram ? '✅ YES' : '❌ NO'}`, isTelegram ? 'success' : 'error');
    
    // Проверка Supabase
    const hasSupabase = !!window.supabase;
    addDiagnosticMessage(`💾 Supabase: ${hasSupabase ? '✅ YES' : '❌ NO'}`, hasSupabase ? 'success' : 'error');
    
    // Проверка UserManager
    const hasUserManager = !!(window.userManager && window.userManager.isInitialized);
    addDiagnosticMessage(`👤 UserManager: ${hasUserManager ? '✅ READY' : '❌ NOT READY'}`, hasUserManager ? 'success' : 'error');
    
    if (hasUserManager) {
        const user = window.userManager.getCurrentUser();
        let userId = window.userManager.getUserId();
        const telegramId = window.userManager.getTelegramId();
        
        addDiagnosticMessage(`👤 User Type: ${user?.type || 'unknown'}`, 'info');
        addDiagnosticMessage(`👤 Telegram ID: ${telegramId || 'none'}`, 'info');
        addDiagnosticMessage(`👤 User UUID (before): ${userId || 'none'}`, userId ? 'success' : 'error');
        
        // Если UUID нет, принудительно вызываем ensureUserInDatabase
        if (!userId && hasSupabase) {
            addDiagnosticMessage('🔧 Forcing user database sync...', 'warning');
            try {
                await window.userManager.ensureUserInDatabase();
                userId = window.userManager.getUserId();
                addDiagnosticMessage(`👤 User UUID (after sync): ${userId || 'still none'}`, userId ? 'success' : 'error');
            } catch (err) {
                addDiagnosticMessage(`❌ Error syncing user: ${err.message}`, 'error');
            }
        }
    }
    
    // Проверка стратегий
    const strategiesCount = window.strategies ? window.strategies.length : 0;
    addDiagnosticMessage(`📊 Local Strategies: ${strategiesCount}`, strategiesCount > 0 ? 'success' : 'warning');
    
    addDiagnosticMessage('✅ Full diagnostic completed', 'success');
}

// Проверка пользователей
async function checkUsersVisual() {
    addDiagnosticMessage('👥 Checking users in database...', 'info');
    
    if (!window.supabase) {
        addDiagnosticMessage('❌ Supabase not available', 'error');
        return;
    }
    
    try {
        const { data: users, error } = await window.supabase
            .from('users')
            .select('*');
        
        if (error) {
            addDiagnosticMessage(`❌ Error: ${error.message}`, 'error');
        } else {
            addDiagnosticMessage(`👥 Total users in DB: ${users?.length || 0}`, 'success');
            
            if (users && users.length > 0) {
                users.forEach((user, index) => {
                    addDiagnosticMessage(`  ${index + 1}. ID: ${user.telegram_id}, Name: ${user.first_name || 'Unknown'}`, 'info');
                });
            }
        }
    } catch (err) {
        addDiagnosticMessage(`❌ Exception: ${err.message}`, 'error');
    }
}

// Тест загрузки стратегий
async function testLoadVisual() {
    addDiagnosticMessage('📊 Testing strategies load...', 'info');
    
    if (!window.userManager || !window.userManager.isInitialized) {
        addDiagnosticMessage('❌ User manager not ready', 'error');
        return;
    }
    
    const userId = window.userManager.getUserId();
    addDiagnosticMessage(`👤 Loading for user: ${userId}`, 'info');
    
    if (!userId) {
        addDiagnosticMessage('❌ No user ID available', 'error');
        return;
    }
    
    try {
        const { data, error } = await window.supabase
            .from('strategies')
            .select('*')
            .eq('user_id', userId);
        
        if (error) {
            addDiagnosticMessage(`❌ Load error: ${error.message}`, 'error');
        } else {
            addDiagnosticMessage(`✅ Found ${data?.length || 0} strategies`, 'success');
            
            if (data && data.length > 0) {
                data.forEach((strategy, index) => {
                    addDiagnosticMessage(`  ${index + 1}. ${strategy.name}`, 'info');
                });
            }
        }
    } catch (err) {
        addDiagnosticMessage(`❌ Exception: ${err.message}`, 'error');
    }
}

// Создание тестовой стратегии
async function createTestVisual() {
    addDiagnosticMessage('🧪 Creating test strategy...', 'info');
    
    if (!window.userManager || !window.userManager.isInitialized) {
        addDiagnosticMessage('❌ User manager not ready', 'error');
        return;
    }
    
    const userId = window.userManager.getUserId();
    if (!userId) {
        addDiagnosticMessage('❌ No user ID available', 'error');
        return;
    }
    
    try {
        const testStrategy = {
            name: `Test Strategy ${Date.now()}`,
            description: 'Mobile diagnostic test',
            fields: [{
                name: 'Test Field',
                description: 'Test',
                inputs: [{
                    type: 'text',
                    label: 'Test Input',
                    required: true
                }]
            }],
            user_id: userId
        };
        
        const { data, error } = await window.supabase
            .from('strategies')
            .insert(testStrategy)
            .select()
            .single();
        
        if (error) {
            addDiagnosticMessage(`❌ Create error: ${error.message}`, 'error');
        } else {
            addDiagnosticMessage(`✅ Test strategy created: ${data.name}`, 'success');
            
            // Перезагружаем стратегии
            if (typeof loadStrategiesFromDatabase === 'function') {
                await loadStrategiesFromDatabase();
                addDiagnosticMessage('🔄 Strategies reloaded', 'info');
            }
        }
    } catch (err) {
        addDiagnosticMessage(`❌ Exception: ${err.message}`, 'error');
    }
}

// Синхронизация пользователя
async function syncUserVisual() {
    addDiagnosticMessage('🔧 Syncing user with database...', 'info');
    
    if (!window.userManager || !window.userManager.isInitialized) {
        addDiagnosticMessage('❌ User manager not ready', 'error');
        return;
    }
    
    if (!window.supabase) {
        addDiagnosticMessage('❌ Supabase not available', 'error');
        return;
    }
    
    try {
        const beforeUserId = window.userManager.getUserId();
        addDiagnosticMessage(`👤 UUID before sync: ${beforeUserId || 'none'}`, 'info');
        
        // Принудительная синхронизация
        await window.userManager.ensureUserInDatabase();
        
        const afterUserId = window.userManager.getUserId();
        addDiagnosticMessage(`👤 UUID after sync: ${afterUserId || 'still none'}`, afterUserId ? 'success' : 'error');
        
        if (afterUserId) {
            addDiagnosticMessage('✅ User sync successful!', 'success');
            
            // Пробуем загрузить стратегии
            if (typeof loadStrategiesFromDatabase === 'function') {
                addDiagnosticMessage('🔄 Reloading strategies...', 'info');
                await loadStrategiesFromDatabase();
                const strategiesCount = window.strategies ? window.strategies.length : 0;
                addDiagnosticMessage(`📊 Strategies loaded: ${strategiesCount}`, strategiesCount > 0 ? 'success' : 'warning');
            }
        } else {
            addDiagnosticMessage('❌ User sync failed - UUID still missing', 'error');
        }
        
    } catch (err) {
        addDiagnosticMessage(`❌ Sync error: ${err.message}`, 'error');
    }
}

// Простое тестирование без RLS (отключение RLS)
async function fixRLSVisual() {
    addDiagnosticMessage('🔒 Testing database access without RLS...', 'info');
    
    if (!window.supabase) {
        addDiagnosticMessage('❌ Supabase not available', 'error');
        return;
    }
    
    try {
        addDiagnosticMessage('📊 Trying direct strategies access...', 'info');
        
        // Пробуем прямой доступ к стратегиям без фильтров
        const { data: allStrategies, error: allError } = await window.supabase
            .from('strategies')
            .select('*');
        
        if (allError) {
            addDiagnosticMessage(`❌ Direct access error: ${allError.message}`, 'error');
            addDiagnosticMessage('📝 Error details: ' + JSON.stringify(allError), 'error');
        } else {
            addDiagnosticMessage(`✅ Direct access works! Found ${allStrategies?.length || 0} total strategies`, 'success');
            
            if (allStrategies && allStrategies.length > 0) {
                addDiagnosticMessage('📊 Strategies in database:', 'info');
                allStrategies.forEach((strategy, index) => {
                    addDiagnosticMessage(`  ${index + 1}. ${strategy.name} (user: ${strategy.user_id})`, 'info');
                });
            }
        }
        
        // Проверяем доступ с фильтром по user_id
        if (window.userManager && window.userManager.isInitialized) {
            const userId = window.userManager.getUserId();
            if (userId) {
                addDiagnosticMessage(`👤 Testing filtered access for user: ${userId}`, 'info');
                
                const { data: userStrategies, error: userError } = await window.supabase
                    .from('strategies')
                    .select('*')
                    .eq('user_id', userId);
                
                if (userError) {
                    addDiagnosticMessage(`❌ Filtered access error: ${userError.message}`, 'error');
                } else {
                    addDiagnosticMessage(`✅ Filtered access works! Found ${userStrategies?.length || 0} user strategies`, 'success');
                    
                    // Обновляем локальные стратегии
                    if (userStrategies && Array.isArray(userStrategies)) {
                        window.strategies = userStrategies;
                        addDiagnosticMessage(`🔄 Updated local strategies: ${window.strategies.length}`, 'success');
                        
                        // Обновляем UI
                        if (typeof updateStrategySelect === 'function') {
                            updateStrategySelect();
                        }
                        if (typeof renderStrategies === 'function') {
                            renderStrategies();
                        }
                    }
                }
            }
        }
        
        addDiagnosticMessage('✅ Database access test completed!', 'success');
        
    } catch (err) {
        addDiagnosticMessage(`❌ Test error: ${err.message}`, 'error');
    }
}

// Детальная синхронизация с анализом архитектуры
async function detailedSyncVisual() {
    addDiagnosticMessage('🔍 DETAILED ARCHITECTURE ANALYSIS...', 'info');
    
    if (!window.supabase) {
        addDiagnosticMessage('❌ Supabase not available', 'error');
        return;
    }
    
    try {
        // 1. Анализ всех пользователей в БД
        addDiagnosticMessage('👥 Step 1: Analyzing all users in database...', 'info');
        
        const { data: allUsers, error: usersError } = await window.supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (usersError) {
            addDiagnosticMessage(`❌ Users query error: ${usersError.message}`, 'error');
            return;
        }
        
        addDiagnosticMessage(`📊 Total users in database: ${allUsers?.length || 0}`, 'success');
        
        // Анализ типов пользователей
        const browserUsers = allUsers?.filter(u => u.telegram_id < 0) || [];
        const telegramUsers = allUsers?.filter(u => u.telegram_id > 0) || [];
        
        addDiagnosticMessage(`💻 Browser users (negative IDs): ${browserUsers.length}`, 'info');
        addDiagnosticMessage(`📱 Telegram users (positive IDs): ${telegramUsers.length}`, 'info');
        
        // Показываем пользователей
        if (allUsers && allUsers.length > 0) {
            addDiagnosticMessage('📝 Users breakdown:', 'info');
            allUsers.forEach((user, index) => {
                const type = user.telegram_id < 0 ? 'BROWSER' : 'TELEGRAM';
                addDiagnosticMessage(`  ${index + 1}. [${type}] ID: ${user.telegram_id}, Name: ${user.first_name}, UUID: ${user.id.substring(0, 8)}...`, 'info');
            });
        }
        
        // 2. Анализ стратегий
        addDiagnosticMessage('📊 Step 2: Analyzing strategies distribution...', 'info');
        
        const { data: allStrategies, error: strategiesError } = await window.supabase
            .from('strategies')
            .select('*, users!inner(telegram_id, first_name)')
            .order('created_at', { ascending: false });
        
        if (strategiesError) {
            addDiagnosticMessage(`❌ Strategies query error: ${strategiesError.message}`, 'error');
        } else {
            addDiagnosticMessage(`📊 Total strategies: ${allStrategies?.length || 0}`, 'success');
            
            if (allStrategies && allStrategies.length > 0) {
                const browserStrategies = allStrategies.filter(s => s.users.telegram_id < 0);
                const telegramStrategies = allStrategies.filter(s => s.users.telegram_id > 0);
                
                addDiagnosticMessage(`💻 Browser strategies: ${browserStrategies.length}`, 'info');
                addDiagnosticMessage(`📱 Telegram strategies: ${telegramStrategies.length}`, 'info');
                
                // Показываем стратегии
                addDiagnosticMessage('📝 Strategies breakdown:', 'info');
                allStrategies.slice(0, 5).forEach((strategy, index) => {
                    const type = strategy.users.telegram_id < 0 ? 'BROWSER' : 'TELEGRAM';
                    addDiagnosticMessage(`  ${index + 1}. [${type}] "${strategy.name}" by ${strategy.users.first_name}`, 'info');
                });
                
                if (allStrategies.length > 5) {
                    addDiagnosticMessage(`  ... and ${allStrategies.length - 5} more`, 'info');
                }
            }
        }
        
        // 3. Текущий пользователь Telegram
        addDiagnosticMessage('👤 Step 3: Current Telegram user analysis...', 'info');
        
        if (window.userManager && window.userManager.isInitialized) {
            const currentUser = window.userManager.getCurrentUser();
            const telegramId = window.userManager.getTelegramId();
            
            addDiagnosticMessage(`📱 Current Telegram ID: ${telegramId}`, 'info');
            
            // Проверяем, есть ли этот пользователь в БД
            const existingTelegramUser = allUsers?.find(u => u.telegram_id === telegramId);
            
            if (existingTelegramUser) {
                addDiagnosticMessage(`✅ Telegram user EXISTS in database!`, 'success');
                addDiagnosticMessage(`👤 User UUID: ${existingTelegramUser.id}`, 'success');
                
                // Присваиваем UUID
                window.userManager.currentUser.uuid = existingTelegramUser.id;
                addDiagnosticMessage(`🔧 UUID assigned to current user!`, 'success');
                
                // Проверяем стратегии этого пользователя
                const userStrategies = allStrategies?.filter(s => s.user_id === existingTelegramUser.id) || [];
                addDiagnosticMessage(`📊 User has ${userStrategies.length} strategies`, userStrategies.length > 0 ? 'success' : 'warning');
                
                if (userStrategies.length > 0) {
                    // Обновляем локальные стратегии
                    window.strategies = userStrategies;
                    addDiagnosticMessage(`🔄 Local strategies updated: ${window.strategies.length}`, 'success');
                    
                    // Обновляем UI
                    if (typeof updateStrategySelect === 'function') {
                        updateStrategySelect();
                    }
                    if (typeof renderStrategies === 'function') {
                        renderStrategies();
                    }
                }
            } else {
                addDiagnosticMessage(`❌ Telegram user NOT FOUND in database`, 'error');
                addDiagnosticMessage(`🆕 Need to create user for telegram_id: ${telegramId}`, 'warning');
                
                // Пробуем создать
                addDiagnosticMessage(`🔧 Attempting to create user...`, 'info');
                const success = await window.userManager.ensureUserInDatabase();
                
                if (success) {
                    addDiagnosticMessage(`✅ User created successfully!`, 'success');
                } else {
                    addDiagnosticMessage(`❌ User creation failed`, 'error');
                }
            }
        }
        
        addDiagnosticMessage('✅ DETAILED ANALYSIS COMPLETED!', 'success');
        
    } catch (err) {
        addDiagnosticMessage(`❌ Analysis error: ${err.message}`, 'error');
    }
}

// Добавляем кнопку диагностики в интерфейс
function addDiagnosticButton() {
    // Проверяем, что мы в Telegram WebApp
    if (!(window.Telegram && window.Telegram.WebApp)) {
        return;
    }
    
    const button = document.createElement('button');
    button.textContent = '🔍 Диагностика';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 25px;
        cursor: pointer;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0, 123, 255, 0.3);
    `;
    
    button.onclick = () => {
        createDiagnosticPanel();
        setTimeout(runFullMobileDiagnostic, 500);
    };
    
    document.body.appendChild(button);
}

// Автоматически добавляем кнопку через 3 секунды
setTimeout(() => {
    if (window.Telegram && window.Telegram.WebApp) {
        addDiagnosticButton();
        console.log('🔍 Mobile diagnostics ready - look for blue button in bottom right');
    }
}, 3000);

console.log('📱 Mobile diagnostics loaded');
