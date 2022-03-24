const { name } = require('ejs');
const express = require('express')
const path = require('path')
const session = require("express-session")
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000 

const { Pool } = require('pg');
const { connect } = require('http2');
const multer = require('multer');
const { memoryStorage } = require('multer');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
  "postgres://postgres:1234@localhost/postgres"
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
  app.get('/books/:id',async(req,res)=>{
    const id = req.params.id
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    const startindex = (page-1)* limit
    const endindex = page*limit
    const results = {}
    results.next ={
      page: page+1,
      limit: limit
    }
    if(startindex >0){
      results.previous ={
        page: page-1,
        limit: limit
      }
    }
    pool.query(`SELECT * FROM books where id = '${id}'`, (error,results)=>{
      if(error)
      {
        throw error
      } 
      bookdata = {data: results.rows}
      res.render('pages/bookdetail',bookdata)
      //怎么render进去？
    })
  })
  app.get('/login', (req, res) => {
    // console.log(req.session.user)
    if(req.session.loggedin){
      //console.log(req.session.user)
      //console.log("coming in session")

      res.redirect('/dashboard')
    }
    else{
      res.render('pages/login')
    }
  })

  const filestorage = multer.diskStorage({
    destination: (req,file, cb) =>{
      cb(null,"./public/image")
    },
    filename: (req,file,cb) =>{
      cb(null,Date.now() + "--" + file.originalname)
    },
  })
  const upload = multer({storage:multer.memoryStorage()})
  app.get('/edit_info', (req, res) => res.render('pages/edit_info'))
  app.post('/updateinfo',async(req,res) =>{
    const id = req.session.user.id
    var uage=req.body.age
    var umajor=req.body.major
    var uphonenumber=req.body.phonenumber
    pool.query(`UPDATE userprof SET age = '${uage}' ,major = '${umajor}',phonenumber = '${uphonenumber}' WHERE id = '${id}';`,async(error,result)=>
    {
      res.render('pages/updateinfo', result);
    })
  })
  app.get('/register', (req, res) => res.render('pages/register'))
  app.get('/user_profile', (req, res) =>{
    console.log('get user profile!!!')
    const id = req.session.user.id
    let user
    let books 
    pool
      .query(`SELECT * FROM userprof where id = '${id}'`)
      .then((res) => {
        user = res.rows[0]
      })
      .then(() => {
        return pool.query(`SELECT * FROM books where seller = '${user.uname}'`)
      })
      .then((result) => {
        books = result.rows
        res.render('pages/user_profile', {user, books})
      })
  })
  app.get('/findbook', (req, res) =>{
    pool.query(`SELECT * FROM books`,(error,result)=>{
      if(error)
        res.end(error)
      var results = {'rows': result.rows}
      res.render('pages/findbook',results)
    })
  })
  app.get('/addbooks',(req, res) => res.render('pages/addbooks'))
  app.get('/edit_info',(req, res) => res.render('pages/edit_info'))
  app.get('/findclassmate', (req, res) => res.render('pages/findclassmate'))
  app.get('/message_sending', (req,res) =>res.render('pages/manage_user'))
  app.get('/manage_user', (req,res) =>res.render('pages/msg_sending'))
  app.get('/msgstoring', (req,res) =>{
    if(!req.session.loggedin){
      res.send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
    else{
      var uac = req.session.user.useraccount;
      var storequery = `UPDATE userprof SET msgsent = '${req.msgbar}' where useraccount = ${uac}`;
      var replacequery = `UPDATE userprof SET msgrec = '${req.msgbar}' where useraccount = ${req.uaccount}`
      pool.query(storequery, async(err,res) =>{
        if(error){
          res.status(400).send('Unable to send')
        }
        else{
          pool.query(replacequery, async(err,res)=>{
            if(err){
              res.status(400).send('unable to recieve, probably no such user exist');
            }
            else{
              res.send(`sending successful. <a href =\ '/dashboard'>click here</a> to go back to your main page`)
            }
          })
        }
      })
    }
  })
  app.get('/dashboard',async(req, res) =>{ 
    if(req.session.loggedin){
      var dataset = {useraccount: req.session.user.useraccount, 
        name: req.session.user.name, password: req.session.user.password};
      res.render('pages/dashboard', dataset);
    }
    else{
      res.send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
    res.end()
  })
  app.get('/manager_dashboard', async(req,res)=>{
    if(req.session.loggedin){
      if(req.session.user.role == 0){
        //console.log("entering manager dashboard");
        var dataset = {useraccount: req.session.user.useraccount, 
          name: req.session.user.name, password: req.session.user.password, role: req.session.user.role };
        res.render('pages/manager_dashboard', dataset);
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
              var user = {useraccount: r.useraccount, name: r.uname, password: r.password, role : r.role , id : r.id};
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

  app.post('/addbook', upload.single('bookCover'),(req,res)=>{
    const bookdata = req.body
    if(!bookdata.Bookname)
    {
      return res.status(400).send('missing book title')
    }
    if(!bookdata.Author)
    {
      return res.status(400).send('missing Author')
    }
    if(!bookdata.Pages)
    {
      return res.status(400).send('missing Pages')
    }
    if(!bookdata.date)
    {
      return res.status(400).send('date')
    }
    if(!bookdata.Language)
    {
      return res.status(400).send('missing Language')
    }
    if(!bookdata.Course)
    {
      return res.status(400).send('missing Course')
    }
    // if(!req.file)
    // {
    //   return res.status(400).send('missing book cover')
    // }
    if(!bookdata.price)
    {
      return res.status(400).send('missing price')
    }
    else{
      image = req.file.buffer.toString('base64')
      // 要不要检测是否为重复的书？（应该不用)
      // 这里的上架日期暂时没加进去
      //seller有一些瑕疵...
      // 这里需要把传进去的user name改成id，然后用join
      pool.query(`INSERT INTO books (bookname,author,pages,seller,publishdate,language,course,price,description,imghere) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9,$10)`, [bookdata.Bookname,bookdata.Author,bookdata.Pages,req.session.user.name,bookdata.date,
        bookdata.Language,bookdata.Course, bookdata.price, bookdata.description, image],(err,results)=>{
          if(err)
            throw err
          res.status(201)
          res.redirect("/findbook")
        })
    }
  })

  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))