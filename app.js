var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }))
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

const packageSchema = new mongoose.Schema({
    delivery_id: { type: String, required: true },
    description: { type: String, required: true },
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
    from_name: { type: String, required: true },
    from_address: { type: String, required: true },
    from_location: { type: Object, required: true },
    to_name: { type: String, required: true },
    to_address: { type: String, required: true },
    to_location: { type: Object, required: true },
    username: { type: String },
    status: { type: String, required: true, default: 'Open' }
})

const deliverySchema = new mongoose.Schema({
    package_id: { type: String, required: true },
    pick_up: { type: Date, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    location: { type: String, required: true },
    status: { type: String, required: true },
    delivery_code: { type: Number, required: true },
    name: { type: String, required: true },
    userID: { type: String },
    username: { type: String, required: true },
    timeToDeliver: { type: String },
    userCreator: { type: String, required: true }

});

//1= admin, 2=driver, 3=client
const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    account_type: { type: Number, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    address: { type: String, require: true },
    location: { type: String, require: true }
})

const User = mongoose.model('User', userSchema);
const Package = mongoose.model('Package', packageSchema);
const Delivery = mongoose.model('Delivery', deliverySchema);


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

routes(app, User, Package, Delivery, ensureAuthenticated);
auth(app, User, Package, Delivery);
let currentUsers = 0;
io.on('connection', (socket) => {
    /*     ++currentUsers;
        io.emit('user-count', currentUsers);
     */
    console.log('A user has connected');

    /*     io.emit('user', {
            name: socket.request.user.name,
            currentUsers,
            connected: true
        });

        socket.on('chat message', (message) => {
            io.emit('chat message', { name: socket.request.user.name, message });
        });
     */
    socket.on('number', (string) => {
            console.log(string);
            User.find({ username: string },
                (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(result.username)
                        if (result.username == null) {
                            var status = 0;
                        } else {
                            var status = 1;
                        }
                        io.emit('username-response', { status: status, username: string });
                    }
                })

        })
        /*     socket.on('number', (number) => {
                console.log(number);
            })
         */
    socket.emit('number', { number: 1 })
        //disconnect
    socket.on('disconnect', () => {
        /*anything you want to do on disconnect*/
    });
});



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