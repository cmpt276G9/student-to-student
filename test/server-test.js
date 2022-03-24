var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index')

var should = chai.should();

chai.use(chaiHttp);

describe('Users Test', function() {
  
    it('should list ALL users on /users-api GET', function(done){
        chai.request(server).post('/register').send({'name': 'test', 'Useraccount': 'lalala', 'password': 'hahaha', 'Confirmpassword': 'hahaha'}).end(function(err,res){
        res.should.have.status(201);
        //res.should.be.json;
        done();
      });
    });
    // it('should add a SINGLE user on /users-api POST', function(done){
    //   chai.request(server).get('/users-api').end(function(err,res){
    //     var num_users0 = res.body.length;
  
    //     chai.request(server).post('/users-api').send({'fname':'tester','lname':'mctesty','age':'23'})
    //       .end(function(err,res){
    //         var num_users = res.body.length;
  
    //         (num_users-num_users0).should.equal(1);
    //         res.should.have.status(200);
    //         res.should.be.json;
    //         res.body.should.be.a('array');
    //         res.body[0].fname.should.equal('tester');
    //         res.body[0].lname.should.equal('mctesty');
    //         done();
    //       });
  
    //  });
  
    //});
  
  });
  

