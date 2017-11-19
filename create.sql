DROP DATABASE IF EXISTS booksellf_db;
CREATE DATABASE booksellf_db;
USE booksellf_db;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS TempUsers;
DROP TABLE IF EXISTS RegisteredBooks;
DROP TABLE IF EXISTS BookInformation;
DROP TABLE IF EXISTS BookReservation;
DROP TABLE IF EXISTS Notification;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE Users (
  id int not null auto_increment, 
  name varchar(255) not null, 
  email varchar(255) not null, 
  password varchar(255) not null,
  PRIMARY KEY (id)
);

CREATE TABLE TempUsers (
  email varchar(255) not null, 
  code int not null,
  PRIMARY KEY (email)
);

CREATE TABLE RegisteredBooks (
  bookid int not null auto_increment,
  uid int not null,
  uname varchar(255) not null, 
  title varchar(255) not null,
  authors varchar(255) not null,
  isbn varchar(255) not null,
  price int not null,
  department varchar(255),
  subject varchar(255),
  book_photo LONGBLOB,
  book_status smallint not null,
  book_written boolean not null,
  book_ripped boolean not null,
  book_special varchar(3000),
  contact varchar(25),
  memo  varchar(3000),
  thumbnail varchar(3000),
  PRIMARY KEY (bookid),
  FOREIGN KEY (uid) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE BookInformation (
  isbn varchar(255) not null,
  title varchar(255) not null,
  subtitle varchar(255),
  authors varchar(255) not null,
  publisher varchar(255),
  publishedDate varchar(25),
  description varchar(3000),
  pageCount int,
  thumbnail varchar(3000),
  averageRating smallint,
  language varchar(255),
  PRIMARY KEY (isbn)
);

CREATE TABLE BookReservation (
	isbn varchar(255) not null,
	uid int not null,
	email varchar(255) not null,
  PRIMARY KEY (isbn, uid),
	FOREIGN KEY (uid) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Notification (
	uid int not null,
	bid int not null,
	FOREIGN KEY (uid) REFERENCES Users(id) ON DELETE CASCADE,
	FOREIGN KEY (bid) REFERENCES RegisteredBooks(bookid) ON DELETE CASCADE
);
