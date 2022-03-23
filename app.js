var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var ws = require('ws');
var cors = require('cors');
require('dotenv').config();
console.log(process.env);
const http = require('http');
//import { WebSocketServer } from "ws";

/* var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
 */
var app = express();

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', (err) => {
    if (err) {
        crossOriginIsolated.log(err);
    } else {
        console.log(`App listening on port ${port} `);
    }
})


//Connection with database
mongoose.connect("mongodb+srv://hamiltonlumati:ICUI4CU10h!@cluster0.ovy9d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

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

/* app.use('/', indexRouter);
app.use('/users', usersRouter);
 */
// catch 404 and forward to error handler
/* app.use(function(req, res, next) {
    next(createError(404));
}); */

// error handler
/* app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
 */
//Schemas
const packageSchema = new mongoose.Schema({
    description: String,
    weight: Number,
    width: Number,
    height: Number,
    depth: Number,
    from_name: String,
    from_address: String,
    from_location: Object,
    to_name: String,
    to_address: String,
    to_location: Object
})

const deliverySchema = new mongoose.Schema({
    package_id: String,
    pick_up: Date,
    start_time: Date,
    end_time: Date,
    location: String,
    status: String
})

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = mongoose.model('User', userSchema);
const Package = mongoose.model('Package', packageSchema);
const Delivery = mongoose.model('Delivery', deliverySchema);

app.get('/', (req, res) => {
    Package.find({}, (err, packageResult) => {
        if (err) {
            console.log({ err })
        } else {
            if (!packageResult) {
                packageResult = 0;
            }
            Delivery.find({}, (err, deliveryResult) => {
                if (err) {
                    console.log({ err })
                } else {
                    if (!deliveryResult) {
                        deliveryResult = 0;
                    }
                    res.render('index', {
                        'packageResult': packageResult,
                        'deliveryResult': deliveryResult
                    })
                }
            })
        }
    })
})



app.get('/add', (req, res) => {
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

app.get('/api/package/:id', (req, res) => {
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

app.post('/api/package/', (req, res) => {
    let packreq = req.body;
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
        height: packreq.height
    });
    pack.save((err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json(result);
        }
    })
});

app.get('/package/update', (req, res) => {
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

app.put('/api/package/', (req, res) => {
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

app.delete('/api/package/:id', (req, res) => {
    let id = req.query.id;
    Package.deleteOne({ _id: id }, (err, result) => {
        if (err) {
            console.log(err);
        }
    })
});

app.get('/add_delivery', (req, res) => {
    res.render('delivery_add')
})


app.get('/api/delivery', (req, res) => {
    let id = req.query.id;
    if (req.query.delete == 1) {
        Delivery.deleteOne({ _id: id }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
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

app.post('/api/delivery/:id', (req, res) => {
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
app.get('/delivery/update', (req, res) => {
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

app.put('/api/delivery/:id', (req, res) => {
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

app.delete('/api/delivery/:id', (req, res) => {
    let id = req.id;
    Delivery.deleteOne({ _id: id }, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json(result);
        }
    })
})

app.get('/web_driver', (req, res) => {
    res.render('web_driver', {
        packageResult: 0,
        deliveryResult: 0
    });
})


app.get('/web_tracker', (req, res) => {
    res.render('web_tracker', {
        packageResult: 0,
        deliveryResult: 0
    });
})

app.get('/login', (req, res) => {
    res.render('login');
})


//Web-socket
/* const server = new WebSocketServer({ port: 3000 });

server.on("connection", (socket) => {
    // send a message to the client
    socket.send(JSON.stringify({
        type: "hello from server",
        content: [1, "2"]
    }));

    // receive a message from the client
    socket.on("message", (data) => {
        const packet = JSON.parse(data);

        switch (packet.type) {
            case "hello from client":
                // ...
                break;
        }
    });
});
 */