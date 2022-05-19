'use strict';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const logger = require('morgan');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn
const ejsLint = require('ejs-lint');
const app = express();
var GoogleStrategy = require('passport-google-oidc');

const http = require('http').createServer(app);
const io = require('socket.io')(http);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    maxAge: 360 * 5,
    store: store,
    name: 'express.sid'
}));
app.use(passport.initialize());
app.use(passport.session());
/* io.use(
    passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: process.env.SESSION_SECRET,
        store: store,
        success: onAuthorizeSuccess,
        fail: onAuthorizeFail
    })
); */


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));






//Connection with database
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });


const packageSchema = new mongoose.Schema({
    delivery_id: { type: String },
    description: { type: String, required: true },
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
    from_name: { type: String, required: true },
    from_address: { type: String, required: true },
    from_location: { type: Object },
    to_name: { type: String, required: true },
    toUsername: { type: String, required: true },
    fromUsername: { type: String, required: true },
    to_address: { type: String, required: true },
    to_location: { type: Object },
    username: { type: String },
    status: { type: String, required: true, default: 'Free' }
})

const deliverySchema = new mongoose.Schema({
    package_id: { type: String, required: true },
    pick_up: { type: Date },
    start_time: { type: Date, required: true },
    end_time: { type: Date },
    latitude: { type: String },
    longitude: { type: String },
    address: { type: String, required: true },
    to_address: { type: String, required: true },
    status: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    timeToDeliver: { type: String },
    fromUsername: { type: String, required: true },
    toUsername: { type: String, required: true }
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

//Routes
//1: delivery 
//2: delivery, 
//3: package with name
//4: delivery with name
//5:Users
//6: Users with name
//7: Reports
app.get('/index', ensureLoggedIn('/'), (req, res) => {
    Package.find({}, (err, result1) => {
        if (err) {
            console.log(err);
        } else {
            Delivery.find({}, (err, result2) => {
                if (err) {
                    console.log(err)
                } else {
                    User.find({ account_type: 2 }, (err, result3) => {
                        if (err) {
                            console.log(err);
                        } else {
                            User.find({ account_type: 3 }, (err, result4) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    res.render('index', {
                                        'result1': result1,
                                        'result2': result2,
                                        'result3': result3,
                                        'result4': result4,
                                    })
                                }
                            })
                        }
                    })
                }
            });
        }
    });
})

app.get('/search', ensureLoggedIn('/'), (req, res) => {
    item = req.query.item;
    if (item == 1) {
        Package.find({ name: item }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'item': 'Packages',
                    'result1': result
                })
            }
        })
    }
    if (item == 2) {
        Delivery.find({}, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'item': item,
                    'result1': result
                })
            }
        })
    }
    if (item == 3) {
        User.find({ account_type: 2 }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'result1': result,
                    'item': item,
                })
            }
        })
    }
    if (item == 4) {
        User.find({ account_type: 3 }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'result1': result,
                    'item': item,
                })
            }
        })
    }
})

app.get('/')

app.get('/', (req, res) => {
    res.render('login');
})

//login
app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/dashboard');
});

//Register
app.post('/register', (req, res, next) => {
        const password = req.body.password;
        console.log(password);
        const hash = bcrypt.hashSync(password, 12);
        User.findOne({ email: req.body.username }, function(err, user) {
            if (err) {
                next(err);
            } else if (user) {
                res.redirect('/');
            } else {
                const user = new User({
                    name: req.body.name,
                    surname: req.body.surname,
                    email: req.body.username,
                    account_type: req.body.account_type,
                    username: req.body.email,
                    password: hash,
                    address: req.body.address
                });
                user.save((err, doc) => {
                    if (err) {
                        res.render('login', { error: 1 })
                    } else {
                        // The inserted document is held within
                        // the ops property of the doc
                        next(null, doc);
                    }
                })
            }
        })
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
        if (req.user.account_type == 1) {
            res.redirect('/index');
        }
        if (req.user.account_type == 2) {
            res.redirect('/web_driver');
        }
        if (req.user.account_type == 3) {
            res.redirect('/web_tracker');
        }

    }
);

