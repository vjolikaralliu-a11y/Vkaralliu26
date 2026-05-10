const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Use dynamic path for the public folder
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_PATH = path.join(__dirname, 'portal.db');

const db = new sqlite3.Database(DB_PATH);
const PORT = 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'vlora-alumin-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE,
        status TEXT DEFAULT 'pending',
        role TEXT DEFAULT 'user'
    )`);
});

const authRequired = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/login');
};

const adminRequired = (req, res, next) => {
    if (req.session.userRole === 'admin') return next();
    res.status(403).send('Access Denied: Admin only');
};

// Middleware to handle static files first
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'register.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'forgot.html'));
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    const hashedPw = bcrypt.hashSync(password, 10);
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPw], (err) => {
        if (err) return res.status(400).json({ error: 'Username or Email already exists' });
        res.json({ message: 'Registration successful. Please wait for admin approval.' });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (user.status === 'pending') {
            return res.status(403).json({ error: 'Your account is pending admin approval.' });
        }
        req.session.userId = user.id;
        req.session.userRole = user.role;
        res.json({ redirect: '/dashboard' });
    });
});

app.get('/dashboard', authRequired, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/admin', authRequired, adminRequired, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.get('/api/pending-users', authRequired, adminRequired, (req, res) => {
    db.all(`SELECT id, username, email FROM users WHERE status = 'pending'`, [], (err, rows) => {
        res.json(rows);
    });
});

app.post('/api/approve-user', authRequired, adminRequired, (req, res) => {
    const { userId } = req.body;
    db.run(`UPDATE users SET status = 'approved' WHERE id = ?`, [userId], (err) => {
        res.json({ message: 'User approved successfully' });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fletore running at http://0.0.0.0:${PORT}`);
});
