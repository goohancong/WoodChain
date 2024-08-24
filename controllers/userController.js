/* userController.js */

const userModels = require('../models/userModels'); // Importing userModels for database operations related to suppliers
const blockchain = require('../utils/blockchain'); // Importing blockchain utility functions for handling blockchain interactions

/**
 * @desc Renders the user home page with a list of all suppliers
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching suppliers
 */
exports.showUserHome = async (req, res) => {
    try {
        const suppliers = await userModels.getAllSuppliers();

        // console.log('Suppliers:', suppliers); // Debug output to confirm data fetching
        console.log('All suppliers retrieved successfully.'); 
        res.render('user/userhome', { 
            user: req.session.user, 
            suppliers, 
            searchQuery: '' //Add default empty search query
        });
    } catch (error) {
        console.error('Failed to fetch suppliers:', error);
        res.status(500).render('error', { message: 'Failed to load suppliers.' });
    }
};


/**
 * @desc Searches for suppliers by name and renders the user home page with the search results
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {Object} req.body - Request body containing the search query
 * @param {string} req.body.searchQuery - The search query used to find suppliers by name
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue searching for suppliers
 */
exports.searchSuppliers = async (req, res) => {
    try {
        const { searchQuery } = req.body;
        const suppliers = await userModels.searchSuppliersByName(searchQuery);

        console.log('All searched suppliers retrieved successfully.'); 
        res.render('user/userhome', { 
            user: req.session.user, 
            suppliers,
            searchQuery // Pass the search query back to the template
        });
    } catch (error) {
        console.error('Failed to search suppliers:', error);
        res.status(500).render('error', { message: 'Failed to search suppliers.' });
    }
};


/**
 * @desc Fetches a supplier and its products by supplier ID for user for selecting product
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters containing the supplier ID
 * @param {number} req.params.supplierID - The ID of the supplier to fetch
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching the supplier or products
 */
exports.showSelectProduct = async (req, res) => {
    
    try {
        const supplierId = req.params.supplierID;
        const supplier = await userModels.getSupplierById(supplierId);
        const products = await userModels.getProductsBySupplierId(supplierId);
        
        // console.log(suppliers); // Debug output to confirm data fetching
        console.log("Fetching supplier and its products with supplier ID:", supplierId);
        res.render('user/selectproduct', {
            user: req.session.user,
            supplier: supplier,
            products: products,
        });
    } catch (error) {
        console.error('Failed to fetch supplier or products:', error);
        res.status(500).render('error', { message: 'Failed to load supplier details and products.' });
    }
};


/**
 * @desc Processes the order placement by enriching the order details with product information and rendering the order confirmation page
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters containing order details and supplier ID
 * @param {string} req.query.orderDetails - The encoded order details
 * @param {number} req.query.supplierID - The ID of the supplier
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching the product or supplier details
 */
exports.placeOrder = async (req, res) => {
    const orderDetailsEncoded = req.query.orderDetails || "{}";
    const orderDetails = JSON.parse(decodeURIComponent(orderDetailsEncoded));
    const supplierID = req.query.supplierID; // Get supplier ID from query parameters
    const currentDate = new Date().toISOString().slice(0, 10); // Get the current date in YYYY-MM-DD format

    try {
        const supplier = await userModels.getSupplierById(supplierID); // Fetch supplier details
        const enrichedOrderDetails = await Promise.all(
            Object.entries(orderDetails).map(async ([productId, quantity]) => {
                const product = await userModels.fetchProductDetails(productId);
                if (product) {
                    return {
                        ...product,
                        quantity: quantity,
                        totalPrice: product.productPrice * quantity
                    };
                } else {
                    return { productId, name: "Product not found", price: 0, quantity };
                }
            })
        );

        res.render('user/placeorder', {
            currentDate: currentDate,
            orderDetails: enrichedOrderDetails,
            user: req.session.user,
            supplier: supplier // Pass the supplier details to the template
        });
    } catch (error) {
        console.error('Failed to fetch product or supplier details:', error);
        res.status(500).send("Error fetching product or supplier details.");
    }
};


/**
 * @desc Records an order by creating order and order detail entries in the database, and then interacts with the blockchain to place the order
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.id - The ID of the current user
 * @param {Object} req.body - Request body containing the order details
 * @param {number} req.body.supplierID - The ID of the supplier
 * @param {string} req.body.orderDetails - JSON stringified order details
 * @param {string} req.body.grandTotal - The total price of the order
 * @param {string} req.body.deliveryDate - The delivery date of the order
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue recording the order
 */
exports.recordOrder = async (req, res) => {
    if (!req.session.user) {
        return res.status(403).send("No user session found, please login.");
    }

    const userID = req.session.user.id;
    const { supplierID, orderDetails, grandTotal, deliveryDate } = req.body;
    const currentDate = new Date().toISOString().slice(0, 10);

    try {
        const parsedOrderDetails = JSON.parse(orderDetails);
        const orderID = await userModels.createOrder({
            userID,
            supplierID,
            date: currentDate,
            deliveryDate,
            totalPrice: parseFloat(grandTotal)
        });

        await Promise.all(parsedOrderDetails.map(item =>
            userModels.createOrderDetail({
                orderID,
                productID: item.productID,
                productName: item.productName,
                productDescription: item.productDescription,
                quantity: item.quantity,
                price: item.productPrice
            })
        ));

        // Get user's Ethereum account
        const accounts = await blockchain.web3.eth.getAccounts();

        await blockchain.placeOrder({
            userID: accounts[0],  
            supplierID,
            deliveryDate,
            totalPrice: parseFloat(grandTotal),
            orderDetails: parsedOrderDetails.map(item => ({
                orderID,
                productID: item.productID,
                productName: item.productName,
                productDescription: item.productDescription,
                quantity: item.quantity,
                price: parseFloat(item.productPrice)
            }))
        });

        res.redirect('/user/manageorder?orderPlaced=true');
    } catch (error) {
        console.error('Failed to record order:', error);
        res.status(500).send("Failed to process order.");
    }
};


/**
 * @desc Retrieves the orders associated with a specific supplier from the database
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.id - The ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching the user's orders from the database
 */
exports.showManageOrderPage = async (req, res) => {
    try {
        const orders = await userModels.getOrdersByUserID(req.session.user.id);
        res.render('user/manageorder', {  
            user: req.session.user,
            orders: orders 
        });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        res.status(500).render('error', { message: 'Failed to load orders.' });
    }
};


/**
 * @desc Searches for orders by supplier name and renders the manage orders page with the search results
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.id - The ID of the current user
 * @param {Object} req.query - Query parameters from the request URL
 * @param {string} req.query.searchQuery - The search query used to find orders by supplier name
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue searching for orders
 */
exports.searchOrders = async (req, res) => {
    const { searchQuery } = req.query;
    const userID = req.session.user.id;

    try {
        const orders = await userModels.searchOrdersBySupplierName(userID, searchQuery);

        console.log('All searched orders retrieved successfully.'); 
        res.render('user/manageorder', { 
            user: req.session.user,
            orders 
        });
    } catch (error) {
        console.error('Failed to search orders:', error);
        res.status(500).render('error', { message: 'Failed to search orders.' });
    }
};
