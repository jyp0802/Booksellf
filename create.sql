SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS TempUsers;
DROP TABLE IF EXISTS RegisteredBooks;
DROP TABLE IF EXISTS BookInformation;
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
  uid int not null,
  uname varchar(255) not null, 
  title varchar(255) not null,
  isbn varchar(255) not null,
  price int not null,
  department varchar(255),
  subject varchar(255),
  book_photo LONGBLOB,
  book_state smallint not null,
  book_written boolean not null,
  book_ripped boolean not null,
  book_special varchar(3000),
  contact varchar(25),
  memo  varchar(3000),
  thumbnail varchar(3000),
  FOREIGN KEY (uid) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE BookInformation (
  isbn varchar(255) not null,
  title varchar(255) not null,
  subtitle varchar(255),
  author varchar(255) not null,
  publisher varchar(255),
  publishedDate date,
  description varchar(3000),
  pageCount int,
  image varchar(3000),
  rating smallint,
  language varchar(255),
  PRIMARY KEY (isbn)
);