//Unauthenticate
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/dashboard', ensureLoggedIn('/'), (req, res) => {
    if (req.user.account_type == 1) {
        res.redirect('/index');
    }
    if (req.user.account_type == 2) {
        res.redirect('/web_driver');
    }
    if (req.user.account_type == 3) {
        res.redirect('/web_tracker');
    }

});
app.get('/add', ensureLoggedIn('/'), (req, res) => {
    Package.find({}, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render("pack_delivery", {
                pack: pack,
                delivery: delivery
            });
        }
    })
})

app.get('/api/package/:id', ensureLoggedIn('/'), (req, res) => {
    if (req.query.delete = 1) {
        let id = req.query.id;
        Package.deleteOne({ _id: id }, (err, result) => {
            if (err) {
                console.log(err);
            }
        })
    }
});

app.post('/api/package/', ensureLoggedIn('/'), (req, res) => {
    var packreq = req.body;
    console.log(packreq)
    Package.find({ name: packreq.name }, (err, result) => {
        if (result.length > 0) {
            res.redirect('/dashboard')
        } else {
            User.findOne({ 'username': packreq.from_name }, (err, result1) => {
                if (err) {
                    console.log(err);
                } else {
                    User.findOne({ 'username': packreq.to_name }, (err, result2) => {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log(result1.username);
                            var pack = new Package({
                                description: packreq.description,
                                fromUsername: packreq.from_name,
                                from_name: `${result1.name} ${result1.surname}`,
                                from_address: result1.address,
                                toUsername: packreq.to_name,
                                to_address: result2.address,
                                to_name: `${result2.name} ${result2.surname}`,
                                depth: packreq.depth,
                                weight: packreq.weight,
                                width: packreq.width,
                                height: packreq.height,
                                name: packreq.name,
                                username: req.user.username
                            });
                            pack.save((err, result) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    res.redirect('/dashboard');
                                }
                            })
                        }
                    })
                }
            })

        }
    })

});

app.get('/package/update', ensureLoggedIn('/'), (req, res) => {
    let packUpdate = 1;
    console.log(req.query.id);
    Package.findOne({id: req.params.id}, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            res.render('update', {
                result: result,
                pack: packUpdate
            })
        }
    })
})

app.get('/api/put', ensureLoggedIn('/'), (req, res) => {
    var putParams = req.query;
    console.log(req.query);
    Package.findOne({id: req.query.id}, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.description !== "") {
                result.description = putParams.description;
            }
            if (result.from_name !== "") {
                result.from_name = putParams.from_name;
            }
            if (result.from_address !== "") {
                result.from_address = putParams.from_address
            }
            if (result.from_location !== "") {
                result.from_location = putParams.from_location;
            }
            if (result.to_name !== "") {
                result.to_name = putParams.to_name
            }
            if (result.to_address !== "") {
                result.to_address = putParams.to_address
            }
            if (result.to_location !== "") {
                result.to_location = putParams.to_location;
            }
            if (result.depth !== "") {
                result.depth = putParams.depth
            }
            if (result.width !== "") {
                result.width = putParams.width
            }
            if (result.height !== "") {
                result.height = putParams.height
            }
            if (result.weight !== "") {
                result.weight = putParams.weight
            }
            result.save((err, resultSaved) => {
                res.redirect('/dashboard')
            });
        }
    })
});

app.get('/api/delete', ensureLoggedIn('/'), (req, res) => {
    console.log(req.query.id);
    Package.deleteOne({ id: req.query.id }, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/dashboard');
        }
    })
});

//1: package 
//2: delivery, 
//3: package with name
//4: delivery with name
//5:Users
//6: Users with name
//7: Reports
//8: Incomming Deliveries

