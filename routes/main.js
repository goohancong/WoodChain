/* main.js */ 

const express = require('express'); // Importing the Express module
const router = express.Router(); // Creating a new router object
const mainController = require('../controllers/mainController'); // Importing the mainController to handle route logic
const isAuthenticated = require('../utils/authMiddleware'); // Importing the mainController to handle route logic


/**
 * @route GET /
 * @desc Render the Sign Up Page
 * @access Public
 */
router.get('/', (req, res) => {
    res.render('main');  
});


/**
 * @route GET /main
 * @desc Render the main （Sign Up） page with user session datas 
 * @access Public
 */
router.get('/main', (req, res) => {
    res.render('main', { user: req.session.user });
});


/**
 * @route POST /signup
 * @desc Handle user signup
 * @access Public
 */
router.post('/signup', mainController.signup);


/**
 * @route POST /login
 * @desc Handle user login
 * @access Public
 */
router.post('/login', mainController.login);


/**
 * @route GET /login
 * @desc Show the Log In page
 * @access Public
 */
router.get('/login', mainController.showLogin);


/**
 * @route POST /logout
 * @desc Log out the user by destroying the session and clearing the cookie
 * @access Private
 */
router.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Failed to destroy the session during logout.', err);
            return res.status(500).send("Could not log out, please try again.");
        }
        res.clearCookie('connect.sid'); 
        res.redirect('/login');
    });
});


/**
 * @route POST /user/uploadProfilePhoto
 * @desc Handle profile photo upload
 * @access Private
 */
router.post('/user/uploadProfilePhoto', isAuthenticated, mainController.uploadProfilePhoto);


/**
 * @route GET /orderdetails/:orderID
 * @desc Show details of a specific order
 * @access Private
 */
router.get('/orderdetails/:orderID', isAuthenticated, mainController.showOrderDetails);


/**
 * @route GET /orderdetails/unconfirmed/:orderID
 * @desc Show unconfirmed details of a specific order
 * @access Public
 */
router.get('/orderdetails/unconfirmed/:orderID', mainController.showUnconfirmedOrderDetails);


module.exports = router; // Exporting the router to be used in other parts of the application
