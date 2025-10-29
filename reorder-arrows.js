/**
 * Система изменения порядка оснований и подпунктов через стрелки
 * Удобно для мобильных устройств
 */

let isReorderMode = false;

/**
 * Инициализация системы изменения порядка для оснований
 */
function initFieldsReorder() {
    const fieldsContainer = document.getElementById('fieldsContainer');
    if (!fieldsContainer) return;

    const addFieldBtn = document.getElementById('addFieldBtn');
    if (!addFieldBtn) return;

    // Проверяем, не добавлена ли уже кнопка
    if (document.getElementById('reorderFieldsBtn')) return;

    const reorderBtn = document.createElement('button');
    reorderBtn.type = 'button';
    reorderBtn.id = 'reorderFieldsBtn';
    reorderBtn.className = 'btn btn--secondary btn--sm reorder-btn';
    reorderBtn.innerHTML = '<i class="fas fa-sort"></i>';
    reorderBtn.title = 'Изменить порядок';

    // Вставляем кнопку перед "Добавить основание"
    addFieldBtn.parentNode.insertBefore(reorderBtn, addFieldBtn);

    // Обработчик кнопки
    reorderBtn.addEventListener('click', () => {
        toggleFieldsReorderMode();
    });
}

/**
 * Включение/выключение режима изменения порядка оснований
 */
function toggleFieldsReorderMode() {
    const fieldsContainer = document.getElementById('fieldsContainer');
    const reorderBtn = document.getElementById('reorderFieldsBtn');
    
    isReorderMode = !isReorderMode;
    
    if (isReorderMode) {
        reorderBtn.innerHTML = '<i class="fas fa-check"></i>';
        reorderBtn.classList.remove('btn--secondary');
        reorderBtn.classList.add('btn--success');
        reorderBtn.title = 'Готово';
        
        // Добавляем стрелки ко всем основаниям
        const fieldBuilders = fieldsContainer.querySelectorAll('.field-builder');
        fieldBuilders.forEach(field => {
            addArrowsToField(field);
        });
        
        showNotification('Используйте стрелки для изменения порядка', 'info');
    } else {
        reorderBtn.innerHTML = '<i class="fas fa-sort"></i>';
        reorderBtn.classList.remove('btn--success');
        reorderBtn.classList.add('btn--secondary');
        reorderBtn.title = 'Изменить порядок';
        
        // Удаляем стрелки
        const fieldBuilders = fieldsContainer.querySelectorAll('.field-builder');
        fieldBuilders.forEach(field => {
            removeArrowsFromField(field);
        });
        
        // Обновляем нумерацию
        updateFieldNumbers();
        
        showNotification('Порядок сохранен', 'success');
    }
}

/**
 * Добавление стрелок к основанию
 */
function addArrowsToField(field) {
    // Проверяем, не добавлены ли уже стрелки
    if (field.querySelector('.reorder-arrows')) return;
    
    const arrowsContainer = document.createElement('div');
    arrowsContainer.className = 'reorder-arrows';
    arrowsContainer.innerHTML = `
        <button type="button" class="arrow-btn arrow-up" title="Переместить вверх">
            <i class="fas fa-chevron-up"></i>
        </button>
        <button type="button" class="arrow-btn arrow-down" title="Переместить вниз">
            <i class="fas fa-chevron-down"></i>
        </button>
    `;
    
    // Вставляем стрелки в начало основания
    const fieldHeader = field.querySelector('.field-header');
    fieldHeader.insertBefore(arrowsContainer, fieldHeader.firstChild);
    
    // Обработчики стрелок
    const upBtn = arrowsContainer.querySelector('.arrow-up');
    const downBtn = arrowsContainer.querySelector('.arrow-down');
    
    upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveFieldUp(field);
    });
    
    downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveFieldDown(field);
    });
}

/**
 * Удаление стрелок из основания
 */
function removeArrowsFromField(field) {
    const arrows = field.querySelector('.reorder-arrows');
    if (arrows) {
        arrows.remove();
    }
}

/**
 * Перемещение основания вверх
 */
function moveFieldUp(field) {
    const prevField = field.previousElementSibling;
    if (prevField && prevField.classList.contains('field-builder')) {
        field.parentNode.insertBefore(field, prevField);
        updateFieldNumbers();
        
        // Анимация
        field.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            field.style.animation = '';
        }, 300);
    }
}

/**
 * Перемещение основания вниз
 */
function moveFieldDown(field) {
    const nextField = field.nextElementSibling;
    if (nextField && nextField.classList.contains('field-builder')) {
        field.parentNode.insertBefore(nextField, field);
        updateFieldNumbers();
        
        // Анимация
        field.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            field.style.animation = '';
        }, 300);
    }
}

/**
 * Добавление кнопки "Изменить порядок" для подпунктов
 */
