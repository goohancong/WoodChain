/* 1_initial_migration.js */

const Migrations = artifacts.require("Migrations"); // Importing the Migrations contract artifact

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};

