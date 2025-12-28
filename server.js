const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Создаем папки для данных
const dataDir = path.join(__dirname, 'data');
const logsDir = path.join(__dirname, 'logs');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Логирование
const logRequest = (req, res, next) => {
    const log = `${new Date().toISOString()} | ${req.method} ${req.url} | IP: ${req.ip}\n`;
    fs.appendFileSync(path.join(logsDir, 'access.log'), log);
    next();
};
app.use(logRequest);

// Инициализация данных
const initializeData = () => {
    const defaultData = {
        'posts.json': {
            posts: [
                {
                    id: 1,
                    title: "Дизайн Discord сервера",
                    description: "Полный редизайн с кастомными эмодзи",
                    category: "design",
                    type: "image",
                    date: "2025-01-20",
                    content: ""
                },
                {
                    id: 2,
                    title: "Windows Optimizer",
                    description: "Программа для оптимизации Windows 10/11",
                    category: "windows",
                    type: "software",
                    price: 0,
                    date: "2025-01-15"
                },
                {
                    id: 3,
                    title: "Juniper Setup Guide",
                    description: "Как настроить Juniper Bot за 5 минут",
                    category: "juniper",
                    type: "video",
                    content: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    date: "2025-01-10"
                }
            ]
        },
        'orders.json': { orders: [] },
        'settings.json': {
            siteName: "DVX Studio",
            siteDescription: "Креативные решения для ваших проектов",
            discordLink: "https://discord.gg/example",
            youtubeLink: "https://youtube.com/@zoliryzik"
        }
    };

    Object.entries(defaultData).forEach(([file, data]) => {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
    });
};

