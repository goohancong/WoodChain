/* utils/authMiddleware.js */

// Middleware function to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next(); // Session exists, continue to the next function in the middleware stack
    }
    req.session.message = "Please login first";  // Set a message in session
    res.redirect('/login');
}


module.exports = isAuthenticated; // Exporting the authentication middleware to be used in other parts of the application


