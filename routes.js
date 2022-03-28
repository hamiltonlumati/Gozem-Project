const passport = require('passport');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');




module.exports = function(app) {
    //Schemas
    const packageSchema = new mongoose.Schema({
        delivery_id: { type: String, required: true },
        description: { type: String, required: true },
        package_code: { type: String, required: true },
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
        userID: { type: String }
    })

    const deliverySchema = new mongoose.Schema({
        package_id: { type: String, required: true },
        pick_up: { type: Date, required: true },
        start_time: { type: Date, required: true },
        end_time: { type: Date, required: true },
        location: { type: String, required: true },
        status: { type: String, required: true },
        delivery_code: { type: Number, required: true },
        package_code: { type: Number, required: true },
        userID: { type: String }

    });

    //1= admin, 2=driver, 3=client
    const userSchema = new mongoose.Schema({
        email: String,
        account_type: Number,
        password: String,
        name: String,
        surname: String
    })

    const User = mongoose.model('User', userSchema);
    const Package = mongoose.model('Package', packageSchema);
    const Delivery = mongoose.model('Delivery', deliverySchema);


    //1: delivery 
    //2: delivery, 
    //3: package with name
    //4: delivery with name
    app.get('/dashboard', (req, res) => {
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
                var code = req.query.code;
                Package.find({ package_code: code }, result = (err, result) => {
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
                var code = req.query.code;
                Delivery.find({ delivery_code: code }, (err, result) => {
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
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/profile');
    });


    //Register
    app.post('/register', (req, res, next) => {
            const hash = bcrypt.hashSync(req.body.password, 12);
            myDataBase.findOne({ email: req.body.email }, function(err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/');
                } else {
                    myDataB.insertOne({
                            username: req.body.username,

                            password: hash
                        },
                        (err, doc) => {
                            if (err) {
                                res.redirect('/');
                            } else {
                                // The inserted document is held within
                                // the ops property of the doc
                                next(null, doc.ops[0]);
                            }
                        }
                    )
                }
            })
        },
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('/profile');
        }
    );

    //Unauthenticate
    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/');
        });

    //404
    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });






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
        var status = req.body.status;
        if (s)
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

    //Unauthenticate
    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/');
        });

    //404
    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });
}