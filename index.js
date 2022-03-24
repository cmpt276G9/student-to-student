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
  connectionString: process.env.DATABASE_URL|| 
    "postgres://postgres:@localhost/s2s"
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
  // const upload = multer({storage:filestorage})
  const upload = multer({storage:multer.memoryStorage()})
  app.get('/register', (req, res) => res.render('pages/register'))
  app.get('/user_profile', (req, res) => res.render('pages/user_profile'))
  app.get('/findbook', (req, res) =>{
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
      if(req.session.user.role = 0)
        res.render('/manager_dashboard');
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
      var userdata = {name: req.session.user.name};
      // 要不要检测是否为重复的书？（应该不用)
      // 这里的seller，上架日期，描述，暂时没加进去
      //seller有一些瑕疵...
      pool.query(`INSERT INTO books (bookname,author,pages,seller,publishdate,language,course,price,description,imghere) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9,$10)`, [bookdata.Bookname,bookdata.Author,bookdata.Pages,userdata,bookdata.date,
        bookdata.Language,bookdata.Course, bookdata.price, bookdata.description, image],(err,results)=>{
          if(err)
            throw err
          res.status(201)
          res.redirect("/findbook")
        })
    }
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))