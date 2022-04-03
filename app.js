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

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);
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


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
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
app.use(passport.authenticate('session'));



app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))




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
    from_location: { type: Object, required: true },
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
app.get('/index', ensureAuthenticated, (req, res) => {
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

app.get('/search', ensureAuthenticated, (req, res) => {
    item = req.query.item;
    if (item == 1) {
        Package.find({ name: item }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'item': 'Packages',
                    'result': result
                })
            }
        })
    }
    if (item == 2) {
        Delivery.find({ name: item, status: 'Open' }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'result': result
                })
            }
        })
    }
    if (item == 3) {
        Delivery.find({ name: item, status: 'Delivered' }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'result': result,
                    'item': 'Delivered Deliveries'
                })
            }
        })
    }
    if (item == 4) {
        User.find({ account_type: 2 }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'result': result,
                    item: 'Drivers'
                })
            }
        })
    }
    if (item == 5) {
        User.find({ account_type: 3 }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('result', {
                    'result': result,
                    item: 'Clients'
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
        User.findOne({ email: req.body.email }, function(err, user) {
            if (err) {
                next(err);
            } else if (user) {
                res.redirect('/');
            } else {
                const user = new User({
                    name: req.body.name,
                    surname: req.body.surname,
                    email: req.body.email,
                    account_type: req.body.account_type,
                    username: req.body.username,
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
            res.render('index');
        }
        if (req.user.account_type == 2) {
            res.render('web_driver');
        }
        if (req.user.account_type == 3) {
            res.render('web_tracker');
        }

    }
);

//Unauthenticate
app.route('/logout')
    .get((req, res) => {
        req.logout();
        res.redirect('/');
    });

app.get('/dashboard', ensureAuthenticated, (req, res) => {
    if (req.user.account_type == 1) {
        res.render('index');
    }
    if (req.user.account_type == 2) {
        res.render('web_driver');
    }
    if (req.user.account_type == 1) {
        res.render('web_tracker');
    }

});
app.get('/add', ensureAuthenticated, (req, res) => {
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

app.get('/api/package/:id', ensureAuthenticated, (req, res) => {
    if (req.query.delete = 1) {
        let id = req.query.id;
        Package.deleteOne({ _id: id }, (err, result) => {
            if (err) {
                console.log(err);
            }
        })
    }
});

app.post('/api/package/', ensureAuthenticated, (req, res) => {
    let packreq = req.body;
    if (req.user.account_type == 1) {
        User.find({ email: email }, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                var pack = new Package({
                    description: packreq.description,
                    from_name: packreq.from_name,
                    from_address: packreq.from_address,
                    from_location: packreq.from_location,
                    to_name: packreq.to_name,
                    to_address: packreq.to_address,
                    to_location: packreq.to_location,
                    depth: packreq.depth,
                    weight: packreq.weight,
                    width: packreq.width,
                    height: packreq.height,
                    name: packreq.name,
                    username: result.username
                });

            }
        })
    } else {
        var pack = new Package({
            description: packreq.description,
            from_name: packreq.from_name,
            from_address: packreq.from_address,
            from_location: packreq.from_location,
            to_name: packreq.to_name,
            to_address: packreq.to_address,
            to_location: packreq.to_location,
            depth: packreq.depth,
            weight: packreq.weight,
            width: packreq.width,
            height: packreq.height,
            name: packreq.name,
            username: req.user.username
        })
    }
    pack.save((err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json(result);
        }
    })

});

app.get('/package/update', ensureAuthenticated, (req, res) => {
    let packUpdate = 1;
    let packID = req.query.id;
    Package.findById(packID, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('update', {
                result: result,
                pack: packUpdate
            })
        }
    })
})

app.put('/api/package/', ensureAuthenticated, (req, res) => {
    let putParams = req.params;
    Package.findById(putParams.id, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.description !== putParams.description) {
                result.description = putParams.description;
            }
            if (result.from_name !== putParams.from_name) {
                result.from_name = putParams.from_name;
            }
            if (result.from_address !== putParams.from_address) {
                result.from_address = putParams.from_address
            }
            if (result.from_location !== putParams.from_location) {
                result.from_location = putParams.from_location;
            }
            if (result.to_name !== putParams.to_name) {
                result.to_name = putParams.to_name
            }
            if (result.to_address !== putParams.to_address) {
                result.to_address = putParams.to_address
            }
            if (result.to_location !== putParams.to_location) {
                result.to_location = putParams.to_location;
            }
            if (result.depth !== putParams.depth) {
                result.depth = putParams.depth
            }
            if (result.width !== putParams.width) {
                result.width = putParams.width
            }
            if (result.height !== putParams.height) {
                result.height = putParams.height
            }
            if (result.weight !== putParams.weight) {
                result.weight = putParams.weight
            }
            result.save((err, resultSaved) => {
                res.render('/dashboard')
            });
        }
    })
});

app.delete('/api/package/:id', ensureAuthenticated, (req, res) => {
    let id = req.query.id;
    Package.deleteOne({ _id: id }, (err, result) => {
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

app.get('/web_driver', ensureAuthenticated, (req, res) => {
    var item = req.query.item;
    switch (item) {
        case 2:
            Package.find({ status: 'Free' }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('web_driver', {
                        item: req.query.item,
                        'result1': result
                    });
                }
            })
            break;
        case 3:
            Package.find({ status: 'Free', name: req.query.itemname }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('web_driver', {
                        item: req.query.item,
                        result: result
                    });
                }
            })
            break;
        default:
            Delivery.find({ username: req.user.username, status: 'Open' }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('web_driver', {
                        item: req.query.item,
                        result: result
                    });
                }
            })

    }
    res.render('web_driver', {
        packageResult: 0,
        deliveryResult: 0
    });
})

app.get('/web_tracker', ensureAuthenticated, (req, res) => {
    var item = req.query.item;
    switch (item) {
        case 3:
            Package.find({ username: req.user.username, name: req.query.itemname }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('web_tracker', {
                        result: result,
                    });
                }
            })
            break;
        default:
            Delivery.find({ fromUser: req.user.username }, (err, result1) => {
                if (err) {
                    console.log(err);
                } else {
                    Delivery.find({ toUser: req.user.username }, (err, result2) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.render('web_tracker', {
                                'result1': result1,
                                'result2': result2,
                            })
                        }
                    })
                }
            })
    }
    if (item == 3) {} else {
        Package.find({ username: req.user.username }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render('web_tracker', {
                    'result1': result,
                });
            }
        })
    }
});
app.get('/map', ensureAuthenticated, (req, res) => {
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

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}



//404
app.use((req, res, next) => {
    res.status(404)
        .type('text')
        .send('Not Found');
});


//AUTHENTICATION

// Serialization and deserialization here...
passport.serializeUser((user, done) => {
    console.log(user._id)
    done(null, user._id);
});
passport.deserializeUser((id, done) => {
    User.findOne({ _id: new ObjectID(id) }, (err, user) => {
        console.log(user);
        if (err) {
            console.log(err);
            done(err, null);
        } else {
            done(null, user)
        }
    });
});
passport.use(new LocalStrategy(function verify(username, password, done) {
    console.log(username)
    console.log(password)
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