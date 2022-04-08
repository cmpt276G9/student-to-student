const { name } = require('ejs');
const express = require('express')
const path = require('path')
const session = require("express-session")
const cookieParser = require("cookie-parser");
var cors = require("cors")
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)
const PORT = process.env.PORT || 5000 
server.listen(PORT, () => console.log(`Listening on ${ PORT }`))

connections = [];

const { Pool } = require('pg');
const { connect } = require('http2');
const multer = require('multer');
const { memoryStorage } = require('multer');
var cors = require('cors')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
  "postgres://postgres:1234@localhost/postgres"
  // ssl: {
  //   rejectUnauthorized: false
  // }
});
  // app.use(cookieParser());  
  app.use(session({
  name: "session",
  secret: 'elden ring',
  resave: false, //Forces the session to be saved back to the session store
  saveUninitialized: false, //Forces a session that is "uninitialized" to be saved to the store
  maxAge: 30 * 60 * 1000 // 30 minutes

  }))
  app.use("/", cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.use(express.json())
  app.use("/",cors())
  app.set('views', path.join(__dirname, 'views')) 
  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render('pages/index'))
  const users = {};
  io.sockets.on('connection', socket=>{
    connections.push(socket);
    
    console.log("User connected: %s online", connections.length);

    socket.on('disconnect', data=>{
        connections.splice(connections.indexOf(socket), 1);
        console.log('User disconnect: %s online', connections.length);
    })
    socket.on('new_user', uname =>{
      users[socket.id] = uname;
      socket.broadcast.emit('user', uname);
    })
    socket.on('send-msg', data =>{
      console.log(data);
      socket.broadcast.emit('chat-msg', {msg: data, name: users[socket.id]});
    })

  })
  app.get('/books/:id',async(req,res)=>{
    const id = req.params.id
    pool.query(`SELECT * FROM books where id = '${id}'`, (error,results)=>{
      if(error)
      {
        throw error
      } 
      bookdata = {data: results.rows}
      res.render('pages/bookdetail',bookdata)
    })
  })
  app.get('/login', (req, res) => {
    if(req.session.loggedin){
      if(req.session.user.role == 0){
        res.redirect('/manager_dashboard');
      }
      else{
        res.redirect('/dashboard');
      }
    }
    else{
      res.render('pages/login')
    }
  })
  app.get('/findclassmate/map',function(req,res){
    res.sendFile(path.join(__dirname,'/map.html'))
  })
  const upload = multer({storage:multer.memoryStorage()})
  app.get('/edit_info', (req, res) => {
    if(req.session.loggedin){
      res.render('pages/edit_info')
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }

  })
  app.post('/updateinfo',async(req,res) =>{
    if(req.session.loggedin){
      const id = req.session.user.id
      var uage=req.body.age
      var umajor=req.body.major
      var uphonenumber=req.body.phonenumber
      pool.query(`UPDATE userprof SET age = '${uage}' ,major = '${umajor}',phonenumber = '${uphonenumber}' WHERE id = '${id}';`,async(error,result)=>
      {
        res.render('pages/updateinfo', result);
      })
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
  })
  app.get('/register', (req, res) => res.render('pages/register'))
  app.get('/user_profile', (req, res) =>{
    if(req.session.loggedin){
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
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
  })
  app.get('/findbook', (req, res) =>{
      pool.query(`SELECT * FROM books`,(error,result)=>{
        if(error)
          res.end(error)
        var results = {'rows': result.rows}
        res.render('pages/findbook',results)
      })
    
  })
  app.get('/addbooks',(req, res) => {
    if(req.session.loggedin){
    res.render('pages/addbooks')
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }

  })
  app.get('/findclassmate', (req, res) => {
    
    if(req.session.loggedin){
      res.render('pages/findclassmate')
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
    
  })
  app.get('/message_sending', (req,res) =>{
    if(req.session.loggedin){
     var dataset = {useraccount: req.session.user.useraccount, 
       uname: req.session.user.name, password: req.session.user.password, role: req.session.user.role };
     res.render('pages/msg_sending', dataset);
   }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
 })
  app.get('/manage_user', (req,res)=>{
    if(req.session.loggedin){
      if(req.session.user.role == 0){
        var query = `SELECT * from userprof`;
        pool.query(query, async(error, result)=>{
          if(error){
            res.status(404);
            res.end(error);
          }
          else{
            res.status(200);
            var data = {info: result.rows};
            res.render('pages/manage_user', data);
          }
        })
      }
      else{ 
        res.status(401).send(`You do not have permission to view this page, <a href =\ '/dashboard'>click here</a> to go back to your main page`)
      }
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
  })
  app.get('/manage_book',(req,res)=>{
    if(req.session.loggedin){
      if(req.session.user.role == 0){
        pool.query(`SELECT * FROM books`,(error,result)=>{
          if(error)
          res.end(error)
        var results = {'rows': result.rows}
        res.render('pages/manage_book',results)
        })
      }
      else{ 
        res.status(401).send(`You do not have permission to view this page, <a href =\ '/dashboard'>click here</a> to go back to your main page`)
      }
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
  })
  app.post('/deletebook/:bid', (req,res)=>{
    if(req.session.loggedin){
      var bookid = req.params.bid;
      pool.query(`delete from books where id = ${bookid}`, (err, result)=>{
        if(err){
          res.status(404).send('cannot find book id');
        }
        else{
          res.send(`delete success <a href=\'/dashboard'>click to go back to main page</a>`)
        }
      })
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
  })
  app.post('/deletebook', (req,res)=>{
    if(req.session.loggedin){
      if(req.session.user.role == 0){
      var bookid = req.body.bid;
      pool.query(`delete from books where id = ${bookid}`, (err, result)=>{
        if(err){
          res.status(404).send('cannot find book id');
        }
        else{
          res.send(`delete success <a href=\'/manager_dashboard'>click to go back to main page</a>`)
        }
      })
      }
      else{ 
      res.status(401).send(`You do not have permission to view this page, <a href =\ '/dashboard'>click here</a> to go back to your main page`)
    }
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
  })
  app.post('/msgstoring', (req,res) =>{
    if(!req.session.loggedin){
      res.send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
    else{
      var uac = req.session.user.useraccount;
      var storequery = `UPDATE userprof SET msgsent = '${req.body.msgbar}' where useraccount = '${uac}'`;
      var replacequery = `UPDATE userprof SET msgrec = '${req.body.msgbar}' where useraccount = '${req.body.uaccount}'`
      pool.query(storequery, async(err,resu) =>{
        if(err){
          res.end(err)
        }
        else{
          pool.query(replacequery, async(error,results)=>{
            if(error){
              res.end(error);
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
      
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }
    res.end()
  })
  app.get('/manager_dashboard', async(req,res)=>{
    if(req.session.loggedin){
      if(req.session.user.role == 0){
        var dataset = {useraccount: req.session.user.useraccount, 
          name: req.session.user.name, password: req.session.user.password, role: req.session.user.role };
        res.render('pages/manager_dashboard', dataset);
      }
      else
        res.status(401).send(`You do not have permission to view this page, click here to go to <a href=\'/dashboard'>home page</a>`)
      }
      else{
        res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
      }
      res.end()
  })
  app.post('/logindata' , (req, res) => {
    var data = req.body;
    let errors = []
    var userQuery = `SELECT * FROM userprof where useraccount = '${data.Useraccount}'`;
    pool.query(userQuery, async(error,results)=>{
      if(error){
        throw error
      }
      if(!results.rows.length)
      {
        res.status(404)
        errors.push({ message: "invalide user account!" })
      }
      if(errors.length >0){
        res.render("pages/login",{ errors})
      }
      else{
          results.rows.forEach(function(r){
            if(r.password != data.password)
            {
              res.status(400)
              errors.push({ message: "invalide password, please check your password if it is matching to your account!" })
              res.render("pages/login",{ errors})
            }
            else{
              var user = {useraccount: r.useraccount, name: r.uname, password: r.password, role : r.role , id : r.id};
              req.session.loggedin = true;
              req.session.user = user;
              if(r.role == 1)
              {
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
    req.session.loggedin = false;
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
    let errors = []
    if(!data.name)
    {
      res.status(400)
      errors.push({ message: "missing name!" })
    }
    if(!data.Useraccount)
    {
      res.status(400)
      errors.push({ message: "missing useraccount!" })
    }
    if(!data.password)
    {
      res.status(400)
      errors.push({ message: "missing password!" })
    }
    if(!data.Confirmpassword)
    {
      res.status(400)
      errors.push({ message: "missing confirm password!" })
    }
    if(data.password != data.Confirmpassword)
    {
      res.status(400)
      errors.push({ message: "different passwords" })
    }
    if(errors.length >0){
      res.render("pages/register",{ errors})
    }
    else{
      pool.query(`SELECT * FROM userprof where useraccount = $1`, [data.Useraccount],(err,results)=>{
        if(err){
          throw err
        }
        if(results.rows.length)
        {
          res.status(400)
          errors.push({ message: "account already exists" })
          res.render("pages/register",{ errors})
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
    if(req.session.loggedin){
      const bookdata = req.body
      let errors = []
      if(!bookdata.Bookname)
      {
        res.status(400)
        errors.push({ message: "missing book name!" })
      }
      if(!bookdata.Author)
      {
        res.status(400)
        errors.push({ message: "missing author!" })
      }
      if(!bookdata.Pages)
      {
        res.status(400)
        errors.push({ message: "missing pages!" })
      }
      if(!bookdata.date)
      {
        res.status(400)
        errors.push({ message: "missing publish date!" })
      }
      if(!bookdata.Language)
      {
        res.status(400)
        errors.push({ message: "missing language!" })
      }
      if(!bookdata.Course)
      {
        res.status(400)
        errors.push({ message: "missing course!" })
      }
      if(!bookdata.price)
      {
        res.status(400)
        errors.push({ message: "missing price!" })
      }
      if(errors.length >0){
        res.render("pages/addbooks",{ errors})
      }
      else{
        image = req.file.buffer.toString('base64')
        pool.query(`INSERT INTO books (bookname,author,pages,seller,publishdate,language,course,price,description,imghere) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9,$10)`, [bookdata.Bookname,bookdata.Author,bookdata.Pages,req.session.user.name,bookdata.date,
          bookdata.Language,bookdata.Course, bookdata.price, bookdata.description, image],(err,results)=>{
            if(err)
              throw err
            res.status(201)
            res.redirect("/findbook")
          })
      }
    }
    else{
      res.status(401).send(`Please login to view this page! <a href=\'/login'>click to go back to login page</a>`)
    }

  })

  //workflow：每一步用户的行为都会有反馈