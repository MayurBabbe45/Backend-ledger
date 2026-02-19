const { Router } = require('express');
const {
  authMiddleware,
  authSystemUserMiddleware
} = require('../middleware/auth.middleware');

const transactionController = require('../controllers/transaction.controller');

const transactionRoutes = Router();

// Create a new transaction
transactionRoutes.post('/',authMiddleware,transactionController.createTransactionController);

// Route to create initial funds
transactionRoutes.post('/system/initial-funds',authSystemUserMiddleware,transactionController.createInitialFundsController);

module.exports = transactionRoutes;
