 /* userRoutes.js */

const express = require('express'); // Importing the Express module
const router = express.Router(); // Creating a new router object
const isAuthenticated = require('../utils/authMiddleware'); // Importing the authentication middleware to protect routes

const userController = require('../controllers/userController'); // Importing the userController to handle route logic
 
// Optionally using a sub-router for main if needed elsewhere
const mainRouter = require('./main');
router.use('/main', isAuthenticated, mainRouter);


/**
 * @route GET /userhome
 * @desc Show user home page
 * @access Private (User only)
 */
router.get('/userhome', isAuthenticated, (req, res, next) => {
    if (!req.session.user || req.session.user.type !== 'User') {
        return res.redirect('/login');
    }
    // If the session user is of type 'User', continue to the next middleware, which is the userController's showUserHome function
    next(); // Pass control to the next middleware function, which is userController.showSupplierHome
}, userController.showUserHome);


/**
 * @route POST /searchSuppliers
 * @desc Search for suppliers by name
 * @access Private (User only)
 */
router.post('/searchSuppliers', isAuthenticated, userController.searchSuppliers);


/**
 * @route GET /selectproduct/:supplierID?
 * @desc Show select product page with an optional supplier ID
 * @access Private (User only)
 */
router.get('/selectproduct/:supplierID?', isAuthenticated, (req, res, next) => { 
    next();
}, userController.showSelectProduct);


/**
 * @route GET /placeorder
 * @desc Show place order page
 * @access Private (User only)
 */
router.get('/placeorder', isAuthenticated, userController.placeOrder);


/**
 * @route POST /placeorder
 * @desc Record an order
 * @access Private (User only)
 */
router.post('/placeorder', isAuthenticated, userController.recordOrder);


/**
 * @route POST /placeorder
 * @desc Record an order
 * @access Private (User only)
 */
router.get('/manageorder', isAuthenticated, userController.showManageOrderPage);


/**
 * @route GET /searchOrders
 * @desc Search for orders by customer name
 * @access Private (User only)
 */
router.get('/searchOrders', isAuthenticated, userController.searchOrders);


module.exports = router; // Exporting the router to be used in other parts of the application
