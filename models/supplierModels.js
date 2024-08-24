/* supplierModels.js */

const db = require('../utils/database'); // Importing the database utility for performing database operations

const supplierModels = {

    /**
     * @desc Retrieves all active products associated with the specific supplier
     * @param {number} supplierID - The ID of the supplier whose products are to be fetched
     * @returns {Promise<Array>} - A promise that resolves with an array of products
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getSupplierProducts: function(supplierID) {
        return new Promise((resolve, reject) => {
            // SQL query to fetch all active products for a given supplier
            const query = `
                SELECT * FROM Products 
                WHERE supplierID = ? AND isActive = 1
            `;
            db.all(query, [supplierID], (err, products) => { // Make sure supplierId is correctly passed
                if (err) {
                    reject(err);
                } else {
                    resolve(products);
                }
            });
        });
    },


    /**
     * @desc Updates the description of a supplier in the database
     * @param {number} supplierID - The ID of the supplier whose description is being updated
     * @param {string} description - The new description of the supplier
     * @returns {Promise<number>} - A promise that resolves with the number of rows affected
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    updateSupplierDescription: function(supplierID, description) {
        return new Promise((resolve, reject) => {
            // SQL query to update the supplier's description
            const query = `
                UPDATE Suppliers 
                SET supplierDescription = ? 
                WHERE supplierID = ?
            `;
            db.run(query, [description, supplierID], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);  // this.changes returns the number of rows affected
                }
            });
        });
    },


    /**
     * @desc Retrieves the description of a supplier from the database
     * @param {number} supplierID - The ID of the supplier whose description is being retrieved
     * @returns {Promise<string|null>} - A promise that resolves with the supplier's description or null if not found
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getSupplierDescription: function(supplierID) {
        return new Promise((resolve, reject) => {
            // SQL query to fetch the supplier's description
            const query = `
                SELECT supplierDescription FROM Suppliers
                WHERE supplierID = ?
            `;
            db.get(query, [supplierID], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.supplierDescription : null);
                }
            });
        });
    },


    /**
     * @desc Searches for products by name for a specific supplier
     * @param {number} supplierID - The ID of the supplier whose products are being searched
     * @param {string} productName - The name of the product to search for
     * @returns {Promise<Array>} - A promise that resolves with an array of products matching the search query
     * @throws {Error} - Throws an error if there is an issue with the database query
    */
    getProductsByName: function(supplierID, productName) {
        return new Promise((resolve, reject) => {
            // SQL query to find products by name for a specific supplier
            const query = `
                SELECT * FROM Products 
                WHERE supplierID = ? AND productName LIKE ? AND isActive = 1
            `;
            db.all(query, [supplierID, `%${productName}%`], (err, products) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(products);
                }
            });
        });
    },


    /**
     * @desc Adds a new product for a specific supplier
     * @param {number} supplierID - The ID of the supplier adding the product
     * @param {string} productName - The name of the product
     * @param {string} productDescription - The description of the product
     * @param {number} productPrice - The price of the product
     * @param {string} productImage - The image of the product
     * @returns {Promise<number>} - A promise that resolves with the ID of the newly added product
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    addProduct: function(supplierID, productName, productDescription, productPrice, productImage) {
        return new Promise((resolve, reject) => {
            // SQL query to insert a new product
            const query = `
                INSERT INTO Products (supplierID, productName, productDescription, productPrice, productImage)
                VALUES (?, ?, ?, ?, ?)
            `;
            db.run(query, [supplierID, productName, productDescription, productPrice, productImage], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);  // returns the ID of the last inserted row
                }
            });
        });
    },


    /**
     * @desc Updates an existing product for a specific supplier
     * @param {number} productId - The ID of the product to update
     * @param {string} productName - The new name of the product
     * @param {string} productDescription - The new description of the product
     * @param {number} productPrice - The new price of the product
     * @param {string} [productImage] - The new image of the product (optional)
     * @returns {Promise<number>} - A promise that resolves with the number of rows affected
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    updateProduct: function(productId, productName, productDescription, productPrice, productImage) {
        return new Promise((resolve, reject) => {
            let query;
            let params;

            // If a new product image is provided, update the product with the new image
            if (productImage) {
                query = `
                    UPDATE Products 
                    SET productName = ?, productDescription = ?, productPrice = ?, productImage = ?
                    WHERE productID = ?
                `;
                params = [productName, productDescription, productPrice, productImage, productId];
            } else {
                // If no new product image is provided, update the product without changing the image
                query = `
                    UPDATE Products 
                    SET productName = ?, productDescription = ?, productPrice = ?
                    WHERE productID = ?
                `;
                params = [productName, productDescription, productPrice, productId];
            }

            db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes); // this.changes returns the number of rows affected
                }
            });
        });
    },


    /**
     * @desc Soft deletes a product by setting its isActive status to 2
     * @param {number} productId - The ID of the product to delete
     * @returns {Promise<number>} - A promise that resolves with the number of rows affected
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    deleteProduct: function(productId) {
        return new Promise((resolve, reject) => {
            // SQL query to soft delete a product by setting its isActive status to 2
            const query = `
                UPDATE Products 
                SET isActive = 2
                WHERE productID = ?
            `;
            db.run(query, [productId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },


    /**
     * @desc Retrieves the orders associated with a specific supplier from the database
     * @param {number} supplierID - The ID of the supplier whose orders are being retrieved
     * @returns {Promise<Array>} - A promise that resolves with an array of orders, or an empty array if no orders are found
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getOrdersBySupplierID: function(supplierID) {
        return new Promise((resolve, reject) => {
        // SQL query to fetch the orders associated with the supplier
            const query = `
            SELECT Orders.orderID, Users.companyName AS customerName, Orders.date, Orders.deliveryDate, Orders.totalPrice, Orders.deliveryStatus
            FROM Orders
            INNER JOIN Users ON Orders.userID = Users.userID
            WHERE Orders.supplierID = ?
            ORDER BY Orders.date DESC;        
            `;
            db.all(query, [supplierID], (err, orders) => {
                if (err) {
                    console.error("Error fetching orders for supplierID:", supplierID, err);
                    reject(err);
                } else {
                    console.log("Orders fetched for supplierID:", supplierID);
                    if (orders.length > 0) {
                        console.log('All orders retrieved successfully.'); 
                    } else {
                        console.log("No orders found for this supplier.");
                    }
                    resolve(orders);
                }
            });
            
        });
    },


    /**
     * @desc Searches for orders by customer name for a specific supplier
     * @param {number} supplierID - The ID of the supplier whose orders are being searched
     * @param {string} customerName - The name of the customer to search for
     * @returns {Promise<Array>} - A promise that resolves with an array of orders matching the search query
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getOrdersByCustomerName: function(supplierID, customerName) {
        return new Promise((resolve, reject) => {
            // SQL query to find orders by customer name for a specific supplier
            const query = `
                SELECT Orders.orderID, Users.companyName AS customerName, Orders.date, Orders.deliveryDate, Orders.totalPrice, Orders.deliveryStatus
                FROM Orders
                INNER JOIN Users ON Orders.userID = Users.userID
                WHERE Orders.supplierID = ? AND Users.companyName LIKE ?
                ORDER BY Orders.date DESC;
            `;
            db.all(query, [supplierID, `%${customerName}%`], (err, orders) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(orders);
                }
            });
        });
    },


    /**
     * @desc Updates the delivery status of an order to 'Confirmed' in the database
     * @param {number} orderID - The ID of the order to be updated
     * @returns {Promise<number>} - A promise that resolves with the number of rows affected by the update
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    updateOrderStatus: function(orderID) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE Orders SET deliveryStatus = 'Confirmed' WHERE orderID = ?";
            db.run(query, [orderID], function(err) {
                if (err) {
                    console.error("Failed to update order status:", err);
                    reject(err);
                } else {
                    console.log(`Updated ${this.changes} rows with orderID ${orderID}`);
                    resolve(this.changes);
                }
            });
        });
    },

};


module.exports = supplierModels; // Exporting the model to be used in other parts of the application
