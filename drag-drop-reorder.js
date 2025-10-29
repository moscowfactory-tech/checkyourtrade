/**
 * Drag & Drop для изменения порядка оснований и подпунктов
 * Поддержка мыши и тач-событий
 */

let isDraggingMode = false;
let draggedElement = null;
let placeholder = null;

/**
 * Инициализация drag & drop для оснований
 */
function initFieldsReorder() {
    const fieldsContainer = document.getElementById('fieldsContainer');
    if (!fieldsContainer) return;

    // Добавляем кнопку "Изменить порядок" рядом с "Добавить основание"
    const addFieldBtn = document.getElementById('addFieldBtn');
    if (!addFieldBtn) return;

    // Проверяем, не добавлена ли уже кнопка
    if (document.getElementById('reorderFieldsBtn')) return;

    const reorderBtn = document.createElement('button');
    reorderBtn.type = 'button';
    reorderBtn.id = 'reorderFieldsBtn';
    reorderBtn.className = 'btn btn--secondary btn--sm';
    reorderBtn.innerHTML = '<i class="fas fa-arrows-alt"></i> Изменить порядок';
    reorderBtn.style.marginRight = '10px';

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
    
    isDraggingMode = !isDraggingMode;
    
    if (isDraggingMode) {
        reorderBtn.innerHTML = '<i class="fas fa-check"></i> Готово';
        reorderBtn.classList.remove('btn--secondary');
        reorderBtn.classList.add('btn--success');
        
        // Включаем режим перетаскивания для всех оснований
        const fieldBuilders = fieldsContainer.querySelectorAll('.field-builder');
        fieldBuilders.forEach(field => {
            enableDragging(field, 'field');
            field.style.cursor = 'move';
            field.classList.add('draggable-active');
        });
        
        showNotification('Режим изменения порядка активирован. Перетащите основания.', 'info');
    } else {
        reorderBtn.innerHTML = '<i class="fas fa-arrows-alt"></i> Изменить порядок';
        reorderBtn.classList.remove('btn--success');
        reorderBtn.classList.add('btn--secondary');
        
        // Выключаем режим перетаскивания
        const fieldBuilders = fieldsContainer.querySelectorAll('.field-builder');
        fieldBuilders.forEach(field => {
            disableDragging(field);
            field.style.cursor = '';
            field.classList.remove('draggable-active');
        });
        
        // Обновляем нумерацию
        updateFieldNumbers();
        
        showNotification('Порядок сохранен', 'success');
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
    reorderBtn.className = 'btn btn--secondary btn--sm reorder-inputs-btn';
    reorderBtn.innerHTML = '<i class="fas fa-arrows-alt"></i> Изменить порядок';
    reorderBtn.style.marginRight = '10px';
    
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
        reorderBtn.innerHTML = '<i class="fas fa-check"></i> Готово';
        reorderBtn.classList.remove('btn--secondary');
        reorderBtn.classList.add('btn--success');
        
        // Включаем режим перетаскивания для всех подпунктов
        const inputBuilders = inputsContainer.querySelectorAll('.input-builder');
        inputBuilders.forEach(input => {
            enableDragging(input, 'input');
            input.style.cursor = 'move';
            input.classList.add('draggable-active');
        });
        
        showNotification('Режим изменения порядка подпунктов активирован', 'info');
    } else {
        reorderBtn.innerHTML = '<i class="fas fa-arrows-alt"></i> Изменить порядок';
        reorderBtn.classList.remove('btn--success');
        reorderBtn.classList.add('btn--secondary');
        
        // Выключаем режим перетаскивания
        const inputBuilders = inputsContainer.querySelectorAll('.input-builder');
        inputBuilders.forEach(input => {
            disableDragging(input);
            input.style.cursor = '';
            input.classList.remove('draggable-active');
        });
        
        // Обновляем нумерацию подпунктов
        updateInputNumbers(inputsContainer);
        
        showNotification('Порядок подпунктов сохранен', 'success');
    }
}

/**
 * Включение drag & drop для элемента
 */
function enableDragging(element, type) {
    element.draggable = true;
    
    // Mouse events
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    
    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    element.setAttribute('data-drag-type', type);
}

/**
 * Выключение drag & drop для элемента
 */
function disableDragging(element) {
    element.draggable = false;
    
    // Mouse events
    element.removeEventListener('dragstart', handleDragStart);
    element.removeEventListener('dragend', handleDragEnd);
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('drop', handleDrop);
    element.removeEventListener('dragenter', handleDragEnter);
    element.removeEventListener('dragleave', handleDragLeave);
    
    // Touch events
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    
    element.removeAttribute('data-drag-type');
}

/**
 * Обработчики Mouse Drag
 */
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Удаляем placeholder
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;
    
    // Удаляем классы drag-over
    const container = this.parentNode;
    const items = container.querySelectorAll('.field-builder, .input-builder');
    items.forEach(item => item.classList.remove('drag-over'));
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this === draggedElement) return;
    
    const dragType = draggedElement.getAttribute('data-drag-type');
    const thisType = this.getAttribute('data-drag-type');
    
    if (dragType !== thisType) return;
    
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const dragType = draggedElement.getAttribute('data-drag-type');
        const thisType = this.getAttribute('data-drag-type');
        
        if (dragType === thisType) {
            const container = this.parentNode;
            const allItems = Array.from(container.children);
            const draggedIndex = allItems.indexOf(draggedElement);
            const targetIndex = allItems.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                container.insertBefore(draggedElement, this.nextSibling);
            } else {
                container.insertBefore(draggedElement, this);
            }
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

/**
 * Обработчики Touch Events
 */
let touchStartY = 0;
let touchStartX = 0;
let touchElement = null;

function handleTouchStart(e) {
    // Проверяем, что касание не на кнопке или input
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select')) {
        return;
    }
    
    touchElement = this;
    const touch = e.touches[0];
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
    
    this.classList.add('dragging');
    
    // Создаем placeholder
    placeholder = this.cloneNode(true);
    placeholder.classList.add('drag-placeholder');
    placeholder.style.opacity = '0.5';
    placeholder.style.pointerEvents = 'none';
}

function handleTouchMove(e) {
    if (!touchElement) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    // Визуальное перемещение элемента
    const deltaY = currentY - touchStartY;
    touchElement.style.transform = `translateY(${deltaY}px)`;
    
    // Находим элемент под пальцем
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dragType = touchElement.getAttribute('data-drag-type');
    
    if (elementBelow) {
        const targetElement = elementBelow.closest(`[data-drag-type="${dragType}"]`);
        
        if (targetElement && targetElement !== touchElement) {
            const container = touchElement.parentNode;
            const allItems = Array.from(container.children);
            const touchIndex = allItems.indexOf(touchElement);
            const targetIndex = allItems.indexOf(targetElement);
            
            if (touchIndex < targetIndex) {
                container.insertBefore(touchElement, targetElement.nextSibling);
            } else {
                container.insertBefore(touchElement, targetElement);
            }
            
            // Обновляем начальную позицию
            touchStartY = currentY;
        }
    }
}

function handleTouchEnd(e) {
    if (!touchElement) return;
    
    touchElement.classList.remove('dragging');
    touchElement.style.transform = '';
    
    // Удаляем placeholder
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;
    
    touchElement = null;
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
    // Инициализируем drag & drop для оснований
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
                        
                        // Если режим перетаскивания активен, включаем для нового элемента
                        if (isDraggingMode) {
                            enableDragging(node, 'field');
                            node.style.cursor = 'move';
                            node.classList.add('draggable-active');
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