app.get('/web_driver', ensureLoggedIn('/'), (req, res) => {
    Package.find({ status: 'Free' }, (err, result1) => {
        if (err) {
            console.log(err);
        } else {
            Delivery.find({ username: req.user.username }, (err, result2) => {
                if (err) {
                    console.log(err)
                } else {
                    res.render('web_driver', {
                        'result1': result1,
                        'result2': result2,
                    })
                }
            })
        }
    })
})

app.get('/web_tracker', ensureLoggedIn('/'), (req, res) => {
    var item = req.query.item;
    Package.find({
        $or: [
            { username: req.user.username },
            { from_name: req.user.username },
            { to_name: req.user.username }
        ]
    }, (err, result1) => {
        if (err) {
            console.log(err);
        } else {
            Delivery.find({
                $or: [
                    { from_name: req.user.username },
                    { to_name: req.user.username }
                ]
            }, (err, result2) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('web_tracker', {
                        'result1': result1,
                        'result2': result2
                    });
                }
            })
        }
    });
})
app.get('/map', ensureLoggedIn('/'), (req, res) => {
    if (req.user.account_type == 2) {
        if (req.query.package) {
            Package.find({ name: req.query.package }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('map', {
                        account_type: req.user.account_type,
                        'result1': result
                    });
                }
            })
        }
        if (req.query.delivery) {
            Delivery.find({ name: req.query.delivery }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('map', {
                        account_type: req.user.account_type,
                        'result1': result
                    });
                }
            })
        }
    } else {
        if (req.query.package) {
            Package.find({ name: req.query.package }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('map', {
                        account_type: req.user.account_type,
                        'result1': result
                    });
                }
            })
        }
        if (req.query.delivery) {
            Delivery.find({ name: req.query.delivery }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('map', {
                        account_type: req.user.account_type,
                        'result1': result
                    });
                }
            })
        }
    }
})





//404
app.use((req, res, next) => {
    res.status(404)
        .type('text')
        .send('Not Found');
});


//AUTHENTICATION

// Serialization and deserialization here...
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser((id, done) => {
    User.findOne({ _id: new ObjectID(id) }, (err, user) => {
        if (err) {
            console.log(err);
            done(err, null);
        } else {
            done(null, user)
        }
    });
});
passport.use(new LocalStrategy(function verify(username, password, done) {
    User.findOne({ 'email': username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false);
        }
        return done(null, user);
    });
}));







let currentUsers = 0;
io.on('connection', (socket) => {
    console.log('A user has connected');
    socket.on('number', (string) => {
        console.log(string);
        User.findOne({ username: string },
            (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    if (!result) {
                        var status = 0;
                    } else {
                        var status = 1;
                    }
                    io.emit('username-response', { status: status, username: string });
                }
            })

    })
    socket.on('webTracker', (name) => {
        Delivery.find({ name: name }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                io.emit('webTrackerResponse', {
                    status: result.status,
                    address: result.address,
                    latitude: result.latitude,
                    longitude: result.longitude
                })
            }
        })
    })

    socket.on('deliveryCounter', (name) => {
        Delivery.find({ username: req.user.username }, (err, result1) => {
            if (err) {
                console.log(err);
            } else {
                io.emit(deliveryResponse, {
                    'count': result1.length
                })
            }
        })
    })
    socket.on('makeDelivery', (name) => {
        Package.find({ name: name }, (err, result1) => {
            if (err) {
                console.log(err);
            } else {
                Delivery.create({
                    name: result1.name,
                    address: result1.to_address,
                    start_time: new Date().toDateString(),
                    status: 'Open',
                    username: req.user.username,
                    fromUsername: result1.from_name,
                    toUsername: result1.to_name,
                    to_address: result1.to_address,
                    package_id: result1._id
                }, (err, result2) => {
                    if (err) {
                        console.log(err)
                    } else {
                        io.emit('deliveryCreated', { name: result2.name })
                    }
                })
            }
        })
    })
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