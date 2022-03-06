const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
  "postgres://postgres:root@localhost/cmpt276"
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

const app = express()
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render('pages/index'))
  app.get('/login', (req, res) => res.render('pages/login'))
  app.get('/register', (req, res) => res.render('pages/register'))
  app.post('/login' , (req, res) => {
    res.send("hello");

  })
  app.post('/register' , (req, res) => {
    
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
