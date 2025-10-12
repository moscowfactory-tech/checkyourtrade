// 🎯 ПЛАН РЕФЕРАЛЬНОЙ СИСТЕМЫ
// Добавить в app.js для вирусного роста

class ReferralSystem {
    constructor() {
        this.rewards = {
            inviter: {
                users_3: 'Премиум на 1 месяц',
                users_10: 'Премиум на 3 месяца', 
                users_25: 'Премиум на 1 год'
            },
            invited: {
                bonus: 'Дополнительная стратегия (4 вместо 3)'
            }
        };
    }

    // Генерация реферальной ссылки
    generateReferralLink(userId) {
        const referralCode = btoa(userId).substring(0, 8);
        return `https://t.me/checkyourtrade_bot?start=ref_${referralCode}`;
    }

    // Показать реферальное модальное окно
    showReferralModal() {
        const userId = window.userManager.getUserId();
        const referralLink = this.generateReferralLink(userId);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🎁 Пригласи друзей</h3>
                <p>Получай премиум за приглашения:</p>
                
                <div class="referral-rewards">
                    <div class="reward-item">
                        <span class="reward-count">3 друга</span>
                        <span class="reward-prize">💎 Премиум 1 месяц</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-count">10 друзей</span>
                        <span class="reward-prize">💎 Премиум 3 месяца</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-count">25 друзей</span>
                        <span class="reward-prize">💎 Премиум 1 год</span>
                    </div>
                </div>

                <div class="referral-link-section">
                    <label>Твоя реферальная ссылка:</label>
                    <div class="link-copy-container">
                        <input type="text" value="${referralLink}" readonly>
                        <button class="btn btn--primary" onclick="navigator.clipboard.writeText('${referralLink}')">
                            Копировать
                        </button>
                    </div>
                </div>

                <div class="share-buttons">
                    <button class="btn btn--secondary" onclick="window.open('https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🎯 Крутой инструмент для анализа торговых стратегий! Попробуй:')}')">
                        📱 Поделиться в Telegram
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Добавить кнопку "Пригласить друзей" в интерфейс
window.referralSystem = new ReferralSystem();