// Проверка здоровья
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DVX Studio API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Получить все данные (для теста)
app.get('/api/data', (req, res) => {
    try {
        const files = ['posts.json', 'orders.json', 'settings.json'];
        const data = {};
        
        files.forEach(file => {
            const filePath = path.join(dataDir, file);
            if (fs.existsSync(filePath)) {
                data[file.replace('.json', '')] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        });
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить посты
app.get('/api/posts', (req, res) => {
    try {
        const { category } = req.query;
        const postsPath = path.join(dataDir, 'posts.json');
        
        if (!fs.existsSync(postsPath)) {
            return res.json({ posts: [] });
        }
        
        const data = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
        let posts = data.posts || [];
        
        if (category) {
            posts = posts.filter(post => post.category === category);
        }
        
        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Авторизация (GET метод)
app.get('/api/admin/auth', (req, res) => {
    const password = req.query.pass;
    const correctPassword = process.env.ADMIN_PASSWORD || "default_39_char_password_for_dvx_studio_12345";
    
    if (password === correctPassword && password.length === 39) {
        res.json({
            success: true,
            token: "dvx_token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            message: "Авторизация успешна"
        });
    } else {
        res.status(401).json({
            success: false,
            error: "Неверный пароль"
        });
    }
});

// Авторизация (POST метод)
app.post('/api/admin/auth', (req, res) => {
    const { password } = req.body;
    const correctPassword = process.env.ADMIN_PASSWORD || "default_39_char_password_for_dvx_studio_12345";
    
    if (password === correctPassword && password.length === 39) {
        res.json({
            success: true,
            token: "dvx_token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            message: "Авторизация успешна"
        });
    } else {
        res.status(401).json({
            success: false,
            error: "Неверный пароль"
        });
    }
});

// Создать заказ
app.post('/api/orders', (req, res) => {
    try {
        const order = req.body;
        const ordersPath = path.join(dataDir, 'orders.json');
        
        let orders = { orders: [] };
        if (fs.existsSync(ordersPath)) {
            orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        }
        
        const newId = orders.orders.length > 0 ? Math.max(...orders.orders.map(o => o.id)) + 1 : 1;
        order.id = newId;
        order.date = new Date().toISOString();
        order.status = 'new';
        
        orders.orders.push(order);
        fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
        
        res.json({
            success: true,
            message: "Заказ создан",
            order: order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Админ: получить заказы
app.get('/api/admin/orders', (req, res) => {
    try {
        const ordersPath = path.join(dataDir, 'orders.json');
        
        if (!fs.existsSync(ordersPath)) {
            return res.json({ orders: [] });
        }
        
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        res.json({ orders: orders.orders || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Админ: получить настройки
app.get('/api/admin/settings', (req, res) => {
    try {
        const settingsPath = path.join(dataDir, 'settings.json');
        
        if (!fs.existsSync(settingsPath)) {
            return res.json({
                siteName: "DVX Studio",
                siteDescription: "Креативные решения для ваших проектов"
            });
        }
        
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Админ: сохранить настройки
app.post('/api/admin/settings', (req, res) => {
    try {
        const settings = req.body;
        const settingsPath = path.join(dataDir, 'settings.json');
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        
        res.json({
            success: true,
            message: "Настройки сохранены"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Админ: добавить пост
app.post('/api/admin/posts', (req, res) => {
    try {
        const post = req.body;
        const postsPath = path.join(dataDir, 'posts.json');
        
        let data = { posts: [] };
        if (fs.existsSync(postsPath)) {
            data = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
        }
        
        const newId = data.posts.length > 0 ? Math.max(...data.posts.map(p => p.id)) + 1 : 1;
        post.id = newId;
        post.date = new Date().toISOString().split('T')[0];
        
        data.posts.push(post);
        fs.writeFileSync(postsPath, JSON.stringify(data, null, 2));
        
        res.json({
            success: true,
            message: "Пост добавлен",
            post: post
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Админ: удалить пост
app.delete('/api/admin/posts/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const postsPath = path.join(dataDir, 'posts.json');
        
        if (!fs.existsSync(postsPath)) {
            return res.status(404).json({ error: "Посты не найдены" });
        }
        
        let data = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
        const initialLength = data.posts.length;
        data.posts = data.posts.filter(post => post.id !== id);
        
        if (data.posts.length < initialLength) {
            fs.writeFileSync(postsPath, JSON.stringify(data, null, 2));
            res.json({ success: true, message: "Пост удален" });
        } else {
            res.status(404).json({ error: "Пост не найден" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику
app.get('/api/admin/stats', (req, res) => {
    try {
        const postsPath = path.join(dataDir, 'posts.json');
        const ordersPath = path.join(dataDir, 'orders.json');
        
        let posts = 0;
        let orders = 0;
        
        if (fs.existsSync(postsPath)) {
            const postsData = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
            posts = postsData.posts?.length || 0;
        }
        
        if (fs.existsSync(ordersPath)) {
            const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
            orders = ordersData.orders?.length || 0;
        }
        
        res.json({
            posts: posts,
            orders: orders,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 404 обработчик
app.use((req, res) => {
    res.status(404).json({
        error: "Не найдено",
        message: `Путь ${req.url} не существует`,
        availableEndpoints: [
            "GET  /api/health",
            "GET  /api/data",
            "GET  /api/posts?category=",
            "GET  /api/admin/auth?pass=пароль",
            "POST /api/admin/auth",
            "POST /api/orders",
            "GET  /api/admin/orders",
            "GET  /api/admin/settings",
            "POST /api/admin/settings",
            "POST /api/admin/posts",
            "DELETE /api/admin/posts/:id",
            "GET  /api/admin/stats"
        ]
    });
});

// Запуск сервера
app.listen(PORT, () => {
    initializeData();
    console.log(`
╔══════════════════════════════════════╗
║       🚀 DVX Studio API              ║
║       Версия: 1.0.0                  ║
║       Порт: ${PORT}                  ║
║       Дата: ${new Date().toLocaleString()} ║
╚══════════════════════════════════════╝
    
📡 API доступно по адресу: http://localhost:${PORT}
🔧 Проверка здоровья: http://localhost:${PORT}/api/health
📊 Все данные: http://localhost:${PORT}/api/data
    
💡 Советы:
- Замените пароль в переменной окружения ADMIN_PASSWORD
- Для теста используйте: default_39_char_password_for_dvx_studio_12345
    `);
});
