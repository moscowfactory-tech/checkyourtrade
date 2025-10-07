// 🏗️ СОВРЕМЕННАЯ АРХИТЕКТУРА RESPONSIVE DESIGN
// Единая система для ПК и мобильных устройств

console.log('🏗️ RESPONSIVE ARCHITECTURE LOADED');

// ========================================
// 1. ДЕТЕКЦИЯ УСТРОЙСТВ
// ========================================

class DeviceDetector {
    static isMobile() {
        return window.innerWidth <= 768 || 
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    static isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }
    
    static isDesktop() {
        return window.innerWidth > 1024;
    }
    
    static getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }
}

// ========================================
// 2. АДАПТИВНЫЙ МЕНЕДЖЕР КОМПОНЕНТОВ
// ========================================

class ResponsiveComponentManager {
    constructor() {
        this.components = new Map();
        this.currentDevice = DeviceDetector.getDeviceType();
        this.init();
    }
    
    init() {
        // Слушаем изменения размера экрана
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Устанавливаем CSS переменные для устройства
        this.setCSSVariables();
        
        // Инициализируем компоненты
        this.initializeComponents();
        
        console.log(`🏗️ Initialized for ${this.currentDevice} device`);
    }
    
    handleResize() {
        const newDevice = DeviceDetector.getDeviceType();
        if (newDevice !== this.currentDevice) {
            console.log(`🔄 Device changed: ${this.currentDevice} → ${newDevice}`);
            this.currentDevice = newDevice;
            this.setCSSVariables();
            this.updateComponents();
        }
    }
    
    setCSSVariables() {
        const root = document.documentElement;
        
        switch(this.currentDevice) {
            case 'mobile':
                root.style.setProperty('--modal-width', '95vw');
                root.style.setProperty('--modal-padding', '16px');
                root.style.setProperty('--button-size', '44px');
                root.style.setProperty('--font-scale', '0.9');
                break;
            case 'tablet':
                root.style.setProperty('--modal-width', '80vw');
                root.style.setProperty('--modal-padding', '24px');
                root.style.setProperty('--button-size', '48px');
                root.style.setProperty('--font-scale', '1');
                break;
            default: // desktop
                root.style.setProperty('--modal-width', '600px');
                root.style.setProperty('--modal-padding', '32px');
                root.style.setProperty('--button-size', '52px');
                root.style.setProperty('--font-scale', '1');
        }
    }
    
    initializeComponents() {
        // Инициализируем все адаптивные компоненты
        this.initModals();
        this.initNavigation();
        this.initButtons();
    }
    
    updateComponents() {
        // Обновляем компоненты при смене устройства
        this.components.forEach(component => {
            if (component.update) {
                component.update(this.currentDevice);
            }
        });
    }
    
    // ========================================
    // 3. АДАПТИВНЫЕ МОДАЛЬНЫЕ ОКНА
    // ========================================
    
    initModals() {
        const modalManager = new AdaptiveModalManager();
        this.components.set('modals', modalManager);
    }
    
    // ========================================
    // 4. АДАПТИВНАЯ НАВИГАЦИЯ
    // ========================================
    
    initNavigation() {
        const navManager = new AdaptiveNavigationManager();
        this.components.set('navigation', navManager);
    }
    
    // ========================================
    // 5. АДАПТИВНЫЕ КНОПКИ
    // ========================================
    
    initButtons() {
        const buttonManager = new AdaptiveButtonManager();
        this.components.set('buttons', buttonManager);
    }
}

// ========================================
// АДАПТИВНЫЙ МЕНЕДЖЕР МОДАЛЬНЫХ ОКОН
// ========================================

class AdaptiveModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }
    
    init() {
        // Находим все модальные окна
        const modalElements = document.querySelectorAll('[id$="Modal"], .modal');
        
        modalElements.forEach(modal => {
            this.registerModal(modal);
        });
        
        console.log(`📱 Registered ${this.modals.size} adaptive modals`);
    }
    
    registerModal(modalElement) {
        const modalId = modalElement.id;
        
        const modalConfig = {
            element: modalElement,
            openTriggers: document.querySelectorAll(`[data-modal="${modalId}"], [onclick*="${modalId}"]`),
            closeTriggers: modalElement.querySelectorAll('.close, [data-close]'),
            backdrop: modalElement
        };
        
        // Добавляем обработчики
        this.addModalHandlers(modalConfig);
        
        this.modals.set(modalId, modalConfig);
    }
    
    addModalHandlers(config) {
        const { element, openTriggers, closeTriggers, backdrop } = config;
        
        // Обработчики открытия
        openTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openModal(element);
            });
        });
        
        // Обработчики закрытия
        closeTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeModal(element);
            });
        });
        
        // Закрытие по клику на backdrop
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.closeModal(element);
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && element.classList.contains('active')) {
                this.closeModal(element);
            }
        });
    }
    
    openModal(modalElement) {
        console.log('📱 Opening adaptive modal:', modalElement.id);
        
        // Закрываем другие модальные окна
        this.closeAllModals();
        
        // Открываем текущее
        modalElement.classList.remove('hidden');
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Адаптивные стили в зависимости от устройства
        this.applyDeviceStyles(modalElement);
        
        // Анимация появления
        requestAnimationFrame(() => {
            modalElement.style.opacity = '1';
            modalElement.style.transform = 'scale(1)';
        });
    }
    
    closeModal(modalElement) {
        console.log('📱 Closing adaptive modal:', modalElement.id);
        
        modalElement.classList.remove('active');
        modalElement.style.opacity = '0';
        modalElement.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modalElement.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }
    
    closeAllModals() {
        this.modals.forEach(config => {
            if (config.element.classList.contains('active')) {
                this.closeModal(config.element);
            }
        });
    }
    
    applyDeviceStyles(modalElement) {
        const device = DeviceDetector.getDeviceType();
        
        // Удаляем предыдущие классы устройств
        modalElement.classList.remove('mobile-modal', 'tablet-modal', 'desktop-modal');
        
        // Добавляем класс текущего устройства
        modalElement.classList.add(`${device}-modal`);
    }
    
    update(deviceType) {
        // Обновляем все активные модальные окна при смене устройства
        this.modals.forEach(config => {
            if (config.element.classList.contains('active')) {
                this.applyDeviceStyles(config.element);
            }
        });
    }
}

// ========================================
// АДАПТИВНЫЙ МЕНЕДЖЕР НАВИГАЦИИ
// ========================================

class AdaptiveNavigationManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupProfileNavigation();
        this.setupMobileMenu();
        console.log('🧭 Adaptive navigation initialized');
    }
    
    setupProfileNavigation() {
        const profileBtn = document.getElementById('userButton');
        const profileDropdown = document.getElementById('userDropdown');
        
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isHidden = profileDropdown.classList.contains('hidden');
                
                if (isHidden) {
                    this.openProfileDropdown(profileDropdown);
                } else {
                    this.closeProfileDropdown(profileDropdown);
                }
            });
            
            // Закрытие при клике вне области
            document.addEventListener('click', (e) => {
                if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                    this.closeProfileDropdown(profileDropdown);
                }
            });
            
            console.log('👤 Profile navigation setup complete');
        }
    }
    
    openProfileDropdown(dropdown) {
        dropdown.classList.remove('hidden');
        
        // Адаптивное позиционирование
        if (DeviceDetector.isMobile()) {
            dropdown.classList.add('mobile-dropdown');
        }
        
        // Обновляем статистику
        if (window.updateUserStats) {
            setTimeout(window.updateUserStats, 100);
        }
    }
    
    closeProfileDropdown(dropdown) {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('mobile-dropdown');
    }
    
    setupMobileMenu() {
        // Настройка мобильного меню при необходимости
        if (DeviceDetector.isMobile()) {
            console.log('📱 Mobile menu setup');
        }
    }
    
    update(deviceType) {
        console.log(`🧭 Navigation updated for ${deviceType}`);
    }
}

// ========================================
// АДАПТИВНЫЙ МЕНЕДЖЕР КНОПОК
// ========================================

class AdaptiveButtonManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupAnalysisButtons();
        this.setupActionButtons();
        console.log('🔘 Adaptive buttons initialized');
    }
    
    setupAnalysisButtons() {
        // Адаптивные кружки для анализа
        const colorOptions = document.querySelectorAll('.color-option');
        
        colorOptions.forEach(option => {
            const circle = option.querySelector('.color-circle');
            if (circle && DeviceDetector.isMobile()) {
                circle.style.width = '60px';
                circle.style.height = '60px';
                circle.style.borderWidth = '3px';
            }
        });
    }
    
    setupActionButtons() {
        // Настройка адаптивных кнопок действий
        const actionButtons = document.querySelectorAll('.btn, button');
        
        actionButtons.forEach(button => {
            if (DeviceDetector.isMobile()) {
                button.classList.add('mobile-button');
            }
        });
    }
    
    update(deviceType) {
        console.log(`🔘 Buttons updated for ${deviceType}`);
        
        // Обновляем размеры кружков анализа
        this.setupAnalysisButtons();
    }
}

// ========================================
// ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
// ========================================

// Создаем глобальный менеджер
window.ResponsiveManager = null;

// Инициализируем после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.ResponsiveManager = new ResponsiveComponentManager();
    console.log('🏗️ RESPONSIVE ARCHITECTURE READY');
});

// Экспортируем для использования в других скриптах
window.DeviceDetector = DeviceDetector;
window.ResponsiveComponentManager = ResponsiveComponentManager;

console.log('🏗️ RESPONSIVE ARCHITECTURE LOADED SUCCESSFULLY');
