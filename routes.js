// app/routes.js
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	service: 'hotmail',
	auth: {
		user: 'jyp0802@hotmail.com',
		pass: 'Jyp3825!hot'
	}
});

var defaultFrom = 'jyp0802@hotmail.com';
var defaultSubject = 'Email verification for Booksellf [Do Not Reply]'
var defaultText = 'Your KAIST email verfication code is [';

module.exports = function(app, passport) {

	app.get('/', isLoggedIn, function(req, res) {
		res.render('index.html');
	});

	app.get('/login', function(req, res) {
		var l_msg;
		var s_msg;
		var loginMessage = req.flash('loginMessage');
		var signupMessage = req.flash('signupMessage');
		if (loginMessage) l_msg = loginMessage;
		if (signupMessage) s_msg = signupMessage;
		res.render('login.ejs', {login_message : l_msg, signup_message : s_msg});
	});

	app.post('/login', passport.authenticate('local-login', { successRedirect : '/', failureRedirect : '/' }));

	app.post('/signup', passport.authenticate('local-signup', { successRedirect : '/', failureRedirect : '/' }));

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/mypage', isLoggedIn, function(req, res) {
		res.render('mypage.ejs', {user : req.user});
	});

	app.get('/reserve', function(req, res) {
		res.render('reserve.html');
	});

	app.get('/upload', function(req, res) {
		res.render('upload.html');
	});

	app.post('/verify_email', function(req, res) {
		var recipient = req.body.email + "@kaist.ac.kr";
		var code = Math.floor((Math.random() * 999999) + 100000);

		console.log("hello " + recipient);
		var mail = {
			from: defaultFrom,
			to: recipient,
			subject: defaultSubject,
			text: defaultText + code + ']'
		}

		transporter.sendMail(mail, function(error, info){
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});

		var responseMsg = {'status' : 'ok', 'email' : recipient};
		res.json(responseMsg);
	});

};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/login');
}
