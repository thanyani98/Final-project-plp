const express = require('express');
const app = express();
const mysql2 = require('mysql2'); // Use mysql2 instead of both mysql and mysql2
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

app.use(express.json());
app.use(cors());
dotenv.config();

const db = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "Blessing@98",
    port:'3306',
});

db.connect((err) => {
    if (err) {
        return console.log("Error connecting to MySQL:", err.message);
    }

    console.log("Connected to MySQL:", db.threadId);

    db.query(`CREATE DATABASE IF NOT EXISTS eduzone`, (err, result) => {
        if (err) return console.log("Error creating database:", err.message);

        console.log("Database 'eduzone' created or already exists");

        db.changeUser({ database: 'eduzone' }, (err) => {
            if (err) return console.log("Error selecting database:", err.message);

            const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(150) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(250) NOT NULL
            )`;

            db.query(createUsersTable, (err, result) => {
                if (err) return console.log("Error creating users table:", err.message);

                console.log("Users table created or already exists");
            });
        });
    });
});

app.post('/api/register' , async(req,res) => {
    try{
        const users = `SELECT * FROM users WHERE email = ?`

        db.query(users, [req.body.email], (err, data) => {
            if(data.length) return res.status(409).json("User already exists")
             
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)

            const createUser = `INSERT INTO users(email, username, password ) VALUES (?)`
            value = [
                req.body.email,
                req.body.username,
                hashedPassword
            ]


            db.query(createUser, [value], (err, data) => {
                if(err) res.status(500).json("something went wrong")
    
                    return res.status(200).json("User created successfully");
           })
        
        })

    }
    catch(err){
        res.status(500).json("Internal Server Error")
    }
})

app.post('/api/login', async(req, res) =>{
    try{
         const users = `SELECT * FROM users WHERE email = ?`

         db.query(users, [req.body.email], (err,data) =>{
            if(data.length === 0) return res.status(404).json("User is not found")

            const isPasswordValid =bcrypt.compareSync(req.body.password, data[0].password)

            if(!isPasswordValid) return res.status(400).json("Invalid Password")

            return res.status(200).json("Login Successfully")
         })
    }
    catch(err) {
        res.status(500).json("Internal Server Error")
    }
})



app.listen(3000, () => {
    console.log("Server is running on PORT 3000")
});