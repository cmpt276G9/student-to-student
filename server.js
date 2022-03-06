const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const app = express()
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render('pages/index'))
  app.get('/login', (req, res) => res.render('pages/login'))
  app.get('/register', (req, res) => res.render('pages/register'))
  app.post('/login' , (req, res) => {

  })
  app.post('/register' , (req, res) => {
    
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
