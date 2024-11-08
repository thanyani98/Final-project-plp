const express = require('express');
const app = express();
const mysql2 = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

app.use(express.json());
app.use(cors());
dotenv.config();

const db = mysql2.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Blessing@98",
    port: process.env.DB_PORT || '3306',
    database: 'eduzone',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.query(`CREATE DATABASE IF NOT EXISTS eduzone`, (err) => {
    if (err) {
        console.log("Error creating database:", err.message);
        return;
    }

    console.log("Database 'eduzone' ensured");

    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(250) NOT NULL
    )`;

    db.query(createUsersTable, (err) => {
        if (err) {
            console.log("Error creating users table:", err.message);
            return;
        }
        console.log("Users table ensured");
    });
});

app.post('/api/register', async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json("All fields are required");
    }

    try {

        const [existingUsers] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(409).json("User already exists");
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        
        const [result] = await db.promise().query(
            'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
            [email, username, hashedPassword]
        );

        if (result.affectedRows === 1) {
            return res.status(201).json("User registered successfully");
        } else {
            throw new Error("Failed to insert user");
        }
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json("An error occurred during registration");
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json("Email and password are required");
    }

    try {
        const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json("User not found");
        }

        const isPasswordValid = await bcrypt.compare(password, users[0].password);

        if (!isPasswordValid) {
            return res.status(400).json("Invalid password");
        }

        
        return res.status(200).json("Login successful");
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json("An error occurred during login");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});