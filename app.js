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
const routes = require('./routes');
const auth = require('./auth.js');
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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }))

app.use(passport.initialize());
app.use(passport.session());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.authenticate('session'));

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
const client = new MongoClient(URI, { useNewUrlParser: true, useUnifiedTopology: true });
try {
    // Connect to the MongoDB cluster
    client.connect();

    // Make the appropriate DB calls
    callback(client);

} catch (e) {
    // Catch any errors
    console.error(e);
    throw new Error('Unable to Connect to Database')
}
const myDataBase = client.db('myFirstDatabase').collection('users');


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
    var item = req.query.item;
    console.log(item);
    if (!item) {
        item = 1;
    }
    switch (item) {
        case 1:
            Package.find({}, result = (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                    res.render('index', {
                        'item': item,
                        'result1': result

                    })
                }
            })
            break;
        case 2:
            response.setHeader("Content-Type", "text/html");

            Delivery.find({}, result = (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('index', {
                        'item': item,
                        'result1': result

                    })
                }
            })
            break;
        case 3:
            var itemname = req.body.itemname;
            Package.find({ name: itemname }, result = (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('index', {
                        'item': item,
                        'result1': result

                    })
                }
            })
            break;
        case 4:
            var itemname = req.body.itemname;
            Delivery.find({ name: itemname }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('index', {
                        'item': item,
                        'result1': result

                    })
                }
            })
            break;
        case 5:
            User.find({}, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('index', {
                        result: result
                    })
                }
            })
            break;
        case 6:
            var itemname = req.body.itemname;
            User.find({ name: itemname }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('index', {
                        result: result
                    })
                }
            })
            break;
        default:
            console.log(item);
            Package.find({},
                result = (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render('index', {
                            'item': item,
                            'result1': result

                        })
                    }
                })
    }

})

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
    (req, res, next) => {
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
    let pack = req.query.pack;
    let delivery = req.query.delivery;
    if (pack) {
        pack = 1
    }
    if (delivery) {
        delivery = 1
    }
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
    } else {
        let id = req.query.id;
        Package.findById(id, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.json(result)
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
                let pack = new Package({
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
        let pack = new Package({
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
                res.json(resultSaved)
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

app.get('/add_delivery', ensureAuthenticated, (req, res) => {
    var status = req.body.status;
    if (status)
        res.render('delivery_add')
})


app.get('/api/delivery', ensureAuthenticated, (req, res) => {
    let id = req.query.id;
    if (req.query.delete == 1) {
        Delivery.deleteOne({ _id: id }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/dashboard');
            }
        })
    } else {
        Delivery.findById(id, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        })
    }

});

app.post('/api/delivery/:id', ensureAuthenticated, (req, res) => {
    let delreq = req.body;
    let delivery = new Delivery({
        package_id: delreq.package_id,
        pick_up: delreq.pick_up,
        start_time: delreq.start_time,
        end_time: delreq.end_time,
        location: delreq.location,
        status: delreq.status
    });
    delivery.save((err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json(result)
        }
    })

});
app.get('/delivery/update', ensureAuthenticated, (req, res) => {
    let delUpdate = 1;
    let delID = req.query.id;
    Package.findById(delID, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.render('update', {
                result: result,
                delivery: delUpdate
            })
        }
    })
})

app.put('/api/delivery/:id', ensureAuthenticated, (req, res) => {
    let putParams = req.params;
    Delivery.findById(putParams.id, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.package_id !== putParams.package_id) {
                result.package_id = putParams.package_id;
            }
            if (result.pick_up !== putParams.pick_up) {
                result.pick_up = putParams.pick_up;
            }
            if (result.start_time !== putParams.start_time) {
                result.start_time = putParams.start_time;
            }
            if (result.end_time !== putParams.end_time) {
                result.end_time = putParams.end_time;
            }
            if (result.location !== putParams.location) {
                result.location = putParams.location;
            }
            if (result.status !== putParams.status) {
                result.status = putParams.status;
            }
            result.save((err, resultEdited) => {
                if (err) {
                    console.log(err);
                } else {
                    res.json(resultEdited)
                }
            })

        }
    });
})

app.delete('/api/delivery/:id', ensureAuthenticated, (req, res) => {
    let id = req.id;
    Delivery.deleteOne({ _id: id }, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json(result);
        }
    })
})


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
    if (item == 3) {

    } else {
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
    console.log(req.isAuthenticated)
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
    done(null, user._id);
});
passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, user) => {
        done(null, user);
    });
});
passport.use(new LocalStrategy(
    function verify(email, password, done) {
        console.log(email)
        console.log(password)
        myDataBase.findOne({ 'email': email }, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }
));






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