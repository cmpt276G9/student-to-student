const { name } = require('ejs');
const express = require('express')
const path = require('path')
const session = require("express-session")
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000 

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  
  // "postgres://postgres:@localhost/s2s"
  ssl: {
    rejectUnauthorized: false
  }
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
  app.get('/login', (req, res) => {
    //potential error: cannot set headers after they are sent to the client(future improvement)
    // console.log(req.session.user)
    // if(req.session.loggedin){
    //   //console.log(req.session.user)
    //   //console.log("coming in session")
    //   var dataset = {useraccount: req.session.user.useraccount, 
    //     name: req.session.user.name, password: req.session.user.password};
    //   res.render('pages/dashboard', dataset);
    // }
    res.render('pages/login')
  })
  app.get('/register', (req, res) => res.render('pages/register'))
  app.get('/user_profile', (req, res) => res.render('pages/user_profile'))
  app.get('/dashboard',async(req, res) =>{ 
    if(req.session.loggedin){
      var dataset = {useraccount: req.session.user.useraccount, 
        name: req.session.user.name, password: req.session.user.password};
      res.render('pages/dashboard', dataset);
    }
    else{
      res.send('Please login to view this page!')
    }
    res.end()
  })
  app.get('/manager_dashboard',(req,res)=>{
    if(req.session.loggedin){
      if(req.session.user.role = 0){
        var dataset = {useraccount: req.session.user.useraccount, 
          name: req.session.user.name, password: req.session.user.password};
        res.render('/manager_dashboard', dataset);
      }
      else
        res.send('You do not have permission to view this page')
      }
      else{
        res.send('Please login to view this page!')
      }
      res.end()
  })
  app.post('/logindata' , (req, res) => {
    // 
    //check if req.session has number:
    // console.log(req.session.user)
    // if(req.session.user){
    //   var dataset = {useraccount: req.session.user.useraccount, 
    //     name: req.session.user.name, password: req.session.user.password};
    //   res.render('pages/dashboard', dataset);
    // }
    var data = req.body;
    //console.log(data.Useraccount);
    var userQuery = `SELECT * FROM userprof where useraccount = '${data.Useraccount}'`;
    pool.query(userQuery, async(error,results)=>{
      if(error){
        return res.send(`invalid account, <a href=\'/login'>click to go back to login page</a>`);
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
              var user = {useraccount: r.useraccount, name: r.uname, password: r.password, role : r.role};
              req.session.loggedin = true;
              req.session.user = user;
              if(r.role == 1)
              {
              //console.log(req.session.user.name);
              //if loging user is a manager, then go to manager dashboard
              res.redirect("/dashboard")
              }
              else
              {
                req.session.user.role = 0;
                res.redirect("/manager_dashboard")
              }
            }
        }) 
      }
    })
  })
  // app.post('/auth', function(req, res) {
  //   const userdata = req.body
  //   if (userdata.Useraccount && userdata.password) {
  //     // Execute SQL query that'll select the account from the database based on the specified username and password
  //     pool.query(`SELECT * FROM userprof WHERE useraccount = '${userdata.Useraccount}' AND password = '${userdata.password}'`, (error, results)=> {
  //       // If there is an issue with the query, output the error
  //       if (error) {throw error}
  //       // If the account exists
  //       if (results.length > 0) {
  //         // Authenticate the user
  //         req.session.loggedin = true;
  //         req.session.username = username;
  //         // Redirect to home page
  //         res.redirect('/home');
  //       } else {
  //         res.send('Incorrect Username and/or Password!');
  //       }			
  //       res.end();
  //     });
  //   } else {
  //     res.send('Please enter Username and Password!');
  //     res.end();
  //   }
  // })
  app.get("/logout", function(req, res) {
    req.session.destroy(err => {
      if (err) {
        res.status(400).send('Unable to log out')
      } else {
        res.send(`Logout successful, click here to go to <a href=\'/'>home page</a> `)
      }
    });
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
      pool.query(`SELECT * FROM userprof where useraccount = $1`, [data.Useraccount],(err,results)=>{
        if(err){
          throw err
        }
        if(results.rows.length)
        {
          res.send("account is already exists.")
        }
        else{
         pool.query(
           `INSERT INTO userprof (useraccount,uname,password,role) VALUES ($1, $2, $3,$4)`, [data.Useraccount,data.name, data.password,1], 
           (err,results)=>{
             if(err)
             {
               throw err
             }
             res.status(201)
             res.redirect("/")
           })
         }
       })
   }
  })

  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))