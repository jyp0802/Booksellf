// app/routes.js
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	service: 'Yandex',
	auth: {
		user: 'booksellf@yandex.com',
		pass: 'booksellfpassword'
	}
});

var defaultFrom = 'booksellf@yandex.com';
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

	app.get('/', isLoggedIn, function(req, res) {
		connection.query("SELECT * FROM RegisteredBooks", function(err, rows) {
			res.render('index.ejs', {booklist : rows, search : false});
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

	app.get('/logout', isLoggedIn, function(req, res) {
		req.logOut();
		res.redirect('/');
	});

	app.get('/mypage', isLoggedIn, function(req, res) {
		connection.query("SELECT * FROM RegisteredBooks WHERE uid = ?", [req.user.id], function(err, rows) {
			res.render('mypage.ejs', {user : req.user, booklist : rows});
		})
	});

	app.get('/reserve', isLoggedIn, function(req, res) {
		res.render('reserve.html');
	});

	app.get('/registerbook', isLoggedIn, function(req, res) {
		res.render('registerbook.ejs');
	});

	app.post('/search', isLoggedIn, function(req, res){
		var word = req.body.search_word;
		var type = req.body.search_type;
		connection.query("SELECT * FROM RegisteredBooks WHERE " + type +" LIKE '%" + word +"%'", function(err, rows) {
			res.render('index.ejs', {booklist : rows, search : true, word : word, type : type});
		})
	});

	app.get('/department', isLoggedIn, function(req,res){
		var dep = req.query.d;
		connection.query("SELECT * FROM RegisteredBooks WHERE department = '"+dep+"'", function(err, rows) {
			res.render('index.ejs', {booklist : rows, search : false});
		})
	});

	app.get('/details', isLoggedIn, function(req, res) {
		connection.query("SELECT * FROM RegisteredBooks where bookid = ?", [req.query.bookid], function(err1, rows1) {
			if (rows1.length == 0)
				res.redirect('/confirm?t=f');
			else {
				connection.query("SELECT * FROM BookInformation where isbn = ?", [rows1[0].isbn], function(err2, rows2) {
					res.render('detail.ejs', {book_r : rows1[0], book_i : rows2[0]});
				})
			}
		})
	});

	app.get('/editbook', isLoggedIn, function(req, res) {
		var bid = req.query.bookid
		connection.query("SELECT * FROM RegisteredBooks WHERE bookid = ? and uid = ?", [bid, req.user.id], function(err, rows) {
			if (rows.length == 0)
				res.redirect('/confirm?t=ef');
			else
				res.render('edit.ejs', {book_r : rows[0]});
		})
	});

	app.get('/delete', isLoggedIn, function(req, res) {
		connection.query("DELETE FROM RegisteredBooks where bookid = ? and uid = ?", [req.query.bookid, req.user.id], function(err, rows) {
			if (rows['affectedRows'] == 0)
				res.redirect('/confirm?t=df');
			else
				res.redirect('/confirm?t=d');
		})
	});

	app.get('/confirm', isLoggedIn, function(req, res){
		res.render('confirm.ejs', { t : req.query.t, bookid : req.query.bid });
	})

	app.post('/edit', isLoggedIn, function(req, res) {
		var bookid = req.body.bookid;
		var status, written, ripped;
		written = req.body.written == "있음" ? true : false;
		ripped = req.body.ripped == "있음" ? true : false;
		if (req.body.status == "최상") status = 5;
		if (req.body.status == "상") status = 4;
		if (req.body.status == "중") status = 3;
		if (req.body.status == "하") status = 2;
		if (req.body.status == "최하") status = 1;
		var update_query = "UPDATE RegisteredBooks SET department=?, subject=?, book_photo=?, book_status=?, book_written=?, book_ripped=?, book_special=?, contact=?, price=?, memo=? where bookid = ?";
		var update_input = [req.body.department, req.body.subject, req.body.book_photo, status, written, ripped, req.body.book_special, req.body.contact, req.body.price, req.body.memo, bookid];
		connection.query(update_query, update_input, function(err, rows) {
			if (err) {
				console.log(err);
				res.redirect('/confirm?t=ef');
			}
			else
				res.redirect('/confirm?t=e&bid=' + bookid);
		})
	})

	app.post('/register_book', isLoggedIn, function(req, res) {
		books.search(req.body.isbn, book_options, function(error, results, apiResponse) {
			if (!error && results.length > 0) {
				var status, written, ripped;
				written = req.body.written == "있음" ? true : false;
				ripped = req.body.ripped == "있음" ? true : false;
				if (req.body.status == "최상") status = 5;
				if (req.body.status == "상") status = 4;
				if (req.body.status == "중") status = 3;
				if (req.body.status == "하") status = 2;
				if (req.body.status == "최하") status = 1;

				var insert_field_string = "uid, uname, title, author, isbn, price, book_status, book_written, book_ripped, thumbnail";
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
				var insert_field_items = [req.user.id, req.user.name, results[0].title, author, req.body.isbn, req.body.price, status, written, ripped, results[0].thumbnail];
				//var insert_field_items = [1, "David", results[0].title, author, req.body.isbn, req.body.price, status, written, ripped, results[0].thumbnail];
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
					if (err) {
						console.log(err);
						res.redirect('/confirm?t=rf');
					}
					else
						res.redirect('/confirm?t=r&bid=' + rows.insertId);
				});

				connection.query("SELECT * from BookInformation where isbn = ?", [req.body.isbn], function(err, rows) {
					if (err)
						console.log(err);
					else if (rows.length == 0) {
						var bookinfo_field_string = "isbn, title, subtitle, author, publisher, publishedDate, description, pageCount, image, rating, language";
						var bookinfo_field_items = [req.body.isbn, results[0].title, results[0].subtitle, author, results[0].publisher, results[0].publishedDate, results[0].description, results[0].pageCount, results[0].thumbnail, results[0].averageRating, results[0].language];
						var bookinfo_variable = "?,?,?,?,?,?,?,?,?,?,?";
						connection.query("INSERT into BookInformation (" + bookinfo_field_string + ") values (" + bookinfo_variable + ")", bookinfo_field_items, function(err, rows) {
							if (err)
								console.log(err);
						});
					}
				});

			} else {
				console.log(error);
				res.redirect('/confirm?t=rf');
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
					var code = Math.floor((Math.random() * 899999) + 100000);
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
