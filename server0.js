//server0.js
var express = require('express');
var session  = require('express-session');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
//var morgan = require('morgan');
var passport = require('passport');


require('./config/passport')(passport);


//app.use(morgan('dev'));
app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

// required for passport
app.use(session({
	secret: 'secretmessage',
	resave: true,
	saveUninitialized: true
 } ));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//
app.use(express.static('static'));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


require('./routes.js')(app, passport);

/* 서버를 port 8080로 실행 */
var server = app.listen(8080, function() {
	console.log("Server running at http://127.0.0.1:8080");
});