function addReorderButtonToInputs(fieldBuilder) {
    const inputsHeader = fieldBuilder.querySelector('.inputs-header');
    const addInputBtn = fieldBuilder.querySelector('.add-input-btn');
    
    if (!inputsHeader || !addInputBtn) return;
    
    // Проверяем, не добавлена ли уже кнопка
    const existingBtn = inputsHeader.querySelector('.reorder-inputs-btn');
    if (existingBtn) return;
    
    const reorderBtn = document.createElement('button');
    reorderBtn.type = 'button';
    reorderBtn.className = 'btn btn--secondary btn--sm reorder-btn reorder-inputs-btn';
    reorderBtn.innerHTML = '<i class="fas fa-sort"></i>';
    reorderBtn.title = 'Изменить порядок';
    
    // Вставляем кнопку перед "Добавить подпункт"
    addInputBtn.parentNode.insertBefore(reorderBtn, addInputBtn);
    
    // Обработчик кнопки
    reorderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleInputsReorderMode(fieldBuilder, reorderBtn);
    });
}

/**
 * Включение/выключение режима изменения порядка подпунктов
 */
function toggleInputsReorderMode(fieldBuilder, reorderBtn) {
    const inputsContainer = fieldBuilder.querySelector('.inputs-container');
    const isActive = reorderBtn.classList.contains('btn--success');
    
    if (!isActive) {
        reorderBtn.innerHTML = '<i class="fas fa-check"></i>';
        reorderBtn.classList.remove('btn--secondary');
        reorderBtn.classList.add('btn--success');
        reorderBtn.title = 'Готово';
        
        // Добавляем стрелки ко всем подпунктам
        const inputBuilders = inputsContainer.querySelectorAll('.input-builder');
        inputBuilders.forEach(input => {
            addArrowsToInput(input, inputsContainer);
        });
        
        showNotification('Используйте стрелки для изменения порядка подпунктов', 'info');
    } else {
        reorderBtn.innerHTML = '<i class="fas fa-sort"></i>';
        reorderBtn.classList.remove('btn--success');
        reorderBtn.classList.add('btn--secondary');
        reorderBtn.title = 'Изменить порядок';
        
        // Удаляем стрелки
        const inputBuilders = inputsContainer.querySelectorAll('.input-builder');
        inputBuilders.forEach(input => {
            removeArrowsFromInput(input);
        });
        
        // Обновляем нумерацию подпунктов
        updateInputNumbers(inputsContainer);
        
        showNotification('Порядок подпунктов сохранен', 'success');
    }
}

/**
 * Добавление стрелок к подпункту
 */
function addArrowsToInput(input, container) {
    // Проверяем, не добавлены ли уже стрелки
    if (input.querySelector('.reorder-arrows')) return;
    
    const arrowsContainer = document.createElement('div');
    arrowsContainer.className = 'reorder-arrows';
    arrowsContainer.innerHTML = `
        <button type="button" class="arrow-btn arrow-up" title="Переместить вверх">
            <i class="fas fa-chevron-up"></i>
        </button>
        <button type="button" class="arrow-btn arrow-down" title="Переместить вниз">
            <i class="fas fa-chevron-down"></i>
        </button>
    `;
    
    // Вставляем стрелки в начало подпункта
    const inputHeader = input.querySelector('.input-header');
    inputHeader.insertBefore(arrowsContainer, inputHeader.firstChild);
    
    // Обработчики стрелок
    const upBtn = arrowsContainer.querySelector('.arrow-up');
    const downBtn = arrowsContainer.querySelector('.arrow-down');
    
    upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveInputUp(input, container);
    });
    
    downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveInputDown(input, container);
    });
}

/**
 * Удаление стрелок из подпункта
 */
function removeArrowsFromInput(input) {
    const arrows = input.querySelector('.reorder-arrows');
    if (arrows) {
        arrows.remove();
    }
}

/**
 * Перемещение подпункта вверх
 */
function moveInputUp(input, container) {
    const prevInput = input.previousElementSibling;
    if (prevInput && prevInput.classList.contains('input-builder')) {
        container.insertBefore(input, prevInput);
        updateInputNumbers(container);
        
        // Анимация
        input.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            input.style.animation = '';
        }, 300);
    }
}

/**
 * Перемещение подпункта вниз
 */
function moveInputDown(input, container) {
    const nextInput = input.nextElementSibling;
    if (nextInput && nextInput.classList.contains('input-builder')) {
        container.insertBefore(nextInput, input);
        updateInputNumbers(container);
        
        // Анимация
        input.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            input.style.animation = '';
        }, 300);
    }
}

/**
 * Обновление нумерации подпунктов
 */
function updateInputNumbers(container) {
    const inputBuilders = container.querySelectorAll('.input-builder');
    inputBuilders.forEach((builder, index) => {
        const header = builder.querySelector('.input-header h5');
        if (header) {
            header.textContent = `Подпункт ${index + 1}`;
        }
        builder.setAttribute('data-input-id', index + 1);
    });
}

/**
 * Инициализация при загрузке страницы
 */
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем систему изменения порядка для оснований
    initFieldsReorder();
    
    // Наблюдаем за добавлением новых оснований
    const fieldsContainer = document.getElementById('fieldsContainer');
    if (fieldsContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('field-builder')) {
                        // Добавляем кнопку "Изменить порядок" для подпунктов
                        addReorderButtonToInputs(node);
                        
                        // Если режим изменения порядка активен, добавляем стрелки
                        if (isReorderMode) {
                            addArrowsToField(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(fieldsContainer, { childList: true });
    }
});

// Экспортируем функции для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initFieldsReorder,
        addReorderButtonToInputs,
        toggleFieldsReorderMode,
        toggleInputsReorderMode
    };
}
