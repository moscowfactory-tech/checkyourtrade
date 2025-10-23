#!/usr/bin/env python3
"""
Упрощенный API сервер для TradeAnalyzer на Timeweb
Совместимость с текущим кодом приложения
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import json
from datetime import datetime
import uuid
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

app = Flask(__name__)
CORS(app, origins=[
    'https://moscowfactory-tech.github.io',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
])

# Конфигурация БД
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'tradeanalyzer'),
    'user': os.getenv('DB_USER', 'tradeanalyzer_app'),
    'password': os.getenv('DB_PASSWORD', 'SECURE_PASSWORD_2024!')
}

def get_db_connection():
    """Создание подключения к БД"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def execute_query(sql, params=None, fetch=True):
    """Выполнение SQL запроса"""
    conn = get_db_connection()
    if not conn:
        return {'data': None, 'error': 'Database connection failed'}
    
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params or [])
            
            if fetch:
                rows = cur.fetchall()
                result = [dict(row) for row in rows]
            else:
                result = []
                
            conn.commit()
            return {'data': result, 'error': None}
            
    except Exception as e:
        conn.rollback()
        return {'data': None, 'error': str(e)}
    finally:
        conn.close()

# ============================================================================
# ЭНДПОИНТЫ ДЛЯ СОВМЕСТИМОСТИ С ТЕКУЩИМ КОДОМ
# ============================================================================

@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    """Получение стратегий пользователя"""
    telegram_user_id = request.args.get('telegram_user_id')
    
    if not telegram_user_id:
        return jsonify({'data': [], 'error': None})
    
    # Сначала найдем пользователя
    user_sql = "SELECT id FROM users WHERE telegram_id = %s"
    user_result = execute_query(user_sql, [telegram_user_id])
    
    if user_result['error'] or not user_result['data']:
        return jsonify({'data': [], 'error': None})
    
    user_id = user_result['data'][0]['id']
    
    # Получаем стратегии пользователя
    sql = """
    SELECT id, name, description, fields, created_at, updated_at
    FROM strategies 
    WHERE user_id = %s 
    ORDER BY created_at DESC
    """
    
    result = execute_query(sql, [user_id])
    
    if result['error']:
        return jsonify({'data': [], 'error': result['error']}), 500
    
    return jsonify(result)

@app.route('/api/strategies', methods=['POST'])
def create_strategy():
    """Создание новой стратегии"""
    data = request.get_json()
    
    telegram_user_id = data.get('telegram_user_id')
    if not telegram_user_id:
        return jsonify({'data': None, 'error': 'telegram_user_id is required'}), 400
    
    # Создаем или находим пользователя
    user_id = ensure_user_exists(telegram_user_id, data.get('user_data', {}))
    if not user_id:
        return jsonify({'data': None, 'error': 'Failed to create user'}), 500
    
    # Создаем стратегию
    sql = """
    INSERT INTO strategies (user_id, telegram_user_id, name, description, fields)
    VALUES (%s, %s, %s, %s, %s)
    RETURNING id, name, description, fields, created_at, updated_at
    """
    
    params = [
        user_id,
        telegram_user_id,
        data.get('name'),
        data.get('description'),
        psycopg2.extras.Json(data.get('fields', []))
    ]
    
    result = execute_query(sql, params)
    
    if result['error']:
        return jsonify({'data': None, 'error': result['error']}), 500
    
    return jsonify({'data': result['data'][0] if result['data'] else None, 'error': None})

@app.route('/api/strategies/<strategy_id>', methods=['PUT'])
def update_strategy(strategy_id):
    """Обновление стратегии"""
    data = request.get_json()
    
    sql = """
    UPDATE strategies 
    SET name = %s, description = %s, fields = %s, updated_at = NOW()
    WHERE id = %s
    RETURNING id, name, description, fields, created_at, updated_at
    """
    
    params = [
        data.get('name'),
        data.get('description'),
        psycopg2.extras.Json(data.get('fields', [])),
        strategy_id
    ]
    
    result = execute_query(sql, params)
    
    if result['error']:
        return jsonify({'data': None, 'error': result['error']}), 500
    
    return jsonify({'data': result['data'][0] if result['data'] else None, 'error': None})

@app.route('/api/strategies/<strategy_id>', methods=['DELETE'])
def delete_strategy(strategy_id):
    """Удаление стратегии"""
    sql = "DELETE FROM strategies WHERE id = %s"
    result = execute_query(sql, [strategy_id], fetch=False)
    
    if result['error']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify({'error': None})

