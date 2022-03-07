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
  app.get('/dashboard', (req, res) => res.render('pages/dashboard'))
  app.post('/login' , (req, res) => {
    res.send("hello");

  })
  app.post('/register' , async (req, res) => {
    const userdata = req.body

    if(!userdata.name)
    {
      return res.status(400).send('missing name')
    }
    if(!userdata.Useraccount)
    {
      return res.status(400).send('missing Useraccount')
    }
    if(!userdata.password)
    {
      return res.status(400).send('missing password')
    }
    if(!userdata.Confirmpassword)
    {
      return res.status(400).send('missing Confirmpassword')
    }
    //control password length?
    if(userdata.password != userdata.Confirmpassword)
    {
      return res.status(400).send('different passwords') //400？
    }
    else{ //checking if there is same account
      
    }
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
