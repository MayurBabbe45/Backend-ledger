const accountModel = require('../models/account.model');


async function createAccountController(req, res) {
    const user = req.user; // Get authenticated user from request

    const account = await accountModel.create({
        user: user._id,
    });

    res.status(201).json({
        message: 'Account created successfully',
        status: 'success',
        data: account
    });

}

async function getUserAccountsController(req, res) {
    const user = req.user; // Get authenticated user from request

    const accounts = await accountModel.find({
        user: user._id
    });

    res.status(200).json({
        message: 'Accounts retrieved successfully',
        status: 'success',
        data: accounts
    });

}

async function getAccountBalanceController(req, res) {
    const user = req.user; // Get authenticated user from request
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: user._id
    });

    if (!account) {
        return res.status(404).json({
            message: 'Account not found',
            status: 'failed'
        });
    }

    const balance = await account.getBalance();

    res.status(200).json({
        message: 'Balance retrieved successfully',
        status: 'success',
        accountId: account._id,
        balance: balance
    });

}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
};


