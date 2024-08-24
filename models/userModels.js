/* userModels.js */

const db = require('../utils/database'); // Importing the database utility for performing database operations

const userModels = {

    /**
     * @desc Retrieves a list of all suppliers with their associated user details
     * @returns {Promise<Array>} - A promise that resolves with an array of supplier details
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getAllSuppliers: function() {
        return new Promise((resolve, reject) => {
            // SQL query to fetch supplier details along with their user information
            const query = `
                SELECT Users.userID, Users.companyName, Users.companyAddress, Users.profilePhoto, Suppliers.supplierID,Suppliers.supplierDescription
                FROM Users 
                JOIN Suppliers ON Users.userID = Suppliers.userID
            `;
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching suppliers:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    

    /**
     * @desc Searches for suppliers by company name
     * @param {string} searchQuery - The search query used to find suppliers by name
     * @returns {Promise<Array>} - A promise that resolves with an array of suppliers matching the search query
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    searchSuppliersByName: function(searchQuery) {
        return new Promise((resolve, reject) => {
            // SQL query to find suppliers by company name
            const query = `
                SELECT Users.userID, Users.companyName, Users.companyAddress, Users.profilePhoto, Suppliers.supplierID, Suppliers.supplierDescription
                FROM Users 
                JOIN Suppliers ON Users.userID = Suppliers.userID
                WHERE Users.companyName LIKE ?
            `;
            db.all(query, [`%${searchQuery}%`], (err, rows) => {
                if (err) {
                    console.error('Error searching suppliers:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    

    /**
     * @desc Retrieves a supplier's details by supplier ID
     * @param {number} supplierId - The ID of the supplier to retrieve
     * @returns {Promise<Object|null>} - A promise that resolves with the supplier's details or null if no supplier is found
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getSupplierById: function(supplierId) {
        return new Promise((resolve, reject) => {
            // SQL query to retrieve supplier details by supplier ID
            const query = `SELECT Users.userID, Users.companyName, Users.companyAddress, Users.profilePhoto, Suppliers.supplierID, Suppliers.supplierDescription 
                           FROM Users 
                           JOIN Suppliers ON Users.userID = Suppliers.userID 
                           WHERE Suppliers.supplierID = ?`;
                           db.get(query, [supplierId], (err, row) => {
                            if (err) {
                                console.error("Error executing query:", err);
                                reject(err);
                            } else {
                                if (row) {
                                    resolve(row);
                                } else {
                                    console.log("No supplier found with ID:", supplierId);
                                    resolve(null);  // or reject(new Error("No supplier found"));
                                }
                            }
                            });
                        });
                     },
        

    /**
     * @desc Retrieves all products for a specific supplier by supplier ID
     * @param {number} supplierId - The ID of the supplier whose products are being retrieved
     * @returns {Promise<Array>} - A promise that resolves with an array of products
     * @throws {Error} - Throws an error if there is an issue with the database query
     */           
    getProductsBySupplierId: function(supplierId) {
        return new Promise((resolve, reject) => {
            // SQL query to retrieve products by supplier ID
            const query = `SELECT * FROM Products WHERE supplierID = ? AND isActive = 1`;
            db.all(query, [supplierId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    

    /**
     * @desc Fetches product details by product ID
     * @param {number} productId - The ID of the product to retrieve details for
     * @returns {Promise<Object>} - A promise that resolves with the product details
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    fetchProductDetails: function(productId) {
        return new Promise((resolve, reject) => {
            // SQL query to retrieve product details by product ID
            const query = `SELECT * FROM Products WHERE productID = ?`;
            db.get(query, [productId], (err, row) => {
                if (err) {
                    console.error('Error fetching product details:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },


    /**
     * @desc Creates a new order in the database
     * @param {Object} orderData - The data of the order to be created
     * @param {number} orderData.userID - The ID of the user placing the order
     * @param {number} orderData.supplierID - The ID of the supplier fulfilling the order
     * @param {string} orderData.date - The date the order is placed
     * @param {string} orderData.deliveryDate - The date the order is to be delivered
     * @param {number} orderData.totalPrice - The total price of the order
     * @returns {Promise<number>} - A promise that resolves with the ID of the newly created order
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    createOrder: function(orderData) {
        return new Promise((resolve, reject) => {
            // SQL query to insert a new order
            const query = `
                INSERT INTO Orders 
                (userID, supplierID, date, deliveryDate, totalPrice, deliveryStatus) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            // Default the deliveryStatus to 'Pending'
            db.run(query, [
                orderData.userID, 
                orderData.supplierID, 
                orderData.date, 
                orderData.deliveryDate, 
                orderData.totalPrice, 
                'Pending'  // Default status
            ], function(err) {
                if (err) {
                    console.error("Failed to insert order due to error:", err);
                    reject(err);
                } else {
                    console.log("Order successfully inserted with ID:", this.lastID);
                    resolve(this.lastID);
                }
            });
        });
    },
    

    /**
     * @desc Creates a new order detail in the database
     * @param {Object} detail - The data of the order detail to be created
     * @param {number} detail.orderID - The ID of the order
     * @param {number} detail.productID - The ID of the product
     * @param {string} detail.productName - The name of the product
     * @param {string} detail.productDescription - The description of the product
     * @param {number} detail.quantity - The quantity of the product
     * @param {number} detail.price - The price of the product
     * @returns {Promise<number>} - A promise that resolves with the ID of the newly created order detail
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    createOrderDetail: function(detail) {
        return new Promise((resolve, reject) => {
            // SQL query to insert a new order detail
            const query = `INSERT INTO OrderDetails (orderID, productID, productName, productDescription, quantity, price) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [detail.orderID, detail.productID,  detail.productName, detail.productDescription, detail.quantity, detail.price], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },


    /**
     * @desc Retrieves the orders associated with a specific user from the database
     * @param {number} userID - The ID of the user whose orders are being retrieved
     * @returns {Promise<Array>} - A promise that resolves with an array of orders, or an empty array if no orders are found
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getOrdersByUserID: function(userID) {
        return new Promise((resolve, reject) => {
            // SQL query to fetch the orders associated with the user
            const query = `
            SELECT 
            Orders.orderID, 
            Orders.userID, 
            Users.companyName AS supplierName, 
            Orders.date, 
            Orders.deliveryDate, 
            Orders.totalPrice, 
            Orders.deliveryStatus AS status
        FROM Orders
        INNER JOIN Suppliers ON Orders.supplierID = Suppliers.supplierID
        INNER JOIN Users ON Suppliers.userID = Users.userID
        WHERE Orders.userID = ?
            `;
            db.all(query, [userID], (err, rows) => {
                if (err) {
                    console.error('Error fetching orders:', err);
                    reject(err);
                } else {
                    console.log('All orders retrieved successfully.'); 
                    resolve(rows);
                }
            });
        });
    },
    

    /**
     * @desc Searches for orders by supplier name for a specific user
     * @param {number} userID - The ID of the user whose orders are being searched
     * @param {string} searchQuery - The search query used to find orders by supplier name
     * @returns {Promise<Array>} - A promise that resolves with an array of orders matching the search query
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    searchOrdersBySupplierName: function(userID, searchQuery) {
        return new Promise((resolve, reject) => {
            // SQL query to find orders by supplier name for a specific user
            const query = `
                SELECT 
                    Orders.orderID, 
                    Orders.userID, 
                    Users.companyName AS supplierName, 
                    Orders.date, 
                    Orders.deliveryDate, 
                    Orders.totalPrice, 
                    Orders.deliveryStatus AS status
                FROM Orders
                INNER JOIN Suppliers ON Orders.supplierID = Suppliers.supplierID
                INNER JOIN Users ON Suppliers.userID = Users.userID
                WHERE Orders.userID = ? AND Users.companyName LIKE ?
            `;
            db.all(query, [userID, `%${searchQuery}%`], (err, rows) => {
                if (err) {
                    console.error('Error searching orders:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    
};


module.exports = userModels; // Exporting the model to be used in other parts of the application
