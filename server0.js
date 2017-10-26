var express = require('express');
var app = express();

app.use(express.static('static'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

/* http://127.0.0.1:8081/에 대한 요청 처리 */
app.get('/', function (req, res) {
	res.render('index.html')
});

/* http://127.0.0.8081/up 에 대한 요청 처리 */
app.get('/up', function(req, res) {
	res.render('up.html');
});

/* http://127.0.0.8081/wall 에 대한 요청 처리 */
app.get('/wall', function(req, res) {
	res.render('wall_e.html');
});

app.get('/login', function(req, res) {
	res.render('login.html');
})

/* 서버를 port 8081로 실행 */
var server = app.listen(8080, function() {
	console.log("Server running at http://127.0.0.1:8080");
});