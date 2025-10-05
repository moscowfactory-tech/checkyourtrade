// Supabase Client Configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Константы для подключения к Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL' // Замените на ваш URL Supabase
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY' // Замените на ваш публичный ключ Supabase

// Инициализация клиента Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Функции для работы со стратегиями
async function getStrategies() {
    const { data, error } = await supabase
        .from('strategies')
        .select('*')
    
    if (error) {
        console.error('Ошибка при получении стратегий:', error)
        return []
    }
    
    return data || []
}

async function getStrategyById(id) {
    const { data, error } = await supabase
        .from('strategies')
        .select(`
            *,
            fields:strategy_fields(
                *,
                inputs:field_inputs(*)
            )
        `)
        .eq('id', id)
        .single()
    
    if (error) {
        console.error(`Ошибка при получении стратегии с ID ${id}:`, error)
        return null
    }
    
    return data
}

async function createStrategy(strategy) {
    // Создаем запись стратегии
    const { data: strategyData, error: strategyError } = await supabase
        .from('strategies')
        .insert({
            name: strategy.name,
            description: strategy.description,
            created_at: new Date().toISOString()
        })
        .select()
    
    if (strategyError) {
        console.error('Ошибка при создании стратегии:', strategyError)
        return null
    }
    
    const strategyId = strategyData[0].id
    
    // Добавляем поля стратегии
    for (const field of strategy.fields) {
        const { data: fieldData, error: fieldError } = await supabase
            .from('strategy_fields')
            .insert({
                strategy_id: strategyId,
                name: field.name,
                description: field.description
            })
            .select()
        
        if (fieldError) {
            console.error('Ошибка при создании поля стратегии:', fieldError)
            continue
        }
        
        const fieldId = fieldData[0].id
        
        // Добавляем поля ввода для каждого поля
        for (const input of field.inputs) {
            const { error: inputError } = await supabase
                .from('field_inputs')
                .insert({
                    field_id: fieldId,
                    type: input.type,
                    label: input.label,
                    required: input.required,
                    options: input.options ? JSON.stringify(input.options) : null
                })
            
            if (inputError) {
                console.error('Ошибка при создании поля ввода:', inputError)
            }
        }
    }
    
    return await getStrategyById(strategyId)
}

async function updateStrategy(strategy) {
    // Обновляем запись стратегии
    const { error: strategyError } = await supabase
        .from('strategies')
        .update({
            name: strategy.name,
            description: strategy.description,
            updated_at: new Date().toISOString()
        })
        .eq('id', strategy.id)
    
    if (strategyError) {
        console.error(`Ошибка при обновлении стратегии с ID ${strategy.id}:`, strategyError)
        return null
    }
    
    // Удаляем существующие поля и их входные данные
    // (в реальном приложении можно оптимизировать, обновляя только изменившиеся поля)
    const { error: deleteFieldsError } = await supabase
        .from('strategy_fields')
        .delete()
        .eq('strategy_id', strategy.id)
    
    if (deleteFieldsError) {
        console.error(`Ошибка при удалении полей стратегии с ID ${strategy.id}:`, deleteFieldsError)
    }
    
    // Добавляем обновленные поля стратегии
    for (const field of strategy.fields) {
        const { data: fieldData, error: fieldError } = await supabase
            .from('strategy_fields')
            .insert({
                strategy_id: strategy.id,
                name: field.name,
                description: field.description
            })
            .select()
        
        if (fieldError) {
            console.error('Ошибка при создании поля стратегии:', fieldError)
            continue
        }
        
        const fieldId = fieldData[0].id
        
        // Добавляем поля ввода для каждого поля
        for (const input of field.inputs) {
            const { error: inputError } = await supabase
                .from('field_inputs')
                .insert({
                    field_id: fieldId,
                    type: input.type,
                    label: input.label,
                    required: input.required,
                    options: input.options ? JSON.stringify(input.options) : null
                })
            
            if (inputError) {
                console.error('Ошибка при создании поля ввода:', inputError)
            }
        }
    }
    
    return await getStrategyById(strategy.id)
}

async function deleteStrategy(id) {
    const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id)
    
    if (error) {
        console.error(`Ошибка при удалении стратегии с ID ${id}:`, error)
        return false
    }
    
    return true
}

// Функции для работы с анализом сделок
async function saveAnalysisResult(analysisData) {
    const { data, error } = await supabase
        .from('analysis_results')
        .insert({
            strategy_id: analysisData.strategyId,
            answers: JSON.stringify(analysisData.answers),
            positive_factors: JSON.stringify(analysisData.positiveFactors),
            neutral_factors: JSON.stringify(analysisData.neutralFactors),
            negative_factors: JSON.stringify(analysisData.negativeFactors),
            recommendation: analysisData.recommendation,
            created_at: new Date().toISOString()
        })
        .select()
    
    if (error) {
        console.error('Ошибка при сохранении результатов анализа:', error)
        return null
    }
    
    return data[0]
}

async function getUserAnalysisHistory(userId) {
    const { data, error } = await supabase
        .from('analysis_results')
        .select(`
            *,
            strategy:strategies(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error(`Ошибка при получении истории анализа для пользователя ${userId}:`, error)
        return []
    }
    
    return data || []
}

// Экспорт функций
export {
    supabase,
    getStrategies,
    getStrategyById,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    saveAnalysisResult,
    getUserAnalysisHistory
}
