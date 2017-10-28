var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const user = {
	name: 'user_name',
	email: 'user_email',
	password: 'user_pw',
	id: 1
}

var mysql = require('mysql');
var connection = mysql.createConnection({
	host	: "localhost",
	user	: "root",
	password	: "rootpassword",
	database	: "booksellf_db"
});

connection.connect();



app.use(express.static('static'));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.engine('html', require('ejs').renderFile);

/* http://127.0.0.1:8081/에 대한 요청 처리 */
app.get('/', function (req, res) {
	res.render('login.html');
});
/* http://127.0.0.1:8081/home에 대한 요청 처리 */
app.get('/home', function (req, res) {
	res.render('index.html');
});

/* http://127.0.0.8081/mypage 에 대한 요청 처리 */
app.get('/mypage', function(req, res) {
	res.render('mypage.html');
});

/* http://127.0.0.8081/reserve 에 대한 요청 처리 */
app.get('/reserve', function(req, res) {
	res.render('reserve.html');
});

app.get('/upload', function(req, res) {
	res.render('upload.html');
});

app.get('/login', function(req, res) {
	res.render('login.html');
});

app.post('/register_post', function(req, res) {
	var name = req.body.reg_name;
	var pw = req.body.reg_pw;
	var pwcheck = req.body.reg_pwcheck;
	var email = req.body.reg_email;
	if (pw==pwcheck) {
		connection.query("INSERT into Users (email, name, password) values(?,?,?)", [email,name,pw], function(err, rows, fields) {
		if (err) throw err;
		res.render('index.html');
		})
	}
	else {
		res.send("<h1>Password is not the same</h1>"); 	
	}
})

app.post('/login_post', function(req, res) {
	var email = req.body.email;
	var pw = req.body.pw;
	connection.query("SELECT password from Users where email = ?", [email], function(err, rows, fields) {
		if (err) throw err;
		if (rows.length == 0)
			res.send("<h1>User does not exist!</h1>");
		else if (rows[0].password == pw)
			res.render('index.html');
		else
			res.send("<h1>Wrong password!</h1>");
	})
})

/* 서버를 port 8081로 실행 */
var server = app.listen(8080, function() {
	console.log("Server running at http://127.0.0.1:8080");
});