/* supplierRoutes.js */

const express = require('express'); // Importing the Express module
const router = express.Router(); // Creating a new router object
const isAuthenticated = require('../utils/authMiddleware'); // Importing the authentication middleware to protect routes

const mainRouter = require('./main'); 
router.use('/main', isAuthenticated, mainRouter); // Using mainRouter with authentication middleware

const supplierController = require('../controllers/supplierController'); // Importing the supplierController to handle route logic

// Import upload middleware
const { upload } = supplierController;

/**
 * @route GET /supplierhome
 * @desc Show supplier home page with products
 * @access Private (Supplier only)
 */
router.get('/supplierhome', isAuthenticated, (req, res, next) => {
    if (!req.session.user || req.session.user.type !== 'Supplier') {
        return res.redirect('/login');
    }
    // If the user is authenticated and is a supplier, proceed to fetch supplier products
    next();  // Pass control to the next middleware function, which is supplierController.showSupplierHome
}, supplierController.showSupplierHome);


/**
 * @route POST /updateDescription
 * @desc Update supplier description
 * @access Private (Supplier only)
 */
router.post('/updateDescription', isAuthenticated, (req, res) => {
    if (!req.session.user || req.session.user.type !== 'Supplier') {
        return res.redirect('/login');
    }
    // Call the controller function to update the description
    supplierController.updateSupplierDescription(req, res);
});


/**
 * @route POST /searchProducts
 * @desc Search products by name
 * @access Private (Supplier only)
 */
router.post('/searchProducts', isAuthenticated, supplierController.searchProducts);


/**
 * @route POST /addProduct
 * @desc Add a new product
 * @access Private (Supplier only)
 */
router.post('/addProduct', isAuthenticated, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(500).render('supplier/supplierhome', { msg: err });
        } else {
            next(); 
        }
    });
}, supplierController.addProduct);


/**
 * @route POST /updateProduct
 * @desc Update an existing product
 * @access Private (Supplier only)
 */
router.post('/updateProduct', isAuthenticated, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            console.error('Upload Error:', err);
            res.status(500).render('supplier/supplierhome', { msg: err });
        } else {
            next();
        }
    });
}, supplierController.updateProduct);


/**
 * @route POST /deleteProduct
 * @desc Delete a product
 * @access Private (Supplier only)
 */
router.post('/deleteProduct', isAuthenticated, supplierController.deleteProduct);


/**
 * @route GET /supplierorder
 * @desc Show supplier orders
 * @access Private (Supplier only)
 */
router.get('/supplierorder', isAuthenticated, supplierController.showSupplierOrders);


/**
 * @route POST /searchOrders
 * @desc Search orders by customer name
 * @access Private (Supplier only)
 */
router.post('/searchOrders', isAuthenticated, supplierController.searchOrders);


/**
 * @route POST /updateOrderStatus
 * @desc Update the status of an order
 * @access Private (Supplier only)
 */
router.post('/updateOrderStatus', isAuthenticated, supplierController.updateOrderStatus);


module.exports = router; // Exporting the router to be used in other parts of the application

