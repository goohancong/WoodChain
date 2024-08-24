/* 2_deploy_order_chain.js */

const OrderChain = artifacts.require("OrderChain"); // Importing the OrderChain contract artifact

module.exports = function(deployer) {
    deployer.deploy(OrderChain);
};

