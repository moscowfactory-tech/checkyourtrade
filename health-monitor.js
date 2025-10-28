// 🏥 HEALTH MONITOR - Система мониторинга и автоматического восстановления
// Предотвращает ситуации, когда кнопки не работают

class HealthMonitor {
    constructor() {
        this.checks = {
            userManager: false,
            apiConnection: false,
            buttonsAttached: false,
            lastCheck: null
        };
        this.failureCount = 0;
        this.maxFailures = 3;
        this.checkInterval = null;
        this.isRecovering = false;
    }

    // Запуск мониторинга
    start() {
        console.log('🏥 Health Monitor started');
        
        // Первая проверка через 2 секунды после загрузки
        setTimeout(() => this.performHealthCheck(), 2000);
        
        // Периодическая проверка каждые 30 секунд
        this.checkInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000);
    }

    // Выполнить проверку здоровья
    async performHealthCheck() {
        console.log('🏥 Performing health check...');
        this.checks.lastCheck = new Date().toISOString();
        
        const results = {
            userManager: this.checkUserManager(),
            apiConnection: await this.checkAPIConnection(),
            buttonsAttached: this.checkButtons()
        };

        this.checks = { ...this.checks, ...results };
        
        const allHealthy = Object.values(results).every(v => v === true);
        
        if (allHealthy) {
            console.log('✅ Health check passed - all systems operational');
            this.failureCount = 0;
            this.hideErrorBanner();
        } else {
            console.error('❌ Health check failed:', results);
            this.failureCount++;
            
            if (this.failureCount >= this.maxFailures && !this.isRecovering) {
                console.error('🚨 CRITICAL: Multiple health check failures detected');
                this.attemptRecovery();
            } else {
                this.showErrorBanner('Обнаружены проблемы с подключением. Попытка восстановления...');
            }
        }
        
        return allHealthy;
    }

    // Проверка UserManager
    checkUserManager() {
        const exists = !!(window.userManager);
        const initialized = window.userManager?.isInitialized;
        const hasUserId = !!(window.userManager?.getUserId());
        
        console.log('🏥 UserManager check:', { exists, initialized, hasUserId });
        
        return exists && initialized && hasUserId;
    }

    // Проверка подключения к API
    async checkAPIConnection() {
        try {
            const API_URL = 'https://concerts-achievements-speak-wealth.trycloudflare.com/api';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${API_URL}/health`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                const healthy = data.status === 'healthy';
                console.log('🏥 API check:', healthy ? '✅ Healthy' : '❌ Unhealthy');
                return healthy;
            }
            
            console.log('🏥 API check: ❌ Bad response');
            return false;
        } catch (error) {
            console.error('🏥 API check failed:', error.message);
            return false;
        }
    }

    // Проверка кнопок
    checkButtons() {
        const criticalButtons = [
            'createStrategyBtn',
            'createAnalysisBtn'
        ];
        
        const results = criticalButtons.map(id => {
            const btn = document.getElementById(id);
            const exists = !!btn;
            const hasListener = btn?.onclick !== null || btn?.hasAttribute('data-section');
            return { id, exists, hasListener };
        });
        
        // Также проверяем кнопки с data-section
        const sectionButtons = document.querySelectorAll('[data-section]');
        const hasSectionButtons = sectionButtons.length > 0;
        
        const allOk = results.every(r => r.exists) && hasSectionButtons;
        
        console.log('🏥 Buttons check:', allOk ? '✅ All attached' : '⚠️ Some optional missing', {
            critical: results,
            sectionButtons: sectionButtons.length
        });
        
        return allOk;
    }

    // Попытка автоматического восстановления
    async attemptRecovery() {
        if (this.isRecovering) {
            console.log('🏥 Recovery already in progress');
            return;
        }
        
        this.isRecovering = true;
        console.log('🚑 Attempting automatic recovery...');
        
        this.showErrorBanner('Обнаружена критическая ошибка. Восстановление системы...');
        
        try {
            // 1. Переинициализация UserManager
            if (!this.checks.userManager) {
                console.log('🚑 Step 1: Reinitializing UserManager...');
                if (window.userManager) {
                    await window.userManager.initialize();
                    await window.userManager.ensureUserInDatabase();
                }
            }
            
            // 2. Переподключение кнопок
            if (!this.checks.buttonsAttached) {
                console.log('🚑 Step 2: Reattaching buttons...');
                if (typeof initializeButtonsImmediately === 'function') {
                    initializeButtonsImmediately();
                }
            }
            
            // 3. Финальная проверка
            await new Promise(resolve => setTimeout(resolve, 2000));
            const recovered = await this.performHealthCheck();
            
            if (recovered) {
                console.log('✅ Recovery successful!');
                this.showSuccessBanner('Система восстановлена! Приложение готово к работе.');
                this.failureCount = 0;
            } else {
                console.error('❌ Recovery failed');
                this.showErrorBanner(
                    'Не удалось восстановить систему. Пожалуйста, перезагрузите страницу.',
                    true // показать кнопку перезагрузки
                );
            }
        } catch (error) {
            console.error('❌ Recovery error:', error);
            this.showErrorBanner(
                'Ошибка восстановления. Пожалуйста, перезагрузите страницу.',
                true
            );
        } finally {
            this.isRecovering = false;
        }
    }

    // Показать баннер с ошибкой
    showErrorBanner(message, showReloadButton = false) {
        let banner = document.getElementById('healthErrorBanner');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'healthErrorBanner';
            banner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #f56565;
                color: white;
                padding: 12px 20px;
                text-align: center;
                z-index: 10000;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.prepend(banner);
        }
        
        banner.innerHTML = `
            <strong>⚠️ ${message}</strong>
            ${showReloadButton ? '<button onclick="location.reload()" style="margin-left: 10px; padding: 5px 15px; background: white; color: #f56565; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Перезагрузить</button>' : ''}
        `;
        banner.style.display = 'block';
    }

    // Показать баннер успеха
    showSuccessBanner(message) {
        let banner = document.getElementById('healthErrorBanner');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'healthErrorBanner';
            banner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #48bb78;
                color: white;
                padding: 12px 20px;
                text-align: center;
                z-index: 10000;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.prepend(banner);
        }
        
        banner.style.background = '#48bb78';
        banner.innerHTML = `<strong>✅ ${message}</strong>`;
        banner.style.display = 'block';
        
        // Скрыть через 5 секунд
        setTimeout(() => this.hideErrorBanner(), 5000);
    }

    // Скрыть баннер
    hideErrorBanner() {
        const banner = document.getElementById('healthErrorBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    // Остановить мониторинг
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('🏥 Health Monitor stopped');
    }

    // Получить статус
    getStatus() {
        return {
            ...this.checks,
            failureCount: this.failureCount,
            isRecovering: this.isRecovering
        };
    }
}

// Глобальный экземпляр
window.healthMonitor = new HealthMonitor();

// Автоматический запуск при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.healthMonitor.start();
    });
} else {
    window.healthMonitor.start();
}

console.log('🏥 Health Monitor module loaded');
