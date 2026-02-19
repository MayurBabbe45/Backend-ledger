const express = require('express');
const authMiddleware = require('../middleware/auth.middleware').authMiddleware;
const accountController = require('../controllers/account.controller');


const router = express.Router();

// Create a new account
router.post('/', authMiddleware,accountController.createAccountController);

// Get all accounts for the logged-in user
router.get('/', authMiddleware, accountController.getUserAccountsController);

//Get balance for a specific account
router.get('/balance/:accountId', authMiddleware, accountController.getAccountBalanceController);

module.exports = router;
