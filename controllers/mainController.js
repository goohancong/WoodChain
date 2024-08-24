/* mainController.js */

const mainModels = require('../models/mainModels'); // Importing the mainModels object that includes all the functions
const bcrypt = require('bcrypt'); // Importing bcrypt for password hashing
const path = require('path'); // Importing path for handling and transforming file paths
const multer = require ('multer'); //Sets up Multer for handling profile photo uploads
const puppeteer = require('puppeteer');  // Importing Puppeteer for generating PDFs from HTML content

/**
 * @desc Configures storage settings for Multer
 * - Sets destination folder for profile photos
 * - Sets a unique filename using the current timestamp
 */
const storage = multer.diskStorage({
    destination: './public/uploads/profilephoto/',
    filename: function(req, file, cb) {
      cb(null, 'profile-' + Date.now() + path.extname(file.originalname)); 
    }
  });
  
/**
   * @desc Configures Multer middleware for file upload
   * - Uses the specified storage configuration
   * - Filters files to allow only JPEG, JPG, and PNG formats
   */
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000000 }, 
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
}).single('profilePhoto');

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
 * @desc Handles user signup process
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user details
 * @param {string} req.body.userType - Type of user (User or Supplier)
 * @param {string} req.body.companyAddress - Address of the user's company
 * @param {string} req.body.companyName - Name of the user's company
 * @param {string} req.body.email - Email of the user
 * @param {string} req.body.password - Password of the user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue during the signup process
 */
exports.signup = async (req, res) => {
    // Log the request body for debugging purposes
    console.log(req.body);

    const { userType, companyAddress, companyName, email, password } = req.body;

    if (!userType || userType === 'Please Select User Type') {
        return res.status(400).render('main', { message: 'Please select a user type before signing up.' });
    }

    try {
        // Check if user already exists
        const existingUser = await mainModels.findByEmail(email); // Using mainModels to access findByEmail
        if (existingUser) {
            return res.status(400).render('main', { message: 'User already exists with the provided email.' });
        }

        // Hash password for security purpose
        const hashedPassword = await bcrypt.hash(password, 10);

        if (userType === 'Supplier') {
            // Handle supplier record
            const newSupplier = await mainModels.createSupplier({ // Using mainModels to access createSupplier
                userType,
                companyAddress,
                companyName,
                email,
                password: hashedPassword,
                description: 'Supplier Description' //Default description
            });
             // Redirect to login page with a success message
            res.redirect('/login?success=true');
        } else {
            // Handle regular user signup
            const newUser = await mainModels.create({ // Using mainModels to access create
                userType,
                companyAddress,
                companyName,
                email,
                password: hashedPassword,
            });
           // Redirect to login page with a success message
            res.redirect('/login?success=true');
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).render('main', { message: 'Error during signup' });
    }
};


/**
 * @desc Handles user login process
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user credentials
 * @param {string} req.body.email - Email of the user
 * @param {string} req.body.password - Password of the user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue during the login process
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await mainModels.findByEmail(email);
        if (!user) {
            return res.status(401).render('login', { message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).render('login', { message: 'Invalid email or password' });
        }

        if (user.userType === 'Supplier' && user.supplierID) {
          req.session.user = {
            supplierID: user.supplierID,  // Include supplierID in the session for suppliers
              id: user.userID, 
              type: user.userType,
              profilePhoto: user.profilePhoto,
              companyName: user.companyName,
              companyAddress:user.companyAddress,
             
          };
      } else {
          req.session.user = {
              id: user.userID, 
              type: user.userType,
              profilePhoto: user.profilePhoto,
              companyName: user.companyName,
              companyAddress:user.companyAddress,
          };
      }

        // Redirect based on user type
        if (user.userType === 'Supplier') {
            res.redirect('/supplier/supplierhome');
            // console.log(req.session.user, "Welcome back"); For debug used
        } else {
            res.redirect('/user/userhome');
            // console.log(req.session.user, "Welcome back"); For debug used
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', { message: 'Error logging in' });
    }
};


/**
 * @desc Renders the login page, retrieving and clearing any session message
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing session data
 * @param {string} req.session.message - Message stored in the session
 * @param {Object} res - Express response object
 */
