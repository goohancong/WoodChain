/*database.js*/

const sqlite3 = require('sqlite3').verbose(); // Import the sqlite3 library and enable verbose mode for detailed error logging and debugging


let db = new sqlite3.Database('./WoodChain.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error when creating the database', err);
  } else {
    console.log('Database connected!');
    initializeDatabase(db, () => {
      insertDefaultUser(db);
      insertDefaultSupplier(db);
    });
  }
});

function initializeDatabase(db, callback) {
  // Serialize ensures that queries are executed sequentially
  db.serialize(() => {  
    db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        userID INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        userType TEXT CHECK(userType IN ('User', 'Supplier')) NOT NULL,
        companyName VARCHAR(255),
        companyAddress VARCHAR(255),
        profilePhoto VARCHAR(255)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Suppliers (
        supplierID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID INTEGER UNIQUE,
        supplierDescription TEXT,
        FOREIGN KEY(userID) REFERENCES Users(userID)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Products (
        productID INTEGER PRIMARY KEY AUTOINCREMENT,
        supplierID INTEGER,
        productName VARCHAR(255),
        productDescription TEXT,
        productPrice DECIMAL(10, 2),
        productImage VARCHAR(255),
        isActive BOOLEAN DEFAULT 1,
        FOREIGN KEY(supplierID) REFERENCES Suppliers(supplierID)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Orders (
        orderID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID INTEGER,
        supplierID INTEGER,
        date DATE,
        deliveryDate DATE,
        totalPrice DECIMAL(10, 2),
        deliveryStatus TEXT CHECK(deliveryStatus IN ('Pending', 'Confirmed')),
        FOREIGN KEY(userID) REFERENCES Users(userID),
        FOREIGN KEY(supplierID) REFERENCES Suppliers(supplierID)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS OrderDetails (
        orderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
        orderID INTEGER,
        productID INTEGER,
        productName VARCHAR(255),
        productDescription TEXT,
        quantity INTEGER,
        price DECIMAL(10, 2),
        FOREIGN KEY(orderID) REFERENCES Orders(orderID),
        FOREIGN KEY(productID) REFERENCES Products(productID)
      );
    `, callback);  // Call the callback after the last table is created
  });
}

/* Insert defauls user and supplier when the database is deleted or reset for system testing used */
// Insert the default user
function insertDefaultUser(db) {
  const query = `INSERT INTO Users (email, password, userType, companyName, companyAddress) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = ?)`;
  db.run(query, ['user@example.com', '$2a$10$ShbcPtmnE3iIdKk6.s.5fuZK/N.9d771zgG8n8U6G7CVCAJePRoaq', 'User', 'Apple Furniture Manufacturing', '123, Jln Apple, 82000, Pontian, Johor', 'user@example.com'], function(err) {
    if (err) {
      console.error('Error inserting default user:', err);
    } else if (this.changes === 0) {
      console.log('Default user already exists');
    } else {
      console.log('Default user inserted successfully');
    }
  });
}

// Insert the default supplier
function insertDefaultSupplier(db) {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;", function(err) {
            if (err) {
                console.error('Error starting transaction:', err);
                return;
            }

            const userQuery = `
                INSERT INTO Users (email, password, userType, companyName, companyAddress)
                SELECT ?, ?, ?, ?, ?
                WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = ?);
            `;

            db.run(userQuery, ['supplier@example.com', '$2a$10$w.2FpdjWpIvk7avUSLuvKey8rC40JBBmZEPFHZpEeXLLfCN3V7vI2', 'Supplier', 'Best Wood Supplier', '456, Jln Supplier, 82000, Pontian, Johor', 'supplier@example.com'], function(err) {
                if (err) {
                    console.error('Error inserting default supplier:', err);
                    db.run("ROLLBACK;", function(rollbackErr) {
                        if (rollbackErr) console.error('Error during rollback:', rollbackErr);
                    });
                    return;
                }

                if (this.changes === 0) {
                    console.log('Default supplier already exists');
                    db.run("COMMIT;");
                    return;
                }

                console.log('Default supplier inserted successfully');
                const userID = this.lastID;

                
                const supplierQuery = `
                    INSERT INTO Suppliers (userID, supplierDescription)
                    SELECT ?, ?
                    WHERE NOT EXISTS (SELECT 1 FROM Suppliers WHERE userID = ?);
                `;

                db.run(supplierQuery, [userID, 'Supplier of high quality wood products', userID], function(err) {
                    if (err) {
                        console.error('Error inserting supplier details:', err);
                        db.run("ROLLBACK;");
                        return;
                    }

                    console.log('Supplier details inserted successfully');

                    const productQuery = `
                        INSERT INTO Products (supplierID, productName, productDescription, productPrice, productImage)
                        VALUES (?, ?, ?, ?, ?),
                               (?, ?, ?, ?, ?);
                    `;
                    db.run(productQuery, [
                      1, 'Oak Wood', 'High-quality oak wood for construction', 59.99, '',
                      1, 'Pine Wood', 'Sustainable pine wood', 39.99, ''
                    ], function(err) {
                        if (err) {
                            console.error('Error inserting products:', err);
                            db.run("ROLLBACK;");
                            return;
                        }
                        console.log('Products inserted successfully');
                        db.run("COMMIT;", function(commitErr) {
                            if (commitErr) {
                                console.error('Error committing transaction:', commitErr);
                                return;
                            }
                            console.log('Transaction committed successfully');
                        });
                    });
                });
            });
        });
    });
}

//default supplier password : supplierpassword
//default user password: adminpassword

module.exports = db;