@app.route('/api/analysis_results', methods=['GET'])
def get_analyses():
    """Получение анализов пользователя"""
    telegram_user_id = request.args.get('telegram_user_id')
    
    if not telegram_user_id:
        return jsonify({'data': [], 'error': None})
    
    # Находим пользователя
    user_sql = "SELECT id FROM users WHERE telegram_id = %s"
    user_result = execute_query(user_sql, [telegram_user_id])
    
    if user_result['error'] or not user_result['data']:
        return jsonify({'data': [], 'error': None})
    
    user_id = user_result['data'][0]['id']
    
    # Получаем анализы через представление для совместимости
    sql = """
    SELECT id, user_id, strategy_id, coin, answers, 
           positive_factors, negative_factors, neutral_factors,
           recommendation, created_at, results
    FROM analysis_results 
    WHERE user_id = %s 
    ORDER BY created_at DESC
    """
    
    result = execute_query(sql, [user_id])
    
    if result['error']:
        return jsonify({'data': [], 'error': result['error']}), 500
    
    return jsonify(result)

@app.route('/api/analysis_results', methods=['POST'])
def create_analysis():
    """Создание нового анализа"""
    data = request.get_json()
    
    telegram_user_id = data.get('telegram_user_id')
    if not telegram_user_id:
        return jsonify({'data': None, 'error': 'telegram_user_id is required'}), 400
    
    # Создаем или находим пользователя
    user_id = ensure_user_exists(telegram_user_id, data.get('user_data', {}))
    if not user_id:
        return jsonify({'data': None, 'error': 'Failed to create user'}), 500
    
    # Подготавливаем данные результатов
    results = {
        'positive': data.get('positive_factors', []),
        'negative': data.get('negative_factors', []),
        'neutral': data.get('neutral_factors', [])
    }
    
    # Создаем анализ
    sql = """
    INSERT INTO analyses (user_id, telegram_user_id, strategy_id, strategy_name, 
                         coin, answers, results, recommendation)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id, user_id, strategy_id, answers, results, recommendation, created_at
    """
    
    params = [
        user_id,
        telegram_user_id,
        data.get('strategy_id'),
        data.get('strategy_name'),
        data.get('coin'),
        psycopg2.extras.Json(data.get('answers', [])),
        psycopg2.extras.Json(results),
        data.get('recommendation')
    ]
    
    result = execute_query(sql, params)
    
    if result['error']:
        return jsonify({'data': None, 'error': result['error']}), 500
    
    # Преобразуем для совместимости
    if result['data']:
        analysis = result['data'][0]
        analysis['positive_factors'] = results['positive']
        analysis['negative_factors'] = results['negative']
        analysis['neutral_factors'] = results['neutral']
    
    return jsonify({'data': result['data'][0] if result['data'] else None, 'error': None})

@app.route('/api/analysis_results/<analysis_id>', methods=['DELETE'])
def delete_analysis(analysis_id):
    """Удаление анализа"""
    sql = "DELETE FROM analyses WHERE id = %s"
    result = execute_query(sql, [analysis_id], fetch=False)
    
    if result['error']:
        return jsonify({'error': result['error']}), 500
    
    return jsonify({'error': None})

@app.route('/api/users', methods=['GET'])
def get_users():
    """Получение пользователей (для поиска по telegram_id)"""
    telegram_id = request.args.get('telegram_user_id')
    
    if not telegram_id:
        return jsonify({'data': [], 'error': None})
    
    sql = "SELECT id, telegram_id, username, first_name, last_name, created_at FROM users WHERE telegram_id = %s"
    result = execute_query(sql, [telegram_id])
    
    if result['error']:
        return jsonify({'data': [], 'error': result['error']}), 500
    
    return jsonify(result)

@app.route('/api/users', methods=['POST'])
def create_user():
    """Создание нового пользователя"""
    data = request.get_json()
    
    telegram_id = data.get('telegram_id')
    if not telegram_id:
        return jsonify({'data': None, 'error': 'telegram_id is required'}), 400
    
    # Проверяем существование
    check_sql = "SELECT id, telegram_id, username, first_name, last_name, created_at FROM users WHERE telegram_id = %s"
    result = execute_query(check_sql, [telegram_id])
    
    if result['data']:
        # Пользователь уже существует
        return jsonify({'data': result['data'][0], 'error': None})
    
    # Создаем нового пользователя
    create_sql = """
    INSERT INTO users (telegram_id, username, first_name, last_name)
    VALUES (%s, %s, %s, %s)
    RETURNING id, telegram_id, username, first_name, last_name, created_at
    """
    
    params = [
        telegram_id,
        data.get('username'),
        data.get('first_name'),
        data.get('last_name')
    ]
    
    result = execute_query(create_sql, params)
    
    if result['error']:
        return jsonify({'data': None, 'error': result['error']}), 500
    
    return jsonify({'data': result['data'][0] if result['data'] else None, 'error': None})

