#!/usr/bin/env python3
"""
API сервер для подключения к PostgreSQL на Timeweb
Замена для Supabase API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import json
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для фронтенда

# Конфигурация БД
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'tradeanalyzer'),
    'user': os.getenv('DB_USER', 'tradeanalyzer_app'),
    'password': os.getenv('DB_PASSWORD', 'SECURE_PASSWORD_HERE')
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
        return {'error': 'Database connection failed'}
    
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params or [])
            
            if fetch:
                rows = cur.fetchall()
                # Конвертируем в обычные словари для JSON
                result = [dict(row) for row in rows]
            else:
                result = []
                
            conn.commit()
            return {'rows': result, 'error': None}
            
    except Exception as e:
        conn.rollback()
        return {'rows': None, 'error': str(e)}
    finally:
        conn.close()

@app.route('/api/query', methods=['POST'])
def execute_sql():
    """Эндпоинт для выполнения SQL запросов"""
    try:
        data = request.get_json()
        sql = data.get('sql')
        params = data.get('params', [])
        
        if not sql:
            return jsonify({'error': 'SQL query is required'}), 400
        
        # Проверяем, что это безопасный запрос (базовая защита)
        sql_lower = sql.lower().strip()
        if any(dangerous in sql_lower for dangerous in ['drop', 'truncate', 'alter']):
            return jsonify({'error': 'Dangerous SQL operations are not allowed'}), 403
        
        result = execute_query(sql, params, fetch='select' in sql_lower)
        
        if result['error']:
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET', 'POST'])
def handle_users():
    """Работа с пользователями"""
    if request.method == 'GET':
        telegram_id = request.args.get('telegram_id')
        if telegram_id:
            sql = "SELECT * FROM users WHERE telegram_id = %s"
            result = execute_query(sql, [telegram_id])
        else:
            sql = "SELECT * FROM users ORDER BY created_at DESC"
            result = execute_query(sql)
        
        if result['error']:
            return jsonify({'error': result['error']}), 500
        
        return jsonify({'data': result['rows']})
    
    elif request.method == 'POST':
        data = request.get_json()
        
        sql = """
        INSERT INTO users (telegram_id, username, first_name, last_name)
        VALUES (%(telegram_id)s, %(username)s, %(first_name)s, %(last_name)s)
        ON CONFLICT (telegram_id) DO UPDATE SET
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            updated_at = NOW()
        RETURNING *
        """
        
        result = execute_query(sql, data)
        
        if result['error']:
            return jsonify({'error': result['error']}), 500
        
        return jsonify({'data': result['rows'][0] if result['rows'] else None})

@app.route('/api/strategies', methods=['GET', 'POST'])
def handle_strategies():
    """Работа со стратегиями"""
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        telegram_user_id = request.args.get('telegram_user_id')
        
        if user_id:
            sql = "SELECT * FROM strategies WHERE user_id = %s ORDER BY created_at DESC"
            result = execute_query(sql, [user_id])
        elif telegram_user_id:
            sql = """
            SELECT s.* FROM strategies s
            JOIN users u ON u.id = s.user_id
            WHERE u.telegram_id = %s
            ORDER BY s.created_at DESC
            """
            result = execute_query(sql, [telegram_user_id])
        else:
            sql = "SELECT * FROM strategies WHERE is_public = true ORDER BY created_at DESC"
            result = execute_query(sql)
        
        if result['error']:
            return jsonify({'error': result['error']}), 500
        
        return jsonify({'data': result['rows']})
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Получаем user_id по telegram_id
        if 'telegram_user_id' in data:
            user_sql = "SELECT id FROM users WHERE telegram_id = %s"
            user_result = execute_query(user_sql, [data['telegram_user_id']])
            if user_result['rows']:
                data['user_id'] = user_result['rows'][0]['id']
        
        sql = """
        INSERT INTO strategies (user_id, telegram_user_id, name, description, fields, is_public)
        VALUES (%(user_id)s, %(telegram_user_id)s, %(name)s, %(description)s, %(fields)s, %(is_public)s)
        RETURNING *
        """
        
        result = execute_query(sql, data)
        
        if result['error']:
            return jsonify({'error': result['error']}), 500
        
        return jsonify({'data': result['rows'][0] if result['rows'] else None})

@app.route('/api/analyses', methods=['GET', 'POST'])
def handle_analyses():
    """Работа с анализами"""
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        telegram_user_id = request.args.get('telegram_user_id')
        
        if user_id:
            sql = "SELECT * FROM analyses WHERE user_id = %s ORDER BY created_at DESC"
            result = execute_query(sql, [user_id])
        elif telegram_user_id:
            sql = """
            SELECT a.* FROM analyses a
            JOIN users u ON u.id = a.user_id
            WHERE u.telegram_id = %s
            ORDER BY a.created_at DESC
            """
            result = execute_query(sql, [telegram_user_id])
        else:
            return jsonify({'error': 'user_id or telegram_user_id is required'}), 400
        
        if result['error']:
            return jsonify({'error': result['error']}), 500
        
        return jsonify({'data': result['rows']})
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Получаем user_id по telegram_id
        if 'telegram_user_id' in data:
            user_sql = "SELECT id FROM users WHERE telegram_id = %s"
            user_result = execute_query(user_sql, [data['telegram_user_id']])
            if user_result['rows']:
                data['user_id'] = user_result['rows'][0]['id']
        
        sql = """
        INSERT INTO analyses (user_id, telegram_user_id, strategy_id, strategy_name, coin, 
                             answers, positive_factors, negative_factors, neutral_factors, recommendation)
        VALUES (%(user_id)s, %(telegram_user_id)s, %(strategy_id)s, %(strategy_name)s, %(coin)s,
                %(answers)s, %(positive_factors)s, %(negative_factors)s, %(neutral_factors)s, %(recommendation)s)
        RETURNING *
        """
        
        result = execute_query(sql, data)
        
        if result['error']:
            return jsonify({'error': result['error']}), 500
        
        return jsonify({'data': result['rows'][0] if result['rows'] else None})

@app.route('/api/stats/<telegram_user_id>')
def get_user_stats(telegram_user_id):
    """Получение статистики пользователя"""
    sql = "SELECT get_user_stats(%s) as stats"
    result = execute_query(sql, [telegram_user_id])
    
    if result['error']:
        return jsonify({'error': result['error']}), 500
    
    stats = result['rows'][0]['stats'] if result['rows'] else {'strategies': 0, 'analyses': 0}
    return jsonify({'data': stats})

@app.route('/api/health')
def health_check():
    """Проверка здоровья API"""
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})
        else:
            return jsonify({'status': 'unhealthy', 'error': 'Database connection failed'}), 500
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/api/migrate', methods=['POST'])
def migrate_data():
    """Импорт данных из Supabase экспорта"""
    try:
        data = request.get_json()
        
        if not data or 'users' not in data:
            return jsonify({'error': 'Invalid migration data'}), 400
        
        migrated = {'users': 0, 'strategies': 0, 'analyses': 0}
        
        # Миграция пользователей
        for user in data.get('users', []):
            sql = """
            INSERT INTO users (id, telegram_id, username, first_name, last_name, created_at, updated_at)
            VALUES (%(id)s, %(telegram_id)s, %(username)s, %(first_name)s, %(last_name)s, %(created_at)s, %(updated_at)s)
            ON CONFLICT (telegram_id) DO NOTHING
            """
            result = execute_query(sql, user, fetch=False)
            if not result['error']:
                migrated['users'] += 1
        
        # Миграция стратегий
        for strategy in data.get('strategies', []):
            sql = """
            INSERT INTO strategies (id, user_id, name, description, fields, is_public, created_at, updated_at)
            VALUES (%(id)s, %(user_id)s, %(name)s, %(description)s, %(fields)s, %(is_public)s, %(created_at)s, %(updated_at)s)
            ON CONFLICT (id) DO NOTHING
            """
            result = execute_query(sql, strategy, fetch=False)
            if not result['error']:
                migrated['strategies'] += 1
        
        # Миграция анализов
        for analysis in data.get('analyses', []):
            # Переименовываем поля для совместимости
            analysis_data = {
                'id': analysis.get('id'),
                'user_id': analysis.get('user_id'),
                'strategy_id': analysis.get('strategy_id'),
                'answers': analysis.get('answers'),
                'positive_factors': analysis.get('positive_factors'),
                'negative_factors': analysis.get('negative_factors'),
                'neutral_factors': analysis.get('neutral_factors'),
                'recommendation': analysis.get('recommendation'),
                'created_at': analysis.get('created_at')
            }
            
            sql = """
            INSERT INTO analyses (id, user_id, strategy_id, answers, positive_factors, 
                                negative_factors, neutral_factors, recommendation, created_at)
            VALUES (%(id)s, %(user_id)s, %(strategy_id)s, %(answers)s, %(positive_factors)s,
                    %(negative_factors)s, %(neutral_factors)s, %(recommendation)s, %(created_at)s)
            ON CONFLICT (id) DO NOTHING
            """
            result = execute_query(sql, analysis_data, fetch=False)
            if not result['error']:
                migrated['analyses'] += 1
        
        return jsonify({
            'success': True,
            'migrated': migrated,
            'message': f"Migrated {migrated['users']} users, {migrated['strategies']} strategies, {migrated['analyses']} analyses"
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Timeweb API server...")
    print(f"📊 Database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    # Проверяем подключение к БД при запуске
    conn = get_db_connection()
    if conn:
        print("✅ Database connection successful")
        conn.close()
    else:
        print("❌ Database connection failed")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
