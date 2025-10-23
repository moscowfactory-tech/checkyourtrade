// Theme management
function setTheme(theme) {
    document.documentElement.setAttribute('data-color-scheme', theme);
    localStorage.setItem('theme', theme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Темная тема по умолчанию
    setTheme(savedTheme);
    
    // Получаем элементы
    const themeToggle = document.getElementById('themeToggle');
    const userButton = document.getElementById('userButton');
    const userDropdown = document.getElementById('userDropdown');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Обработчик переключения темы
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-color-scheme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        
            // Анимация переключения
            themeToggle.classList.add('theme-toggle-animation');
            setTimeout(() => {
                themeToggle.classList.remove('theme-toggle-animation');
            }, 300);
        });
    }
    
    // Обработчик клика по кнопке пользователя
    if (userButton && userDropdown) {
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Принудительно обновляем статистику
            if (typeof window.forceUpdateStats === 'function') {
                window.forceUpdateStats();
                console.log('📈 Stats force updated on profile open');
            } else if (typeof window.updateUserStats === 'function') {
                window.updateUserStats();
                console.log('📈 Stats updated on profile open');
            }
            
            // Убираем класс hidden и добавляем active
            if (userDropdown.classList.contains('hidden')) {
                userDropdown.classList.remove('hidden');
                setTimeout(() => {
                    userDropdown.classList.add('active');
                }, 10);
            } else {
                userDropdown.classList.remove('active');
                setTimeout(() => {
                    userDropdown.classList.add('hidden');
                }, 300);
            }
        });
    }
    
    // Закрываем меню при клике вне его
    document.addEventListener('click', function(event) {
        if (userButton && userDropdown && 
            !userButton.contains(event.target) && 
            !userDropdown.contains(event.target)) {
            if (userDropdown.classList.contains('active')) {
                userDropdown.classList.remove('active');
                setTimeout(() => {
                    userDropdown.classList.add('hidden');
                }, 300);
            }
        }
    });
    
    // Мобильная иконка поддержки и новое гамбургер-меню
    const mobileSupportIcon = document.getElementById('mobileSupportIcon');
    const mobileSupportFooterBtn = document.getElementById('mobileSupportFooterBtn');
    const mobileHamburger = document.getElementById('mobileHamburger');
    const navMenu = document.getElementById('navMenu');
    const brandLink = document.querySelector('.brand-link');
    
    // Показываем мобильную иконку только на мобильных
    function updateMobileElements() {
        if (window.innerWidth <= 480) {
            if (mobileSupportIcon) {
                mobileSupportIcon.style.display = 'flex';
            }
        } else {
            if (mobileSupportIcon) {
                mobileSupportIcon.style.display = 'none';
            }
        }
    }
    
    // Обработчик мобильной иконки поддержки
    if (mobileSupportIcon) {
        mobileSupportIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Mobile support icon clicked');
            
            // Открываем модальное окно напрямую
            if (typeof openSupportModal === 'function') {
                openSupportModal();
            } else {
                // Фолбэк - используем кнопку в подвале
                const footerBtn = document.getElementById('newSupportProjectFooterBtn');
                if (footerBtn) {
                    footerBtn.click();
                }
            }
        });
    }
    
    // Обработчик нового гамбургер-меню
    if (mobileHamburger && navMenu) {
        mobileHamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Mobile hamburger clicked');
            
            navMenu.classList.toggle('active');
            mobileHamburger.classList.toggle('active');
        });
        
        // Закрываем меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!mobileHamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileHamburger.classList.remove('active');
            }
        });
    }
    
    // Обработчик мобильной кнопки в подвале
    if (mobileSupportFooterBtn) {
        mobileSupportFooterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Mobile footer support button clicked');
            
            // Открываем модальное окно напрямую
            if (typeof openSupportModal === 'function') {
                openSupportModal();
            } else {
                // Фолбэк - используем кнопку в подвале
                const footerBtn = document.getElementById('newSupportProjectFooterBtn');
                if (footerBtn) {
                    footerBtn.click();
                }
            }
        });
    }
    
    // Обработчик кнопки поддержки в подвале
    const supportContactBtn = document.getElementById('supportContactBtn');
    const supportContactModal = document.getElementById('supportContactModal');
    const closeSupportContactBtn = document.getElementById('closeSupportContactBtn');
    
    if (supportContactBtn) {
        supportContactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📧 Opening support contact modal');
            if (supportContactModal) {
                supportContactModal.classList.remove('hidden');
                supportContactModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    function closeSupportContactModal() {
        if (supportContactModal) {
            supportContactModal.classList.remove('active');
            setTimeout(() => {
                supportContactModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
    
    if (closeSupportContactBtn) {
        closeSupportContactBtn.addEventListener('click', closeSupportContactModal);
    }
    
    // Кнопка в подвале убрана
    
    // Закрытие по backdrop
    if (supportContactModal) {
        supportContactModal.addEventListener('click', function(e) {
            if (e.target === supportContactModal || e.target.classList.contains('modal-backdrop')) {
                closeSupportContactModal();
            }
        });
    }
    
    // Обновляем при изменении размера окна
    window.addEventListener('resize', updateMobileElements);
    updateMobileElements();
    
    // Обновляем статистику пользователя
    if (typeof window.updateUserStats === 'function') {
        window.updateUserStats();
    }

    // Обработчики для кнопок входа/выхода (убраны)
    // const loginBtn = document.getElementById('loginBtn');
    // if (loginBtn) {
    //     loginBtn.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         handleLogin();
    //     });
    // }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Функция для входа пользователя
    async function handleLogin() {
        try {
            // Здесь будет интеграция с Supabase Auth
            console.log('Вход пользователя');
            
            // Временная имитация входа
            document.getElementById('userName').textContent = 'Пользователь';
            document.getElementById('userStatus').textContent = 'Авторизован';
            if (loginBtn) loginBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            
            userDropdown.classList.remove('active');
            showNotification('Вы успешно вошли в систему', 'success');
        } catch (error) {
            console.error('Ошибка входа:', error);
            showNotification('Ошибка входа в систему', 'error');
        }
    }
    
    // Функция для выхода пользователя
    async function handleLogout() {
        try {
            // Здесь будет интеграция с Supabase Auth
            console.log('Выход пользователя');
            
            // Временная имитация выхода
            document.getElementById('userName').textContent = 'Гость';
            document.getElementById('userStatus').textContent = 'Не авторизован';
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
            
            userDropdown.classList.remove('active');
            showNotification('Вы вышли из системы', 'info');
        } catch (error) {
            console.error('Ошибка выхода:', error);
            showNotification('Ошибка выхода из системы', 'error');
        }
    }
    
    // Функция для отображения уведомлений
    function showNotification(message, type = 'info') {
        // Проверяем, есть ли уже функция showNotification в app.js
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Создаем свою реализацию
            const notification = document.createElement('div');
            notification.className = `notification notification--${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 16px 20px;
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: 8px;
                box-shadow: var(--shadow-lg);
                z-index: 3000;
                font-weight: 500;
                animation: slideInRight 0.3s ease;
                max-width: 300px;
            `;
            
            if (type === 'success') {
                notification.style.borderLeft = '4px solid var(--color-success)';
                notification.style.color = 'var(--color-success)';
            } else if (type === 'error') {
                notification.style.borderLeft = '4px solid var(--color-error)';
                notification.style.color = 'var(--color-error)';
            } else if (type === 'warning') {
                notification.style.borderLeft = '4px solid var(--color-warning)';
                notification.style.color = 'var(--color-warning)';
            }
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    // Экспортируем функцию showNotification для использования в других скриптах
    window.themeShowNotification = showNotification;
});
