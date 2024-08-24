/* blockchain.js */

const Web3 = require('web3');
const contract = require('@truffle/contract');
const orderChainArtifact = require('../build/contracts/OrderChain.json');

const options = {
    timeout: 30000, // ms
    clientConfig: {
        maxReceivedFrameSize: 100000000,   // bytes
        maxReceivedMessageSize: 100000000, // bytes
    },
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false
    }
};

// Initialize Web3 provider and instance
const provider = new Web3.providers.HttpProvider('http://localhost:7545', options);
const web3 = new Web3(provider);
web3.eth.transactionPollingTimeout = 15000; // Set transaction polling interval to 15 seconds

// Set up the contract
const OrderChain = contract(orderChainArtifact);
OrderChain.setProvider(web3.currentProvider);

/**
 * @desc Initializes the contract by fetching the deployed network and contract instance.
 * @returns {Promise<Contract>} - The initialized contract instance.
 * @throws {Error} - Throws an error if the contract is not deployed on the current network.
 */
async function initializeContract() {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = orderChainArtifact.networks[networkId];
    if (!deployedNetwork) {
        throw new Error('Contract not deployed on the current network');
    }
    return new web3.eth.Contract(
        orderChainArtifact.abi,
        deployedNetwork.address,
    );
}

const initializedContract = initializeContract();

module.exports = {
    web3, // Export web3 instance

    /**
     * @desc Places an order on the blockchain.
     * @param {Object} orderData - The order data to be placed.
     * @param {string} orderData.userID - The Ethereum address of the user placing the order.
     * @param {string} orderData.supplierID - The ID of the supplier.
     * @param {string} orderData.deliveryDate - The delivery date of the order.
     * @param {number} orderData.totalPrice - The total price of the order.
     * @param {Array<Object>} orderData.orderDetails - The details of the order, including products.
     * @returns {Promise<void>}
     * @throws {Error} - Throws an error if there is an issue placing the order on the blockchain.
     */
    placeOrder: async ({ userID, supplierID, deliveryDate, totalPrice, orderDetails }) => {
        try {
            const deliveryDateTimestamp = Math.floor(new Date(deliveryDate).getTime() / 1000);
            const accounts = await web3.eth.getAccounts();
            const instance = await initializedContract;

            const totalPriceCents = Math.round(totalPrice * 100);
            const formattedOrderDetails = orderDetails.map(detail => ({
                orderID: detail.orderID,
                productID: detail.productID,
                productName: detail.productName,
                productDescription: detail.productDescription,
                quantity: detail.quantity,
                price: Math.round(detail.price * 100) // Convert price to cents
            }));

            console.log("Placing order with details:", {
                userID,
                supplierID,
                deliveryDateTimestamp,
                totalPriceCents,
                formattedOrderDetails
            });

            await instance.methods.placeOrder(
                supplierID,
                deliveryDateTimestamp,
                totalPriceCents,
                formattedOrderDetails
            ).send({ from: userID, gas: 8000000 });
        } catch (error) {
            console.error('Error placing order on blockchain:', error);
            throw error;
        }
    },

     /**
     * @desc Updates the status of an order on the blockchain.
     * @param {Object} statusData - The data for updating the order status.
     * @param {string} statusData.orderID - The ID of the order to update.
     * @param {string} statusData.status - The new status of the order ('Confirmed' or 'Pending').
     * @param {string} statusData.userID - The Ethereum address of the user updating the status.
     * @returns {Promise<void>}
     * @throws {Error} - Throws an error if there is an issue updating the order status on the blockchain.
     */
    updateOrderStatus: async ({ orderID, status, userID }) => {
        try {
            console.log(`Updating blockchain order status: orderID=${orderID}, status=${status}, userID=${userID}`);
            if (!orderID || typeof status === 'undefined' || !userID) {
                throw new Error('Missing or invalid parameters');
            }
            const instance = await initializedContract;
            const statusEnum = status === 'Confirmed' ? 1 : 0;
            await instance.methods.updateOrderStatus(orderID, statusEnum).send({ from: userID, gas: 8000000 });
        } catch (error) {
            console.error('Error updating order status on blockchain:', error);
            throw error;
        }
    },

    
     /**
     * @desc Fetches an order from the blockchain by its ID.
     * @param {string} orderID - The ID of the order to fetch.
     * @returns {Promise<Object>} - The order details.
     * @throws {Error} - Throws an error if there is an issue fetching the order from the blockchain.
     */
    getOrder: async (orderID) => {
        try {
            const instance = await initializedContract;
            return await instance.methods.getOrder(orderID).call();
        } catch (error) {
            console.error('Error fetching order from blockchain:', error);
            throw error;
        }
    },


    /**
     * @desc Fetches the details of an order from the blockchain by its ID.
     * @param {string} orderID - The ID of the order to fetch details for.
     * @returns {Promise<Object>} - The order details.
     * @throws {Error} - Throws an error if there is an issue fetching the order details from the blockchain.
     */
    getOrderDetails: async (orderID) => {
        try {
            const instance = await initializedContract;
            return await instance.methods.getOrderDetails(orderID).call();
        } catch (error) {
            console.error('Error fetching order details from blockchain:', error);
            throw error;
        }
    }
};
