const accountModel = require('../models/account.model');
const userModel = require('../models/user.model'); 
const transactionModel = require('../models/transaction.model'); 
const ledgerModel = require('../models/ledger.model');          
const mongoose = require('mongoose');
const crypto = require('crypto');

const createAccountController = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Create the new user account
    const account = await accountModel.create({ user: userId });

    // --- 🚀 PORTFOLIO UPGRADE: $10,000 WELCOME BONUS ---
    try {
      // Find the system account to fund this new user
      // CHANGE THIS EMAIL to whatever your actual system user email is!
      const systemUser = await userModel.findOne({ email: 'systemuser45@gmail.com' }).select('+systemUser');      
      if (systemUser && systemUser.systemUser) {
        const systemAccount = await accountModel.findOne({ user: systemUser._id });

        if (systemAccount) {
          const session = await mongoose.startSession();
          session.startTransaction();

          const bonusAmount = 100;

          // Create the completed transaction
          const tx = (await transactionModel.create([{
            fromAccount: systemAccount._id,
            toAccount: account._id,
            amount: bonusAmount,
            status: 'COMPLETED',
            idempotencyKey: crypto.randomUUID() // Automatically generate unique key
          }], { session }))[0];

          // Debit the system account
          await ledgerModel.create([{
            account: systemAccount._id,
            amount: bonusAmount,
            type: 'DEBIT',
            transaction: tx._id
          }], { session });

          // Credit the new user's account
          await ledgerModel.create([{
            account: account._id,
            amount: bonusAmount,
            type: 'CREDIT',
            transaction: tx._id
          }], { session });

          await session.commitTransaction();
          session.endSession();
        }
      }
    } catch (bonusError) {
      console.error("Welcome bonus failed, but account was created:", bonusError);
    }
    // --- END WELCOME BONUS ---

    return res.status(201).json({ 
        message: "Account created successfully with $10,000 Welcome Bonus!", 
        account 
    });

  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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

/**
 * @description Close a user's bank account (Soft Delete)
 * @route DELETE /api/accounts/:accountId
 */
const closeAccountController = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user._id;

    const account = await accountModel.findOne({ _id: accountId, user: userId });

    if (!account) {
      return res.status(404).json({ message: "Account not found or unauthorized." });
    }

    // FIX 1: Check against uppercase "CLOSED"
    if (account.status === "CLOSED") {
      return res.status(400).json({ message: "This account is already closed." });
    }

    const balance = await account.getBalance();

    if (balance !== 0) {
      return res.status(400).json({ 
        message: `Cannot close account. Current balance is $${balance}. Please transfer all funds to reach a $0 balance before closing.` 
      });
    }

    // FIX 2: Set status to uppercase "CLOSED"
    account.status = "CLOSED";
    await account.save();

    return res.status(200).json({
      message: "Account successfully closed.",
      account
    });

  } catch (error) {
    console.error("Error closing account:", error);
    return res.status(500).json({ message: "Internal server error while closing account." });
  }
};

/**
 * @description Resolve an email address to an Active Account ID
 * @route GET /api/accounts/resolve/:email
 */
/**
 * @description Resolve an email address to ALL Active Account IDs
 * @route GET /api/accounts/resolve/:email
 */
const resolveAccountByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    // 1. Find the recipient user by email
    const recipient = await userModel.findOne({ email });
    if (!recipient) {
      return res.status(404).json({ message: "No user found with this email address." });
    }

    if (recipient._id.toString() === req.user._id.toString()) {
       return res.status(400).json({ message: "You cannot use email lookup for yourself. Select your account from the dropdown." });
    }

    // 2. FIX: Use .find() instead of .findOne() to get ALL active accounts
    const accounts = await accountModel.find({ user: recipient._id, status: "ACTIVE" });
    
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: "This user does not have any active bank accounts to receive funds." });
    }

    // 3. Extract just the IDs into an array
    const accountIds = accounts.map(acc => acc._id);

    // 4. Return the array of IDs to the frontend
    return res.status(200).json({
      accountIds: accountIds, // Sending an array now!
      name: recipient.name,
      email: recipient.email
    });

  } catch (error) {
    console.error("Error resolving account:", error);
    return res.status(500).json({ message: "Internal server error while verifying recipient." });
  }
};


module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    closeAccountController,
    resolveAccountByEmail

};


