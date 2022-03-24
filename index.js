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
var cors = require('cors')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
  "postgres://postgres:2123257@localhost/login"
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
  app.use(express.json())
  app.use("/",cors())
  app.set('views', path.join(__dirname, 'views')) 
  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render('pages/index'))
  app.get('/books/:id',async(req,res)=>{
    const id = req.params.id
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
      var dataset = {useraccount: req.session.user.useraccount, 
        name: req.session.user.name, password: req.session.user.password};
      res.render('pages/dashboard', dataset);
    }
    res.render('pages/login')
  })
  const filestorage = multer.diskStorage({
    destination: (req,file, cb) =>{
      cb(null,"./public/image")
    },
    filename: (req,file,cb) =>{
      cb(null,Date.now() + "--" + file.originalname)
    },
  })
  // const upload = multer({storage:filestorage})
  const upload = multer({storage:multer.memoryStorage()})
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
    //SELECT * FROM books ORDER BY books.name LIMIT 10 OFFSET 10*page
      pool.query(`SELECT * FROM books`,(error,result)=>{
        if(error)
          res.end(error)
        var results = {'rows': result.rows}
        res.render('pages/findbook',results)
      })
    })
  app.get('/addbooks',(req, res) => res.render('pages/addbooks'))
  app.get('/findclassmate', (req, res) => res.render('pages/findclassmate'))
  app.get('/dashboard',async(req, res) =>{ 
    if(req.session.loggedin){
      var dataset = {useraccount: req.session.user.useraccount, 
        name: req.session.user.name, password: req.session.user.password, id: req.session.user.id};
      res.render('pages/dashboard', dataset);
    }
    else{
      res.send('Please login to view this page!')
    }
    res.end()
  })
  app.get('/manager_dashboard',(req,res)=>{
    if(req.session.loggedin){
      if(req.session.user.role == 0)
        res.render('pages/manager_dashboard');
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
        res.status(400)
        return res.send(`invalid account, <a href=\'/login'>click to go back to login page</a>`);
        //potential improvement: print error messages under form in .ejs
      }
      else{
          results.rows.forEach(function(r){
            //check password matches:
            if(r.password != data.password)
            {
              res.status(400)
              res.send(`invalid password, <a href=\'/login'>click to go back to login page</a>`);
            }
            else{//password matches:
              //check if login user is a manager: future feature
              var user = {useraccount: r.useraccount, name: r.uname, password: r.password, role : r.role, id : r.id};
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
  module.exports = app
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
  //workflow：每一步用户的行为都会有反馈