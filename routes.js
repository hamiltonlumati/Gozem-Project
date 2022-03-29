const passport = require('passport');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { request } = require('http');

module.exports = function(app, User, Package, Delivery, ensureAuthenticated) {
    //Schemas


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
    app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/dashboard');
    });


    //Register
    app.post('/register', (req, res, next) => {
            const hash = bcrypt.hashSync(req.body.password, 12);
            Users.findOne({ email: req.body.email }, function(err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/');
                } else {
                    User.insertOne({
                            name: req.body.name,
                            surname: req.body.surname,
                            email: req.body.email,
                            account_type: req.body.account_type,
                            username: req.body.username,
                            password: hash,
                            address: req.body.address,
                            location: req.body.location
                        },
                        (err, doc) => {
                            if (err) {
                                res.render('login', { error: 1 })
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
            if (req.user.account_type == 1) {
                res.redirect('/dashboard');
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

    app.get('/dashboard', ensureAuthenticated, (req, res) => {
        if (req.user.account_type == 1) {
            res.redirect('/index');
        }
        if (req.user.account_type == 2) {
            res.redirect('/web_driver');
        }
        if (req.user.account_type == 1) {
            res.redirect('/web_tracker');
        }

    })
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

    app.get('/web_driver', ensureAuthenticated, (req, res) => {
        switch (req.query.item) {
            case 2:
                Delivery.find({ userCreator: req.user.userCreator }, (err, result) => {
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
            case 3:
                Package.find({ status: 'Open', name: req.query.itemname }, (err, result) => {
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
                Package.find({ status: 'Open' }, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render('web_driver', {
                            item: req.query.item,
                            'result1': result
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
        if (item == 3) {
            Package.find({ username: req.user.username, name: req.query.itemname }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('web_tracker', {
                        result: result,
                    });

                }
            })
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
    })
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
}