var mysql = require("mysql");
var inquirer = require('inquirer');
var table = require('easy-table')

var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "",
    database: "bamazon_DB"
});

connection.connect(function (err) {
    if (err) throw err;

    start();
});

function start() {

    inquirer
        .prompt({
            name: "view",
            type: "list",
            message: "Who are you?",
            choices: [
                "Customer",
                "Manager", "exit"
            ]
        })
        .then(function (answer) {
            switch (answer.view) {
                case "Customer":
                    customerSearch();
                    break;

                case "Manager":
                console.log("Coming later. Try the customer search instead.");
                customerSearch();
                    break;


                case "exit":
                    connection.end();
                    break;
            }
        });
}

function customerSearch() {
    console.log("Welcome dear customer. We appreciate you. Buy our merch and feel instant fulfillment.*")
    console.log("(*Fulfillment times may vary)")
    let validIds = [];
    connection.query("SELECT * FROM products where stock_quantity > 0", function (err, res) {
        if (err) {

        } else {
            var t = new table

            res.forEach(function (product) {
                t.cell('Product Id', product.item_id)
                validIds.push(product.item_id.toString());
                t.cell('Description', product.product_name)
                t.cell('Price, USD', product.price, table.number(2))
                t.newRow()
            })
            console.log(t.toString())
            // console.table(res);
            inquirer
                .prompt({
                    name: "itemSelect",
                    type: "input",
                    validate: checkIt,
                    message: "Enter the ID of the item you desire"

                }).then(function (answer) {
                    let obby = '';

                    obby = res.find(function (err) {
                        return err.item_id == answer.itemSelect;

                    })
                    let itemId = obby.item_id;
                    console.log(itemId);
                    console.log("You selected: " + obby.product_name + ". A fine choice. There are " + obby.stock_quantity + " left at " +
                        obby.price + " dollars each.");


                    inquirer.prompt({
                        name: "quantitySelect",
                        type: "number",
                        validate: numTest,
                        message: "How many would you like to purchase?"
                    }).then(function (qua) {
                        // connection.end();
                        processOrder(qua.quantitySelect, itemId);

                    })

                    //end quantity promoise
                })

        }
        //end initial id promise
    })
    //end function
    function checkIt(err) {
        console.log(err)
        console.log(validIds);
        if (validIds.indexOf(err) > -1) {
            return true;
        } else {
            return false, "Try again";
        }
    }
}


function processOrder(orderQ, id) {

    connection.query("Select * from products where item_id=" + id, function (err, res) {
        let quan = res[0].stock_quantity;
        let remaining = quan - orderQ;
        if (orderQ > quan) {
            inquirer
                .prompt({
                    name: "quantError",
                    type: "input",
                    validate: numTest,
                    message: "That's too much man. Enter a quantity less than " + quan

                }).then(function (answer) {
                    processOrder(answer.quantError, id);
                })
        } else {
            confirmOrder(remaining, orderQ, id, res);
        }
    })
}

function numTest(maybe) {
    maybe = parseInt(maybe);
    if (isNaN(maybe)) {
        return false, "Must enter a number.";
    } else if (maybe <= 0) {
        return false, "Must enter a number greater than 0";
    } else {
        return true;
    }
}

function confirmOrder(quan, orderQ, id, res) {
    inquirer
        .prompt({
            name: "orderIt",
            type: "confirm",

            message: "Confirm you would like to buy " + orderQ + " of " + res[0].product_name

        }).then(function (answer) {
            if (answer.orderIt) {
                connection.query("update products set stock_quantity =? where item_id=?", [quan, id], function (err, result) {
                    if (err) {
                        console.log("Something went wrong");
                        customerSearch();
                    } else {

                console.log("Congrats, your non-refundable order total is: " + orderQ * parseInt(res[0].price))
                        inquirer
                            .prompt({
                                name: "navUser",
                                type: "confirm",
                                message: "Would you like to buy some more stuff?"

                            }).then(function (answer) {
                                // console.log(answer.navUser);
                                if (answer.navUser) {
                                    customerSearch();
                                } else {
                                    console.log("Byeeeee");
                                    connection.end();

                                }

                            })
                        }
                    })
            
        } else {
                customerSearch();
            }
                })
}
