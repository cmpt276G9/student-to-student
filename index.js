const { name } = require('ejs');
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
  "postgres://postgres:[password]@localhost/db_dir"
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
    // just test 
    res.send("hello");

  })
  app.post('/register' , async (req, res) => {
    const data = req.body

    if(!data.name)
    {
      return res.status(400).send('missing name')
    }
    if(!data.Useraccount)
    {
      return res.status(400).send('missing Useraccount')
    }
    if(!data.password)
    {
      return res.status(400).send('missing password')
    }
    if(!data.Confirmpassword)
    {
      return res.status(400).send('missing Confirmpassword')
    }
    //control password length?
    if(data.password != userdata.Confirmpassword)
    {
      return res.status(400).send('different passwords') //400？
    }
    else{
      pool.query(`SELECT * FROM users where account = $1`, [data.Useraccount],(err,results)=>{
        if(err){
          throw error
        }
        if(results.rows.length)
        {
          res.send("account is already exists.")
        }
        else{
          pool.query(
            `INSERT INTO user (name,account,password) VALUES ($1, $2, $3)`, [data.name, data.Useraccount, data.password], 
            (err,results)=>{
              if(err)
              {
                throw err
              }
              res.status(201).send("User created successfully")
            }
          )
        }
      })
      
    }
    //using session to auto login
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