@app.route('/api/user_events', methods=['POST'])
def create_user_event():
    """Создание события пользователя (аналитика)"""
    data = request.get_json()
    try:
        print("[analytics] /api/user_events payload:", data)
    except Exception:
        pass
    
    telegram_user_id = data.get('telegram_user_id')
    event_type = data.get('event_type')
    
    if not telegram_user_id or not event_type:
        return jsonify({'data': None, 'error': 'telegram_user_id and event_type are required'}), 400
    
    # Находим пользователя
    user_data = data.get('user_data') or {}
    user_id = ensure_user_exists(telegram_user_id, user_data)
    if not user_id:
        return jsonify({'data': None, 'error': 'Failed to create user'}), 500
    
    # Создаем событие
    sql = """
    INSERT INTO user_events (user_id, telegram_user_id, event_type, event_data)
    VALUES (%s, %s, %s, %s)
    RETURNING id, event_type, created_at
    """
    
    params = [
        user_id,
        telegram_user_id,
        event_type,
        psycopg2.extras.Json(data.get('event_data', {}))
    ]
    
    result = execute_query(sql, params)
    
    if result['error']:
        return jsonify({'data': None, 'error': result['error']}), 500
    
    return jsonify({'data': result['data'][0] if result['data'] else None, 'error': None})

@app.route('/api/users/stats/<telegram_user_id>')
def get_user_stats(telegram_user_id):
    """Получение статистики пользователя"""
    sql = "SELECT get_user_stats(%s) as stats"
    result = execute_query(sql, [telegram_user_id])
    
    if result['error']:
        return jsonify({'data': {'strategies': 0, 'analyses': 0}, 'error': result['error']})
    
    stats = result['data'][0]['stats'] if result['data'] else {'strategies': 0, 'analyses': 0}
    return jsonify({'data': stats, 'error': None})

# ============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================================================

def ensure_user_exists(telegram_id, user_data=None):
    """Создание пользователя если не существует"""
    # Приводим к строке для избежания несоответствия типов
    try:
        if telegram_id is None:
            return None
        telegram_id = str(telegram_id)
        print(f"[analytics] ensure_user_exists: telegram_id={telegram_id} (type={type(telegram_id).__name__})")
    except Exception:
        pass
    # Проверяем существование
    check_sql = "SELECT id FROM users WHERE telegram_id = %s"
    result = execute_query(check_sql, [telegram_id])
    if result.get('error'):
        print('[analytics] ensure_user_exists SELECT error:', result['error'])
    
    if result['data']:
        return result['data'][0]['id']
    
    # Создаем нового пользователя
    create_sql = """
    INSERT INTO users (telegram_id, username, first_name, last_name)
    VALUES (%s, %s, %s, %s)
    RETURNING id
    """
    
    # Гарантируем, что user_data - словарь
    user_data = user_data or {}
    params = [
        telegram_id,
        user_data.get('username'),
        user_data.get('first_name'),
        user_data.get('last_name')
    ]
    
    result = execute_query(create_sql, params)
    if result.get('error'):
        print('[analytics] ensure_user_exists INSERT error:', result['error'])
    
    if result['data']:
        return result['data'][0]['id']
    
    return None

# ============================================================================
# СЛУЖЕБНЫЕ ЭНДПОИНТЫ
# ============================================================================

@app.route('/api/health')
def health_check():
    """Проверка здоровья API"""
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'database': 'connected'
            })
        else:
            return jsonify({
                'status': 'unhealthy',
                'error': 'Database connection failed'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/api/info')
def api_info():
    """Информация об API"""
    return jsonify({
        'name': 'TradeAnalyzer API',
        'version': '1.0.0',
        'description': 'API для работы с торговыми стратегиями и анализами',
        'endpoints': {
            'GET /api/strategies': 'Получение стратегий пользователя',
            'POST /api/strategies': 'Создание новой стратегии',
            'PUT /api/strategies/<id>': 'Обновление стратегии',
            'DELETE /api/strategies/<id>': 'Удаление стратегии',
            'GET /api/analysis_results': 'Получение анализов пользователя',
            'POST /api/analysis_results': 'Создание нового анализа',
            'DELETE /api/analysis_results/<id>': 'Удаление анализа',
            'GET /api/users/stats/<telegram_id>': 'Статистика пользователя',
            'GET /api/health': 'Проверка здоровья API'
        }
    })

# ============================================================================
# ЗАПУСК ПРИЛОЖЕНИЯ
# ============================================================================

if __name__ == '__main__':
    print("🚀 Starting TradeAnalyzer API server...")
    print(f"📊 Database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    # Проверяем подключение к БД при запуске
    conn = get_db_connection()
    if conn:
        print("✅ Database connection successful")
        conn.close()
    else:
        print("❌ Database connection failed")
        exit(1)
    
    # Запуск в режиме разработки
    app.run(host='0.0.0.0', port=5000, debug=True)
