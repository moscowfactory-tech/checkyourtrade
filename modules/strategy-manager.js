// ========================================
// STRATEGY MANAGER v1.0
// Централизованное управление стратегиями
// ========================================

class StrategyManager {
    constructor(supabaseClient, userManager) {
        this.supabase = supabaseClient;
        this.userManager = userManager;
        this.strategies = [];
        this.isInitialized = false;
    }

    // Инициализация менеджера
    async initialize() {
        console.log('🎯 STRATEGY MANAGER: Initializing...');
        
        try {
            // Проверяем БД
            if (!await this.validateDatabase()) {
                throw new Error('Database validation failed');
            }

            // Загружаем стратегии
            await this.loadStrategies();
            
            this.isInitialized = true;
            console.log('✅ STRATEGY MANAGER: Initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ STRATEGY MANAGER: Initialization failed:', error);
            return false;
        }
    }

    // Проверка БД
    async validateDatabase() {
        try {
            const { data, error } = await this.supabase
                .from('strategies')
                .select('count')
                .limit(1);
            
            return !error;
        } catch (error) {
            console.error('Database validation error:', error);
            return false;
        }
    }

    // Загрузка стратегий
    async loadStrategies() {
        try {
            const currentUser = await this.userManager.getCurrentUser();
            if (!currentUser) {
                console.log('No current user, loading public strategies');
                return await this.loadPublicStrategies();
            }

            console.log(`🔄 Loading strategies for user: ${currentUser.telegram_id}`);
            
            const { data: strategies, error } = await this.supabase
                .from('strategies')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            this.strategies = strategies || [];
            console.log(`✅ Loaded ${this.strategies.length} strategies`);
            
            return this.strategies;
        } catch (error) {
            console.error('Error loading strategies:', error);
            throw error;
        }
    }

    // Загрузка публичных стратегий
    async loadPublicStrategies() {
        try {
            const { data: strategies, error } = await this.supabase
                .from('strategies')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            this.strategies = strategies || [];
            console.log(`✅ Loaded ${this.strategies.length} public strategies`);
            
            return this.strategies;
        } catch (error) {
            console.error('Error loading public strategies:', error);
            throw error;
        }
    }

    // Создание стратегии
    async createStrategy(strategyData) {
        try {
            console.log('🆕 Creating new strategy:', strategyData.name);

            // Получаем текущего пользователя
            const currentUser = await this.userManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Валидируем данные
            this.validateStrategyData(strategyData);

            // Создаем стратегию в БД
            const { data: newStrategy, error } = await this.supabase
                .from('strategies')
                .insert({
                    name: strategyData.name,
                    description: strategyData.description || '',
                    fields: strategyData.fields || [],
                    user_id: currentUser.id,
                    is_public: strategyData.isPublic || false
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Добавляем в локальный массив
            this.strategies.unshift(newStrategy);
            
            console.log('✅ Strategy created successfully:', newStrategy.id);
            
            // Уведомляем об изменении
            this.notifyStrategyChange('created', newStrategy);
            
            return newStrategy;
        } catch (error) {
            console.error('Error creating strategy:', error);
            throw error;
        }
    }

    // Обновление стратегии
    async updateStrategy(strategyId, updateData) {
        try {
            console.log('📝 Updating strategy:', strategyId);

            // Проверяем права доступа
            const strategy = await this.getStrategyById(strategyId);
            if (!strategy) {
                throw new Error('Strategy not found');
            }

            const currentUser = await this.userManager.getCurrentUser();
            if (!currentUser || strategy.user_id !== currentUser.id) {
                throw new Error('Access denied');
            }

            // Обновляем в БД
            const { data: updatedStrategy, error } = await this.supabase
                .from('strategies')
                .update(updateData)
                .eq('id', strategyId)
                .eq('user_id', currentUser.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Обновляем локальный массив
            const index = this.strategies.findIndex(s => s.id === strategyId);
            if (index !== -1) {
                this.strategies[index] = updatedStrategy;
            }

            console.log('✅ Strategy updated successfully');
            
            // Уведомляем об изменении
            this.notifyStrategyChange('updated', updatedStrategy);
            
            return updatedStrategy;
        } catch (error) {
            console.error('Error updating strategy:', error);
            throw error;
        }
    }

    // Удаление стратегии
    async deleteStrategy(strategyId) {
        try {
            console.log('🗑️ Deleting strategy:', strategyId);

            // Проверяем права доступа
            const currentUser = await this.userManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Удаляем из БД
            const { error } = await this.supabase
                .from('strategies')
                .delete()
                .eq('id', strategyId)
                .eq('user_id', currentUser.id);

            if (error) {
                throw error;
            }

            // Удаляем из локального массива
            this.strategies = this.strategies.filter(s => s.id !== strategyId);

            console.log('✅ Strategy deleted successfully');
            
            // Уведомляем об изменении
            this.notifyStrategyChange('deleted', { id: strategyId });
            
            return true;
        } catch (error) {
            console.error('Error deleting strategy:', error);
            throw error;
        }
    }

    // Получение стратегии по ID
    async getStrategyById(strategyId) {
        // Сначала ищем в локальном массиве
        let strategy = this.strategies.find(s => s.id === strategyId);
        
        if (!strategy) {
            // Если не найдена, загружаем из БД
            try {
                const { data, error } = await this.supabase
                    .from('strategies')
                    .select('*')
                    .eq('id', strategyId)
                    .single();

                if (!error && data) {
                    strategy = data;
                }
            } catch (error) {
                console.error('Error fetching strategy:', error);
            }
        }

        return strategy;
    }

    // Валидация данных стратегии
    validateStrategyData(strategyData) {
        if (!strategyData.name || !strategyData.name.trim()) {
            throw new Error('Strategy name is required');
        }

        if (strategyData.name.length > 255) {
            throw new Error('Strategy name is too long');
        }

        if (strategyData.fields && !Array.isArray(strategyData.fields)) {
            throw new Error('Strategy fields must be an array');
        }
    }

    // Уведомление об изменении стратегии
    notifyStrategyChange(action, strategy) {
        // Отправляем кастомное событие
        const event = new CustomEvent('strategyChanged', {
            detail: { action, strategy, strategies: this.strategies }
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    // Получение всех стратегий
    getStrategies() {
        return [...this.strategies];
    }

    // Получение количества стратегий
    getStrategiesCount() {
        return this.strategies.length;
    }

    // Проверка инициализации
    checkInitialization() {
        if (!this.isInitialized) {
            throw new Error('StrategyManager not initialized. Call initialize() first.');
        }
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.StrategyManager = StrategyManager;
}

console.log('🎯 Strategy Manager loaded');
