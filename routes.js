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

var mysql = require('mysql');
var dbconfig = require('./config/database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);

var books = require('google-books-search');
var book_options = {
		field: 'isbn',
		offset: 0,
		limit: 1
};

module.exports = function(app, passport) {

	app.get('/', /*isLoggedIn,*/ function(req, res) {
		connection.query("SELECT * FROM RegisteredBooks", function(err, rows) {
			res.render('index.ejs', {booklist : rows});
		})
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
		connection.query("SELECT * FROM RegisteredBooks WHERE uid = ?", [req.user.id], function(err, rows) {
			res.render('mypage.ejs', {user : req.user, booklist : rows});
		})
	});

	app.get('/reserve', function(req, res) {
		res.render('reserve.html');
	});

	app.get('/upload', /*isLoggedIn,*/ function(req, res) {
		res.render('upload.ejs');
	});

	app.post('/search', function(req, res){
		var word = req.body.search_word;
		var type = req.body.search_type;
		connection.query("SELECT * FROM RegisteredBooks WHERE " + type +" LIKE '%" + word +"%'", function(err, rows) {
			res.render('index.ejs', {booklist : rows});
		})
	});

	app.get('/details', function(req, res) {
		connection.query("SELECT * FROM RegisteredBooks where bookid = ?", [req.query.bookid], function(err1, rows1) {
			if (rows1.length == 0)
				res.send("<h2>Book not found</h2>");
			connection.query("SELECT * FROM BookInformation where isbn = ?", [rows1[0].isbn], function(err2, rows2) {
				res.render('detail.ejs', {book_r : rows1[0], book_i : rows2[0]});
			})
		})
	});

	app.post('/register_book', /*isLoggedIn,*/ function(req, res) {
		books.search(req.body.isbn, book_options, function(error, results, apiResponse) {
			if (!error) {
				var status, written, ripped;
				written = req.body.written == "있음" ? true : false;
				ripped = req.body.ripped == "있음" ? true : false;
				if (req.body.status == "최상") status = 5;
				if (req.body.status == "상") status = 4;
				if (req.body.status == "중") status = 3;
				if (req.body.status == "하") status = 2;
				if (req.body.status == "최하") status = 1;

				var insert_field_string = "uid, uname, title, author, isbn, price, book_state, book_written, book_ripped, thumbnail";
				//var insert_field_items = [req.user.id, req.user.name, results[0].title, req.body.isbn, req.body.price, status, written, ripped, results[0].thumbnail];
				var author = "";
				if (results[0].authors.length>1){
					for (var i=0; i<results[0].authors.length; i++){
						if (i==results[0].authors.length-1) {
							author += results[0].authors[i];
							break;
						}
						author += results[0].authors[i]+", ";
					}
				}
				else{
					author = results[0].authors;
				}
				var insert_field_items = [1, "David", results[0].title, author, req.body.isbn, req.body.price, status, written, ripped, results[0].thumbnail];
				var insert_variable = "?,?,?,?,?,?,?,?,?,?";

				var department = req.body.department;
				var subject = req.body.subject;
				var book_photo = req.body.book_photo;
				var book_special = req.body.book_special;
				var contact = req.body.contact;
				var memo = req.body.memo;
				var extra_field_string = ["department", "subject", "book_photo", "book_special", "contact", "memo"];
				var extra_field_items = [department, subject, book_photo, book_special, contact, memo];
				for (var i=0; i<extra_field_items.length; i++) {
					if (extra_field_items[i] != "") {
						insert_field_items.push(extra_field_items[i]);
						insert_field_string += (", " + extra_field_string[i]);
						insert_variable += ",?"
					}
				}
				connection.query("INSERT into RegisteredBooks (" + insert_field_string + ") values (" + insert_variable + ")", insert_field_items, function(err, rows) {
					if (err)
						console.log(err);
					res.redirect('/');
				});

				var bookinfo_field_string = "isbn, title, subtitle, author, publisher, publishedDate, description, pageCount, image, rating, language";
				var bookinfo_field_items = [req.body.isbn, results[0].title, results[0].subtitle, author, results[0].publisher, results[0].publishedDate, results[0].description, results[0].pageCount, results[0].thumbnail, results[0].averageRating, results[0].language];
				var bookinfo_variable = "?,?,?,?,?,?,?,?,?,?,?";
				connection.query("INSERT into BookInformation (" + bookinfo_field_string + ") values (" + bookinfo_variable + ")", bookinfo_field_items, function(err, rows) {
				});


			} else {
				console.log(error);
				res.redirect('/');
			}
		});
	});

	app.post('/check_isbn', function(req, res) {
		books.search(req.body.isbn, book_options, function(error, results, apiResponse) {
			if (!error) {
				if (results.length == 0)
					res.json({'status' : 'bad', 'message' : "No books found with ISBN: " + req.body.isbn });
				else
					res.json({'status' : 'ok', 'title' : results[0].title});
			}
			else
				res.json({'status' : 'bad', 'message' : 'error'});
		});
	});

	app.post('/verify_email', function(req, res) {

		var recipient = req.body.email;

		connection.query("SELECT * FROM users WHERE email = ?", [recipient], function(err, rows) {
			if (err)
				res.json({'status' : 'bad', 'message' : 'error'});
			else if (rows.length)
				res.json({'status' : 'bad', 'message' : 'An account already exists for that email.'});
			else {
				connection.query("SELECT * FROM tempusers WHERE email = ?", [recipient], function(err, rows) {
					if (err) {
						res.json({'status' : 'bad', 'message' : 'error'});
						return;
					}
					var code = Math.floor((Math.random() * 999999) + 100000);
					var querytext;
					if (rows.length)
						querytext = "UPDATE tempusers SET code = ? WHERE email = ?";
					else
						querytext = "INSERT into tempusers (code, email) values (?,?)";

					connection.query(querytext, [code, recipient], function(err, rows) {
						if (err) {
							res.json({'status' : 'bad', 'message' : 'error'});
							return;
						}
						recipient += "@kaist.ac.kr";

						var mail = {
							from: defaultFrom,
							to: recipient,
							subject: defaultSubject,
							text: defaultText + code + ']'
						}

						transporter.sendMail(mail, function(error, info){
							if (error)
								console.log(error);
							else
								console.log('Email sent: ' + info.response);
						});

						var responseMsg = {'status' : 'ok', 'email' : recipient};
						res.json(responseMsg);
					})
				})
			}
		})
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
