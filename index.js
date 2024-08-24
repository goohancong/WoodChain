/**
* index.js
* This is main app entry point
*/

//Import necessary Modules
const express = require('express'); // Import the Express module for building web applications
const app = express(); // Initialize an Express application
const path = require('path'); // Import the 'path' module for handling and transforming file paths
var bodyParser = require('body-parser') ; // Import the 'body-parser' middleware for parsing incoming request bodies
const session = require ('express-session'); // Import the 'express-session' middleware for managing user sessions
const Web3 = require('web3'); // Import the 'Web3' library for interacting with the Ethereum blockchain

//Set up session
app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Set view engine to EJS
app.set('view engine', 'ejs');

// Middleware for parsing incoming requests (Body Parser Middleware)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Set static folder location using path.join function
app.use(express.static(path.join(__dirname + '/public')));

// Exposes node_modules for client-side use of npm packages (Bootstrap) 
app.use('/node_modules', express.static(__dirname + '/node_modules/'));

// Import database setup
const db = require('./utils/database');

// Define Routes
const mainRoutes = require('./routes/main');
app.use('/', mainRoutes);

//Define User Routes
/*
All the routes defined in userRoutes file 
will be prefixed with /user.
*/
const userRoutes = require('./routes/userRoutes'); 
app.use('/user', userRoutes);

//Define Supplier Routes
/*
All the routes defined in userRoutes file 
will be prefixed with /supplier.
*/
const supplierRoutes = require('./routes/supplierRoutes');  
app.use('/supplier', supplierRoutes);


// Start the server on the specified port 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


