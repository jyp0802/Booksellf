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
var book_options = {field: 'isbn', limit: 1};

function isReserved(isbn13, rows) {
	for (y in rows) {
		if (rows[y].isbn == isbn13)
			return true;
	}
	return false;
}

function authorString(authors) {
	var author = "";
	if (authors.length>1){
		for (var i=0; i<authors.length; i++){
			if (i==authors.length-1) {
				author += authors[i];
				break;
			}
			author += authors[i]+", ";
		}
	}
	else
		author = authors;
	return author;
}

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
		connection.query("SELECT * FROM RegisteredBooks WHERE uid = ?", [req.user.id], function(err1, rows1) {
			if (err1) console.log(err1);
			connection.query("SELECT * FROM (SELECT isbn from BookReservation where uid = ?) as I, BookInformation where BookInformation.isbn = I.isbn", [req.user.id], function(err2, rows2){
				if (err2) console.log(err2);
				res.render('mypage.ejs', {user : req.user, booklist : rows1, reserved_bookinfo : rows2});
			})
		})
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

	app.get('/reservebook', isLoggedIn, function(req, res){
		res.render('reservebook.ejs', {status : "none", booklist : {}});
	})

	app.get('/reserveDo', isLoggedIn, function(req, res){
		connection.query("INSERT into BookReservation values (?,?,?)", [req.query.isbn, req.user.id, req.user.email], function(err, rows) {
			res.redirect('/confirm?t=rsd');
			connection.query("SELECT * from BookInformation where isbn = ?", [req.query.isbn], function(err, rows) {
				if (err)
					console.log(err);
				else if (rows.length == 0) {
					books.search(req.query.isbn, book_options, function(error, results, apiResponse) {
						var author = authorString(results[0].authors);
						var bookinfo_field_string = "isbn, title, subtitle, authors, publisher, publishedDate, description, pageCount, thumbnail, averageRating, language";
						var bookinfo_field_items = [req.query.isbn, results[0].title, results[0].subtitle, author, results[0].publisher, results[0].publishedDate, results[0].description, results[0].pageCount, results[0].thumbnail, results[0].averageRating, results[0].language];
						var bookinfo_variable = "?,?,?,?,?,?,?,?,?,?,?";
						connection.query("INSERT into BookInformation (" + bookinfo_field_string + ") values (" + bookinfo_variable + ")", bookinfo_field_items, function(err, rows) {
							if (err)
								console.log(err);
						});
					});
				}
			});
		})
	})

	app.get('/reserveCancel', isLoggedIn, function(req, res){
		connection.query("DELETE FROM BookReservation where isbn = ? and uid = ?", [req.query.isbn, req.user.id], function(err, rows) {
			if (rows['affectedRows'] == 0)
				res.redirect('/confirm?t=rscf');
			else
				res.redirect('/confirm?t=rsc');
		})
	})

	app.post('/reserve_search', isLoggedIn, function(req, res){
		var word = req.body.search_word;
		var type = req.body.search_type;
		var search_options = {field: type, types: "books", limit: 12}
		books.search(word, search_options, function(error, results, apiResponse) {
			if (!error && results.length > 0) {
				connection.query("SELECT * FROM BookReservation where uid = ?", [req.user.id], function(err, rows) {
					var booklist = [];
					for (x in results) {
						if (results[x].industryIdentifiers != undefined && results[x].industryIdentifiers.length == 2) {
							var isbn13 = results[x].industryIdentifiers[0].type == "ISBN_13" ? results[x].industryIdentifiers[0].identifier : results[x].industryIdentifiers[1].identifier;
							if (isReserved(isbn13, rows))
								booklist.push([results[x], isbn13, true]); //already reserved
							else
								booklist.push([results[x], isbn13, false]); //not reserved yet
						}
					}
					res.render('reservebook.ejs', {status : "good", booklist : booklist, type : type, word : word});
				});
			}
			else
				res.render('reservebook.ejs', {status : "error", booklist : {}});
		});
	});

	app.get('/reserve_details', isLoggedIn, function(req, res) {
		if (req.query.saved == "false") {
			console.log("Google");
			books.search(req.query.isbn, book_options, function(error, results, apiResponse) {
				res.render('reservedetail.ejs', {book : results[0], isbn : req.query.isbn});
			})
		}
		else {
			console.log("MySQL");
			connection.query("SELECT * FROM BookInformation where isbn = ?", [req.query.isbn], function(err, rows) {
				res.render('reservedetail.ejs', {book : rows[0], isbn : req.query.isbn});
			})
		}
		
	});

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

				var insert_field_string = "uid, uname, title, authors, isbn, price, book_status, book_written, book_ripped, thumbnail";
				var author = authorString(results[0].authors);
				//use ISBN13 for all -> results[0].industryIdentifiers[0].identifier
				var isbn13 = results[0].industryIdentifiers[0].type == "ISBN_13" ? results[0].industryIdentifiers[0].identifier : results[0].industryIdentifiers[1].identifier;
				var insert_field_items = [req.user.id, req.user.name, results[0].title, author, isbn13, req.body.price, status, written, ripped, results[0].thumbnail];
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

				connection.query("SELECT uid, email from BookReservation where isbn = ?", [req.body.isbn], function(err, rows) {
					if (err) {
						console.log(err);
						res.redirect('/confirm?t=rf');
					}
					else{
						var notify_field_string = "uid, bid, isbn"
						var notify_variable = "?,?,?"
						for (var i=0;i<rows.length;i++){
							var notify_field_items = [rows[i][0], req.body.bookid, req.body.isbn]
							connection.query("INSERT into Notification  (" + notify_field_string + ") values (" + notify_variable + ")", notify_field_items, function(err, rows) {
								if (err)
									console.log(err);
							});
						}
						//email 보내기

					}
				});

				connection.query("SELECT * from BookInformation where isbn = ?", [req.body.isbn], function(err, rows) {
					if (err)
						console.log(err);
					else if (rows.length == 0) {
						var bookinfo_field_string = "isbn, title, subtitle, authors, publisher, publishedDate, description, pageCount, thumbnail, averageRating, language";
						var bookinfo_field_items = [isbn13, results[0].title, results[0].subtitle, author, results[0].publisher, results[0].publishedDate, results[0].description, results[0].pageCount, results[0].thumbnail, results[0].averageRating, results[0].language];
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
