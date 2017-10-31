// app/routes.js
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jyp0802@gmail.com',
    pass: 'Jyp3825!goo'
  }
});

var mailOptions = {
  from: 'jyp0802@gmail.com',
  to: '',
  subject: 'Email verification for Booksellf [Do Not Reply]',
  text: 'Your KAIST email verfication code is '
};



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

	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/', // redirect to the secure profile section
            failureRedirect : '/', // redirect back to the signup page if there is an error
		})
	);


	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/', // redirect back to the signup page if there is an error
		})
	);

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

	app.get('/verify_email', function(req, res) {
		console.log("hello");
		res.redirect('/');
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
