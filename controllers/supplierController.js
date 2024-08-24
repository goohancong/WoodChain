/* supplierController.js */

const supplierModels = require('../models/supplierModels'); // Importing supplierModels for database operations related to suppliers
const path = require('path'); // Importing path for handling and transforming file paths
const multer = require ('multer') //Sets up Multer for handling product photo uploads
const blockchain = require('../utils/blockchain'); // Importing blockchain utility functions for handling blockchain interactions

/**
 * @desc Configures storage settings for Multer
 * - Sets destination folder for profile photos
 * - Sets a unique filename using the current timestamp
 */
const storage = multer.diskStorage({
    destination: './public/uploads/productphoto/',
    filename: function(req, file, cb) {
      cb(null, 'product-' + Date.now() + path.extname(file.originalname)); 
    }
  });
  
/**
 * @desc Configures Multer middleware for file upload
 * - Uses the specified storage configuration
 * - Filters files to allow only JPEG, JPG, and PNG formats
 */
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  }).single('productPhoto');
  
  /**
 * @desc Checks the file type to ensure it is a valid image format (JPEG, JPG, PNG)
 * @param {Object} file - The file to be uploaded
 * @param {Function} cb - Callback function to indicate if the file type is valid
 */
function checkFileType(file, cb) { 
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only JPEG, JPG, and PNG files are allowed!');
    }
  }


/**
 * @desc Renders the supplier home page with the supplier's products and description
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.supplierID - The ID of the supplier
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching products or supplier description
 */
exports.showSupplierHome = async (req, res) => {
    try {
        const supplierID = req.session.user.supplierID;  
        const products = await supplierModels.getSupplierProducts(supplierID);
        const description = await supplierModels.getSupplierDescription(supplierID);

        console.log('All products retrieved successfully.'); 
        res.render('supplier/supplierhome', { 
            user: req.session.user, 
            products, 
            description, 
            searchQuery: '' // Add default empty search query
        });
    } catch (error) {
        console.error('Failed to fetch products:', error);
        res.status(500).send('Failed to load products. Error: ' + error.message);
    }
};


/**
 * @desc Updates the description of a supplier
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.supplierID - The ID of the supplier
 * @param {Object} req.body - Request body containing the new description
 * @param {string} req.body.company_description - The new description of the supplier's company
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue updating the supplier's description
 */
exports.updateSupplierDescription = async (req, res) => {
    const supplierID = req.session.user.supplierID; 
    const { company_description } = req.body;

    try {
        const result = await supplierModels.updateSupplierDescription(supplierID, company_description);
        if (result > 0) {
            console.log("Description updated successfully!");
            res.redirect('/supplier/supplierhome');
        } else {
            res.status(404).send("Supplier not found");
        }
    } catch (error) {
        console.error('Failed to update description:', error);
        res.status(500).send('Failed to update description. Error: ' + error.message);
    }
};


/**
 * @desc Searches for products by name for a specific supplier and renders the supplier home page with the search results
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.supplierID - The ID of the supplier
 * @param {Object} req.body - Request body containing the search query
 * @param {string} req.body.searchQuery - The search query used to find products by name
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue searching for products
 */
exports.searchProducts = async (req, res) => {
    try {
        const supplierID = req.session.user.supplierID;
        const { searchQuery } = req.body;
        const products = await supplierModels.getProductsByName(supplierID, searchQuery);
        const description = await supplierModels.getSupplierDescription(supplierID);

        console.log('All searched products retrieved successfully.'); 
        res.render('supplier/supplierhome', { 
            user: req.session.user, 
            products, 
            description: description || '', // Add default empty description
            searchQuery // Pass the search query back to the template
        });
    } catch (error) {
        console.error('Failed to search products:', error);
        res.status(500).send('Failed to search products. Error: ' + error.message);
    }
};


  /**
 * @desc Adds a new product for the supplier and redirects to the supplier home page
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.supplierID - The ID of the supplier
 * @param {Object} req.body - Request body containing the product details
 * @param {string} req.body.product_name - The name of the product
 * @param {string} req.body.product_description - The description of the product
 * @param {number} req.body.product_price - The price of the product
 * @param {Object} req.file - File object containing the uploaded file data
 * @param {string} req.file.filename - The filename of the uploaded product image
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue adding the product
 */
exports.addProduct = async (req, res) => {
    const supplierID = req.session.user.supplierID;
    const { product_name, product_description, product_price } = req.body;

    let productImage = ''; // Default image if none uploaded

    // Check if req.file is defined and if a file was uploaded
    if (req.file && req.file.filename) {
        productImage = req.file.filename; // Set productImage to uploaded filename
    }

    try {
        const productID = await supplierModels.addProduct(supplierID, product_name, product_description, product_price, productImage);
        console.log('Product added with ID:', productID);
        res.redirect('/supplier/supplierhome'); 
    } catch (error) {
        console.error('Failed to add product:', error);
        res.status(500).send('Failed to add product. Error: ' + error.message);
    }
};


