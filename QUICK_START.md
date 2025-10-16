# 🚀 БЫСТРЫЙ СТАРТ

## ✅ Что уже готово:
- Сервер Timeweb с API: `http://185.207.64.160/api`
- Код приложения обновлён для работы с Timeweb

## 📋 Что нужно сделать:

### 1. Тест локально (на вашем Mac)

```bash
# Откройте index.html в браузере
open /Users/arseniyvaravin/Documents/Trade_analysis_tg/index.html
```

**Проверьте консоль (F12):**
- Должно быть: `✅ Timeweb client initialized successfully`
- Должно быть: `✅ Timeweb connection successful`

### 2. Загрузка на хостинг

**Если используете GitHub Pages:**
```bash
cd /Users/arseniyvaravin/Documents/Trade_analysis_tg
git add .
git commit -m "feat: Миграция на Timeweb API"
git push origin main
```

**Если используете другой хостинг:**
- Загрузите все файлы через FTP/панель управления

### 3. Проверка в Telegram

1. Откройте бот: `@checkyourtrade_bot`
2. Запустите Web App
3. Попробуйте создать стратегию
4. Попробуйте создать анализ

---

## 🐛 Если что-то не работает:

### Проблема: API не отвечает

**Проверка на сервере:**
```bash
ssh tradeanalyzer@185.207.64.160
systemctl status tradeanalyzer.service
curl http://127.0.0.1/api/health
```

### Проблема: Ошибки в браузере

1. Откройте консоль (F12)
2. Проверьте вкладку Network
3. Найдите запросы к `/api/*`
4. Проверьте ответ сервера

---

## 📞 Быстрая помощь:

**Проверка здоровья API:**
```bash
curl http://185.207.64.160/api/health
```

Должен вернуть:
```json
{"status":"healthy", ...}
```

**Если не работает — пришлите вывод команды выше.**

---

## 🎯 Готово!

После выполнения шагов 1-3 приложение полностью работает с Timeweb API.
