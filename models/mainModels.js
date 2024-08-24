/* mainModels.js */

const db = require('../utils/database'); // Importing the database utility for performing database operations

const mainModels = {

    /**
     * @desc Finds a user by email, including supplier details if available
     * @param {string} email - The email of the user to find
     * @returns {Promise<Object>} - A promise that resolves with the user details, including supplierID if the user is a supplier
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    findByEmail: function(email) {
        // SQL query to find the user by email and include supplier details if available
        return new Promise((resolve, reject) => {
            const query = `
                SELECT Users.*, Suppliers.supplierID 
                FROM Users 
                LEFT JOIN Suppliers ON Users.userID = Suppliers.userID 
                WHERE Users.email = ?
            `;
            db.get(query, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },


    /**
     * @desc Creates a new user in the database
     * @param {Object} userData - The data of the user to be created
     * @param {string} userData.userType - The type of the user (User or Supplier)
     * @param {string} userData.companyAddress - The address of the user's company
     * @param {string} userData.companyName - The name of the user's company
     * @param {string} userData.email - The email of the user
     * @param {string} userData.password - The password of the user
     * @returns {Promise<number>} - A promise that resolves with the ID of the newly created user
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    create: function(userData) {
        return new Promise((resolve, reject) => {
            const { userType, companyAddress, companyName, email, password } = userData;
            const query = 'INSERT INTO Users (userType, companyAddress, companyName, email, password) VALUES (?, ?, ?, ?, ?)';
            // Execute the query to insert a new user
            db.run(query, [userType, companyAddress, companyName, email, password], function(err) {
                if (err) reject(err);
                resolve(this.lastID); // returns the id of the newly created user
                console.log("User created successfully");
            });
        });
    },


    /**
     * @desc Creates a new supplier in the database, including user details and supplier details
     * @param {Object} supplierData - The data of the supplier to be created
     * @param {string} supplierData.userType - The type of the user (Supplier)
     * @param {string} supplierData.companyAddress - The address of the supplier's company
     * @param {string} supplierData.companyName - The name of the supplier's company
     * @param {string} supplierData.email - The email of the supplier
     * @param {string} supplierData.password - The password of the supplier
     * @param {string} supplierData.description - The description of the supplier
     * @returns {Promise<number>} - A promise that resolves with the ID of the newly created supplier user
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    createSupplier: function(supplierData) {
        return new Promise((resolve, reject) => {
            const { userType, companyAddress, companyName, email, password, description } = supplierData;
    
            // Serialize the database operations to ensure they execute sequentially
            db.serialize(() => {
                // Start a new transaction
                db.run("BEGIN TRANSACTION;", (err) => {
                    if (err) {
                        console.error("Error starting transaction:", err);
                        return reject(err);
                    }
    
                    const userInsertQuery = 'INSERT INTO Users (userType, CompanyAddress, CompanyName, Email, Password) VALUES (?, ?, ?, ?, ?)';
                    
                    // Insert user details
                    db.run(userInsertQuery, [userType, companyAddress, companyName, email, password], function(userErr) {
                        if (userErr) {
                            console.error("Error inserting user:", userErr);
                            db.run("ROLLBACK;", function(rollbackErr) {
                                if (rollbackErr) console.error("Error rolling back transaction:", rollbackErr);
                            });
                            return reject(userErr);
                        }
    
                        const userId = this.lastID;
                        console.log("User inserted with ID:", userId);
    
                        const supplierInsertQuery = 'INSERT INTO Suppliers (UserID, supplierDescription) VALUES (?, ?)';
                        
                        // Insert supplier details
                        db.run(supplierInsertQuery, [userId, description], function(supplierErr) {
                            if (supplierErr) {
                                console.error("Error inserting supplier:", supplierErr);
                                db.run("ROLLBACK;", function(rollbackErr) {
                                    if (rollbackErr) console.error("Error rolling back transaction:", rollbackErr);
                                });
                                return reject(supplierErr);
                            }
                            
                            // Commit the transaction to ensure all operations are saved
                            // Committing is required here to finalize the user and supplier creation
                            // If commit is not done, all changes made during the transaction will be discarded
                            db.run("COMMIT;", function(commitErr) {
                                if (commitErr) {
                                    console.error("Error committing transaction:", commitErr);
                                    return reject(commitErr);
                                }
                                console.log("Transaction committed successfully");
                                console.log("Supplier created successfully");
                                resolve(userId);
                            });
                        });
                    });
                });
            });
        });
    },
    

    /**
    * @desc Updates the profile photo path for a specific user in the database
    * @param {number} userId - The ID of the user whose profile photo is being updated
    * @param {string} imagePath - The new path to the user's profile photo
    * @returns {Promise<number>} - A promise that resolves with the number of rows affected
    * @throws {Error} - Throws an error if there is an issue with the database query
    */
    updateProfilePhoto: function(userId, imagePath) {
        return new Promise((resolve, reject) => {
            console.log(`Updating user ${userId} with new image path ${imagePath}`);
            const query = 'UPDATE Users SET profilePhoto = ? WHERE userID = ?';
            db.run(query, [imagePath, userId], function(err) {
                if (err) {
                    console.error("Database update error:", err);
                    return reject(err);
                }
                console.log(`New profile Photo updated successfully`);
                resolve(this.changes);
            });
        });
    },


    /**
     * @desc Retrieves the details of a specific order from the database
     * @param {number} orderID - The ID of the order whose details are being retrieved
     * @returns {Promise<Object>} - A promise that resolves with the order details
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getOrderDetailsById: function(orderID) {
        return new Promise((resolve, reject) => {
            // SQL query to fetch the details of the order
            const query = `
            SELECT Orders.*, 
                UserDetail.companyName AS userCompanyName, 
                UserDetail.companyAddress AS userAddress,
                SupplierDetail.companyName AS supplierCompanyName,
                SupplierDetail.companyAddress AS supplierAddress,
                Suppliers.supplierDescription,
                Orders.totalPrice
            FROM Orders
            JOIN Users AS UserDetail ON Orders.userID = UserDetail.userID
            JOIN Suppliers ON Orders.supplierID = Suppliers.supplierID
            JOIN Users AS SupplierDetail ON Suppliers.userID = SupplierDetail.userID
            WHERE Orders.orderID = ?
            `;
            db.get(query, [orderID], (err, orderDetails) => {
                if (err) {
                    console.error('Error fetching order details:', err);
                    reject(err);
                } else {
                    resolve(orderDetails);
                }
            });
        });
    },


    /**
     * @desc Retrieves the products associated with a specific order from the database
     * @param {number} orderID - The ID of the order whose products are being retrieved
     * @returns {Promise<Array>} - A promise that resolves with an array of products, including the product name, price, quantity, and total price
     * @throws {Error} - Throws an error if there is an issue with the database query
     */
    getOrderProducts: function(orderID) {
        return new Promise((resolve, reject) => {
            // SQL query to fetch the products associated with the orde
            const query = `
                SELECT OrderDetails.*, OrderDetails.productName, OrderDetails.price,
                      (OrderDetails.price * OrderDetails.quantity) AS totalPrice
                FROM OrderDetails
                JOIN Products ON OrderDetails.productID = Products.productID
                WHERE orderID = ?
            `;
            db.all(query, [orderID], (err, products) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(products);
                }
            });
        });
    },

};


module.exports = mainModels; // Exporting the model to be used in other parts of the application