/**
 * @desc Updates an existing product for the supplier and redirects to the supplier home page
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing the product details
 * @param {number} req.body.product_id - The ID of the product to update
 * @param {string} req.body.product_name - The new name of the product
 * @param {string} req.body.product_description - The new description of the product
 * @param {number} req.body.product_price - The new price of the product
 * @param {Object} req.file - File object containing the uploaded file data (if any)
 * @param {string} req.file.filename - The filename of the uploaded product image (if any)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue updating the product
 */
exports.updateProduct = async (req, res) => {
  const { product_id, product_name, product_description, product_price } = req.body;
  let productImage; // Initialize without setting a default

  // Check if a new file is uploaded
  if (req.file) {
    productImage = req.file.filename; // Only set if new image is uploaded
  }

  try {
      // Update product without changing the image if no new image is provided
      const result = await supplierModels.updateProduct(product_id, product_name, product_description, product_price, productImage);
      if (result > 0) {
          console.log('Update successful for product ID:', product_id);
          res.redirect('/supplier/supplierhome');
      } else {
          console.log('No product found to update for product ID:', product_id);
          res.status(404).send("Product not found");
      }
  } catch (error) {
      console.error('Failed to update product:', error);
      res.status(500).send('Failed to update product. Error: ' + error.message);
  }
};


/**
 * @desc Soft deletes a product by setting its isActive status to 2 and redirects to the supplier home page
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing the product ID
 * @param {number} req.body.product_id - The ID of the product to delete
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue deleting the product
 */
exports.deleteProduct = async (req, res) => {
  const { product_id } = req.body;

  try {
      const result = await supplierModels.deleteProduct(product_id);
      if (result > 0) {
          console.log('Delete successful for product ID:', product_id);
          res.redirect('/supplier/supplierhome');
      } else {
          console.log('No product found to delete for product ID:', product_id);
          res.status(404).send("Product not found");
      }
  } catch (error) {
      console.error('Failed to delete product:', error);
      res.status(500).send('Failed to delete product. Error: ' + error.message);
  }
};


/**
 * @desc Renders the supplier manage order page to show associated orders with the specific supplier
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.supplierID - The ID of the supplier
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching orders or supplier description from the database
 */
exports.showSupplierOrders = async (req, res) => {
    try {
        const supplierID = req.session.user.supplierID;
        const orders = await supplierModels.getOrdersBySupplierID(supplierID);
        const description = await supplierModels.getSupplierDescription(supplierID);
        res.render('supplier/supplierorder', { 
            user: req.session.user, 
            orders: orders, 
            description: description || '', // Add default empty description
            searchQuery: '' // Add default empty search query
        });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        res.status(500).send('Failed to load orders. Error: ' + error.message);
    }
};


/**
 * @desc Searches for orders by customer name for a specific supplier and renders the supplier orders page with the search results
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {number} req.session.user.supplierID - The ID of the supplier
 * @param {Object} req.body - Request body containing the search query
 * @param {string} req.body.searchQuery - The search query used to find orders by customer name
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue searching for orders
 */
exports.searchOrders = async (req, res) => {
    try {
        const supplierID = req.session.user.supplierID;
        const { searchQuery } = req.body;
        const orders = await supplierModels.getOrdersByCustomerName(supplierID, searchQuery);
        const description = await supplierModels.getSupplierDescription(supplierID);

        console.log('All searched orders retrieved successfully.'); 
        res.render('supplier/supplierorder', { 
            user: req.session.user, 
            orders, 
            searchQuery, // Pass the search query back to the template
            description: description || '' // Pass the description to the template
        });
    } catch (error) {
        console.error('Failed to search orders:', error);
        res.status(500).send('Failed to search orders. Error: ' + error.message);
    }
};


/**
 * @desc Update order status in the database, and then interacts with the blockchain to record order status
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {Object} req.body - Request body containing order details
 * @param {number} req.body.orderID - The ID of the order to be updated
 * @param {string} req.body.status - The new status of the order
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue updating the order status in the database or on the blockchain
 */
exports.updateOrderStatus = async (req, res) => {
    if (!req.session.user) {
        return res.status(403).send("No user session found, please login.");
    }

    const { orderID, status } = req.body;

    try {
        // Get user's Ethereum account
        const accounts = await blockchain.web3.eth.getAccounts();
        const userAddress = accounts[0];  // Assumes the first account is the user's Ethereum address

        if (!orderID || !status) {
            console.error('Missing parameters for updating order status');
            return res.status(400).json({ success: false, message: "Invalid request parameters" });
        }

        // Update order status in the database
        const changes = await supplierModels.updateOrderStatus(orderID, status);
        

        if (changes > 0) {
            // Update order status on the blockchain
            await blockchain.updateOrderStatus({ orderID, status, userID: userAddress });

            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "Order not found or already confirmed" });
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Server error updating status", error: error.toString() });
    }
};


exports.upload = upload;