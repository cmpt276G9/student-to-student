const { name } = require('ejs');
const express = require('express')
const path = require('path')
const session = require("express-session")
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000 

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
  "postgres://postgres:2123257@localhost/users"
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

const app = express()
  // app.use(cookieParser());  
  app.use(session({
  name: "session",
  secret: 'elden ring',
  resave: false, //Forces the session to be saved back to the session store
  saveUninitialized: false, //Forces a session that is "uninitialized" to be saved to the store
  maxAge: 30 * 60 * 1000 // 30 minutes

  }))
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.set('views', path.join(__dirname, 'views')) 
  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render('pages/index'))
  app.get('/login', (req, res) => res.render('pages/login'))
  app.get('/register', (req, res) => res.render('pages/register'))
  app.get('/dashboard', async(req, res) =>{ 
    res.render('pages/dashboard', req.session.user);
  })
  app.post('/login' , (req, res) => {
    // 
    //check if req.session has number:
    if(!req.sessionID){
      res.render('pages/dashboard', req.session.user)
    }
    var data = req.body;
    console.log(data.Useraccount);
    var userQuery = `SELECT * FROM userprof where useraccount = '${data.Useraccount}'`;
    pool.query(userQuery, async(error,results)=>{
      if(error){
        res.send(`invalid account, <a href=\'/login'>click to go back to login page</a>`);
        //potential improvement: print error messages under form in .ejs
      }
      else{
          results.rows.forEach(function(r){
            //check password matches:
            if(r.password != data.password)
            {
              res.send(`invalid password, <a href=\'/login'>click to go back to login page</a>`);
            }
            else{//password matches:
              //check if login user is a manager: future feature
              var user = {useraccount: r.useraccount, name: r.uname, password: r.password};
              req.session.user = user;
              console.log(req.session.user.name);
              //if loging user is a manager, then go to manager dashboard
              res.send(`Hey there, ${req.session.user.name} welcome <a href=\'/logout'>click to logout</a>
              click here to go to dashboard page <a href=\'/dashboard'>click to logout</a>`)
            }
        }) 
      }
    })

  })
  app.get("/logout", function(req, res) {
    req.session.destroy(() => {
     req.logout();
     res.redirect("/");
    })
   });
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
    if(data.password != data.Confirmpassword)
    {
      return res.status(400).send('different passwords') //400？
    }
    else{
       pool.query(`SELECT * FROM userprof where account = $1`, [data.Useraccount],(err,results)=>{
         if(err){
           throw error
         }
         if(results.rows.length)
         {
           res.send("account is already exists.")
         }
         else{
          pool.query(
            `INSERT INTO userprof (useraccount,uname,password) VALUES ($1, $2, $3)`, [data.Useraccount,data.name, data.password], 
            (err,results)=>{
              if(err)
              {
                throw err
              }
              res.status(201).send("User created successfully")
            })
          }
        })
    }
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