exports.showLogin = (req, res) => {
    const message = req.session.message; // Retrieve the message from the session
    req.session.message = null; // Clear the message from the session after it's been retrieved
    res.render('login', { message: message }); // Pass the message to the view
};


/**
 * @desc Handles the profile photo upload for a user
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {Object} res - Express response object
 * @throws {Error} - Throws an error if there is an issue during the signup process
 */
exports.uploadProfilePhoto = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error("Upload Error:", err);
            return res.status(400).json({ success: false, message: 'Upload failed: ' + err });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file selected!' });
        }
        const imagePath = `/uploads/profilephoto/${req.file.filename}`;
        mainModels.updateProfilePhoto(req.session.user.id, imagePath)
          .then(() => {
            // Update the session with the new image path
            req.session.user.profilePhoto = imagePath;
            // Save the session before responding
            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ success: false, message: 'Session save error.' });
                }
                res.json({ success: true, imagePath: imagePath });
            });
          })
          .catch(err => {
            console.error("Database update failed:", err);
            res.status(500).json({ success: false, message: 'Database update failed: ' + err.message });
          });
    });
};


/**
 * @desc * Renders the order details for specific orders and generates PDF with the order details as an invoice
 * @param {Object} req - Express request object
 * @param {Object} req.params - Parameters from the request URL
 * @param {number} req.params.orderID - The ID of the order to be displayed
 * @param {Object} req.session - Session object containing user session data
 * @param {Object} req.session.user - The current logged-in user's session data
 * @param {string} req.session.user.type - The type of the logged-in user (User or Supplier)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching the order details or generating the PDF
 */
exports.showOrderDetails = async (req, res) => {
    try {
        const orderID = req.params.orderID;
        const orderDetails = await mainModels.getOrderDetailsById(orderID);
        const products = await mainModels.getOrderProducts(orderID);
        let grandTotal = 0;

        products.forEach(product => {
            grandTotal += product.totalPrice;
        });
        if (orderDetails.deliveryStatus !== 'Confirmed') {
          // Check the user type
          if (req.session.user.type === 'Supplier') {
              // If the user is a supplier, redirect to the supplier order page
              return res.redirect('/supplier/supplierorder');
          } else {
              // If the user is not a supplier, redirect to the manage order page
              return res.redirect('/user/manageorder');
          }
      }

       // Render HTML using EJS template
          res.render('orderdetails', {
              order: orderDetails, 
              products: products, 
              grandTotal: grandTotal
          }, async (err, html) => {
              if (err) {
                  console.error('Render error:', err);
                  return res.status(500).send("Error rendering page.");
              }

              const browser = await puppeteer.launch({
                  headless: true, // Using headless for production
                  args: ['--no-sandbox', '--disable-setuid-sandbox'] // These arguments help with running Chrome in certain environments
              });
              
              try {
                  const page = await browser.newPage();
                  await page.setContent(html, { waitUntil: 'networkidle0' });
                  const pdf = await page.pdf({ format: 'A4' });
                  res.contentType('application/pdf');
                  res.send(pdf);
              } catch (pdfError) {
                  console.error('PDF generation error:', pdfError);
                  res.status(500).send("Failed to generate PDF.");
              } finally {
                  await browser.close();
              }
          });


          } catch (error) {
              console.error('Failed to fetch order details:', error);
              res.status(500).render('error', { message: 'Failed to load order details.' });
          }
      };


/**
 * @desc Renders the order details of an unconfirmed order from the database and returns them as a JSON response
 * @param {Object} req - Express request object
 * @param {Object} req.params - Parameters from the request URL
 * @param {number} req.params.orderID - The ID of the order to be displayed
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if there is an issue fetching the order details or products
 */
exports.showUnconfirmedOrderDetails = async (req, res) => {
  try {
    const orderID = req.params.orderID;// Get the order ID from the request parameters
    const orderDetails = await mainModels.getOrderDetailsById(orderID);
    const products = await mainModels.getOrderProducts(orderID)

    orderDetails.products = products;

    res.json(orderDetails);
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    res.status(500).json({ message: 'Failed to load order details.' });
  }
};