const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;
require('dotenv').config();


module.exports = function(app, User, Package, Delivery) {
    // Serialization and deserialization here...
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
        User.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        });
    });
    passport.use(new LocalStrategy(
        function(email, password, done) {
            User.findOne({ email: email }, function(err, user) {
                console.log('User ' + username + ' attempted to log in.');
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false);
                }
                return done(null, user);
            });
        }
    ));

}