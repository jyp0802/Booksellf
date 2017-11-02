// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            usernameField : 'reg_email',
            passwordField : 'reg_pw',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            connection.query("SELECT * FROM users WHERE email = ?",[username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length)
                    return done(null, false, req.flash('signupMessage', 'An account already exists for that email.'));
                else {
                    connection.query("SELECT * FROM tempusers WHERE email = ?",[username], function(err, rows) {
                        if (err)
                            return done(err);
                        if (!rows.length)
                            return done(null, false, req.flash('signupMessage', 'You have not sent the verification code yet!'));
                        else {
                            if (rows[0].code != req.body.reg_check)
                                return done(null, false, req.flash('signupMessage', 'Wrong verification code!'));
                            else {
                                var name = req.body.reg_name;
                                var newUserMysql = {
                                    username: username,
                                    password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                                };
                                var deleteQuery = "DELETE FROM tempusers WHERE email = ?";
                                var insertQuery = "INSERT INTO users (email, name, password) values (?,?,?)";
                                connection.query(deleteQuery, [username], function(err1, rows1) {
                                    connection.query(insertQuery, [newUserMysql.username, name, newUserMysql.password], function(err, rows) {
                                        newUserMysql.id = rows.insertId;
                                        newUserMysql.name = name;
                                        return done(null, newUserMysql);
                                    });
                                });
                            }
                        }
                    });                    
                }
            });
        })
    );


    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            usernameField : 'email',
            passwordField : 'pw',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form
            connection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );
};