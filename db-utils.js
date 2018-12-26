const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const timeStamp = require('date-format');
const insertTimeStamp = () => timeStamp('yyyy.MM.dd hh:mm:ss', new Date());
const insertDateStamp = () => timeStamp('yyyy-MM-dd', new Date());

const db = new sqlite3.Database(`${process.env.DB_PATH}orders.db`, err => {
    if (err) {
        console.log(err);
    }
    console.log(insertTimeStamp(), 'Connected to orders.db!');
});

const checkOrdersDB = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS Clients 
                (client_id INTEGER PRIMARY KEY,
                name,surname,tel,avatar);`, 
                logNodeError);
        db.run(`CREATE TABLE IF NOT EXISTS Orders 
                (order_id INTEGER PRIMARY KEY,
                client_id,cake_type,theme,deadline,desired_weight,desired_value,
                base_price,diameter,sponges,fillings,cream,delivery,prototype,
                comments,result_photo,final_weight,final_value,cake_section);`, 
                logNodeError);
    });
};

const logNodeError = error => {
  if (error) {
    console.log(error);
    return;
  }
};

const tableDataParser = (req, res, next) => {
    ['sponges', 'fillings', 'cream', 'delivery'].forEach( el => {
        if (!req.body[el]) {req.body[el] = ''}
    });
    const clientKeyNames = ['client_id', 'name', 'surname', 'tel', 'avatar'];
    let onlyOrderKeys = Object.keys(req.body).filter( key => {
        if (!clientKeyNames.includes(key, 1)) {
            return key;
        }
    });
    req.orderKeys = onlyOrderKeys.toString();
    req.orderValues = onlyOrderKeys.map( key => JSON.stringify(req.body[key].toString()));
    let onlyClientKeys = Object.keys(req.body).filter( key => {
        if (clientKeyNames.includes(key)) {
            return key;
        } 
    });
    req.clientKeys = onlyClientKeys.toString();
    req.clientValues = onlyClientKeys.map( key => JSON.stringify(req.body[key].toString()));
    next();
};

const addNewOrderRouter = express.Router();

addNewOrderRouter.post('/', tableDataParser, (req, res) => {
    console.log(insertTimeStamp(), 'Received some new order...');
    const addNewOrder = () => {
        db.get(`SELECT client_id 
                FROM Clients 
                WHERE name = ${req.body.name} 
                AND surname = ${req.body.surname};`,
                (err, row) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    else if (typeof(row) != 'undefined') {
                        db.run(`INSERT INTO Orders(client_id,${req.orderKeys}) 
                                VALUES ("${row.client_id}",${req.orderValues});`, 
                                function(err) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    res.status(201).send(JSON.stringify(`Замовлення № ${this.lastID} успішно додано!`));
                                    console.log(insertTimeStamp(), `Added new order # ${this.lastID}.`);
                                });
                    } else {
                        db.run(`INSERT INTO Clients(${req.clientKeys}) 
                                VALUES (${req.clientValues});`, 
                                logNodeError
                        );
                        console.log(insertTimeStamp(), `Added new client: ${req.body.name} ${req.body.surname}.`);
                        addNewOrder();
                    }
                });
    };
    addNewOrder();
});

const editOrderRouter = express.Router();

editOrderRouter.post('/', tableDataParser, (req, res) => {
    console.log(insertTimeStamp(), `Received edited order # ${req.body.order_id}.`);
    db.parallelize(() => {
        db.run(`UPDATE Clients 
                SET (${req.clientKeys}) = (${req.clientValues}) 
                WHERE client_id = ${req.body.client_id};`, 
                logNodeError);
        db.run(`UPDATE Orders 
                SET (${req.orderKeys}) = (${req.orderValues}) 
                WHERE order_id = ${req.body.order_id};`, 
                logNodeError);
    });
    res.status(201).send(JSON.stringify('Дані успішно оновлено.'));
    console.log(insertTimeStamp(), `Order successfully updated!`);
});

const getNewOrderIDRouter = express.Router();

getNewOrderIDRouter.get('/', (req, res) => {
    db.get(`SELECT rowid 
            FROM Orders 
            ORDER BY rowid DESC 
            LIMIT 1;`, 
            (err, row) => {
                let newOrderID;
                if (err) {
                    console.log(err);
                    return;
                }
                else {
                    typeof(row) === 'undefined' ? newOrderID = 1 : newOrderID = row.order_id + 1;
                }
                res.status(200).send(JSON.stringify(newOrderID));
            });
});

const getCakesQtyRouter = express.Router();

getCakesQtyRouter.get('/', (req, res) => {
    db.get(`SELECT count(*) 
            FROM Orders;`, 
            (err, row) => {
                if (err) {
                    console.log(err);
                    return;
                }
                res.status(200).send(JSON.stringify(row));
            });
});

const getPageContentRouter = express.Router();

getPageContentRouter.post('/', (req, res) => {
    db.all(`SELECT * 
            FROM Orders 
            ORDER BY rowid DESC 
            LIMIT ${req.body.offset}, ${req.body.limit};`, 
            (err, rows) => {
                if (err) {
                    console.log(err);
                    return;
                }
                res.status(200).send(rows);
            });
});

const getOrderRouter = express.Router();

getOrderRouter.get('/:id', (req, res) => {
    db.get(`SELECT * 
            FROM Orders 
            INNER JOIN Clients 
            ON Orders.client_id = Clients.client_id 
            WHERE Orders.order_id = ${req.params.id};`, 
            (err, row) => {
                if (err) {
                    console.log(err);
                    return;
                }
                res.status(200).send(row);
            });
});

module.exports = {
    editOrderRouter,
    addNewOrderRouter,
    getNewOrderIDRouter,
    getCakesQtyRouter,
    getPageContentRouter,
    getOrderRouter,
    checkOrdersDB,
    insertTimeStamp,
    insertDateStamp
};