
var chai = require('chai')
var chaihttp = require('chai-http')
var server = require('../index.js')
var should = chai.should();

chai.use(chaihttp)
describe('Users',function(){
    //all the test relate to the user
    it('should add a single user on post successful request for /register', function(done){
        chai.request(server).post('/register').send({'name':'test', 'Useraccount':'test', 'password':'123', 'Confirmpassword':'123'})
            .end(function(error,res){
                res.should.have.status(200)
                //  res.body.name.should.equal('test')
                //  res.body.Useraccount.should.equal('test')
                //  res.body.password.should.equal('123')
                //  res.body.Confirmpassword.should.equal('123')
                done()
            })
    })
    it('should add a single user on post failure request for /register', function(done){
        chai.request(server).post('/register').send({'name':'test', 'Useraccount':'test', 'password':'123', 'Confirmpassword':'321'})
            .end(function(error,res){
                res.should.have.status(400)
        done()
         })
    })
    it('should add a single user on post failure request for /addbook', function(done){
        chai.request(server).post('/addbook').send({'Bookname':'test', 'Author':'test', 'Pages':'123', 'date':'03/24/2022','Language':'eng','Course':'test','Price':'10'})
            .end(function(error,res){
                res.should.have.status(400)
        done()
         })
    })
    it('should add a single user on post successful request for /login', function(done){
        chai.request(server).post('/logindata').send({'Useraccount':'test', 'password':'123'})
            .end(function(error,res){
                res.should.have.status(200)
        done()
         })
    })
    it('should add a single user on post failure request for /login', function(done){
        chai.request(server).post('/logindata').send({'Useraccount':'test', 'password':'12345'})
            .end(function(error,res){
                res.should.have.status(400)
            done()
         })
    })
    it('should add a single user on post failure request for /login', function(done){
        chai.request(server).post('/logindata').send({'Useraccount':'test123', 'password':'12345'})
            .end(function(error,res){
                res.should.have.status(404)
            done()
         })
    })
})
