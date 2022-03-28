// Do not change this file
require('dotenv').config();
const { MongoClient } = require('mongodb');
var mongoose = require('mongoose');


async function main(callback) {
    const URI = process.env.MONGO_URI; // Declare MONGO_URI in your .env file
    //const client = new MongoClient(URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const client = mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
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
        to_location: { type: Object, required: true }
    })

    const deliverySchema = new mongoose.Schema({
        package_id: { type: String, required: true },
        pick_up: { type: Date, required: true },
        start_time: { type: Date, required: true },
        end_time: { type: Date, required: true },
        location: { type: String, required: true },
        status: { type: String, required: true },
        delivery_code: { type: Number, required: true },
        package_code: { type: Number, required: true }
    });

    //1= admin, 2=driver, 3=client
    const userSchema = new mongoose.Schema({
        email: String,
        account_type: Number,
        password: String,
    })


    try {
        // Connect to the MongoDB cluster
        //await client.connect();

        // Make the appropriate DB calls
        await callback(client);

    } catch (e) {
        // Catch any errors
        console.error(e);
        throw new Error('Unable to Connect to Database')
    }
}

module.exports = main;