var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
require('dotenv').config();
const http = require('http');
const { OAuth2Client } = require('google-auth-library');
const { Console } = require('console');
const { doesNotMatch } = require('assert');
const CLIENT_ID = '63293722215-rpoaqktpbi8j9f2ctoqrkp22q3mqqlko.apps.googleusercontent.com';
//const client = new OAuth2Client(CLIENT_ID);
const myDB = require('./connection');
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const routes = require('./routes');
const auth = require('./auth.js');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });




var app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

app.use(passport.initialize());
app.use(passport.session());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

io.use(
    passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: process.env.SESSION_SECRET,
        store: store,
        success: onAuthorizeSuccess,
        fail: onAuthorizeFail
    })
);

//Connection with database
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });


routes(app);
auth(app);

io.on('connection', (socket) => {
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected');

    io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: true
    });

    socket.on('chat message', (message) => {
        io.emit('chat message', { name: socket.request.user.name, message });
    });
    //disconnect
    socket.on('disconnect', () => {
        /*anything you want to do on disconnect*/
    });
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');

    accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
    if (error) throw new Error(message);
    console.log('failed connection to socket.io:', message);
    accept(null, false);
}


const port = process.env.PORT || 3000;
http.listen(port, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`App listening on port ${port} `);
    }
})