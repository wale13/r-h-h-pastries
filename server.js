const express = require('express');
const app = express();
app.use(express.static('public'));
app.use(express.json());

const { logNodeError, addNewOrderRouter, getEntireDBRouter, getNewOrderIDRouter } = require('./db-utils');

console.log('Server is running on', process.env.PORT || 8080, process.env.IP || '0.0.0.0');

app.listen(process.env.PORT || 8080, process.env.IP || '0.0.0.0' );

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./cake-db/orders.db', (err) => {
    if (err) {
        console.log(err);
    }
    console.log('Connected to orders.db!');
});

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS Clients (client_id INTEGER PRIMARY KEY,name,surname,tel,avatar)", logNodeError);
    db.run("CREATE TABLE IF NOT EXISTS Orders (order_id INTEGER PRIMARY KEY,client_id,cake_type,theme,deadline,desired_weight,desired_value,base_price,diameter,sponges,fillings,cream,delivery,prototype,comments,result_photo,final_weight,final_value)", logNodeError);
});



app.use('/add-order', addNewOrderRouter);
app.use('/get-new-order-id', getNewOrderIDRouter);
app.use('/get-db', getEntireDBRouter); 