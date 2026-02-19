const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');
const userModel = require('../models/user.model');
/**
 * Create a new transaction
 * The 10-step TRANSFER FLOW:
 * 1. Validate request 
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction with PENDING status
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction as COMPLETED
 * 9. Commit MongoDB Session
 * 10. Send notification emails to both parties
 */

async function createTransactionController(req, res) {
    // Validate request body
    const {fromAccount, toAccount, amount, idempotencyKey} = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: 'Missing required fields: fromAccount, toAccount, amount, idempotencyKey',
            status: 'failed',
        });
    }

    const fromUserAccount = await accountModel.findOne({
         _id: fromAccount, user: req.user._id 
    });

    const toUserAccount = await accountModel.findOne({
        _id: toAccount, user: req.user._id 
    });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(404).json({
            message: 'One or both accounts not found for the authenticated user',
            status: 'failed',
        });
    }

    //validate idempotency key

    const isTranscationAlreadyExists = await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    });

    if (isTranscationAlreadyExists) {
       if (isTranscationAlreadyExists.status === 'COMPLETED') {
        return res.status(200).json({
            message: 'Transaction already completed for the provided idempotency key',
            status: 'success',
            data: isTranscationAlreadyExists
        });
       }
       
       if(isTranscationAlreadyExists.status === 'PENDING') {
        return res.status(200).json({
            message: 'Transaction is still pending for the provided idempotency key',
        });
       }

        if(isTranscationAlreadyExists.status === 'FAILED') {
            return res.status(500).json({
                message: 'Transaction has failed for the provided idempotency key',
                status: 'failed',
            });
        }

        if(isTranscationAlreadyExists.status === 'REVERSED') {
            return res.status(500).json({
                message: 'Transaction has been reversed for the provided idempotency key',
                status: 'failed',
            });
        }
    }

    //check account status
    if (fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
        return res.status(400).json({
            message: 'One or both accounts are not active',
            status: 'failed',
        });
    }

    //derive sender balance from ledger
    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance in the sender's account. Current balance: ${balance}. Requested amount: ${amount}`,
            status: 'failed',
        });
    }
    
    let transaction;
    try{
    //create transaction with PENDING status

    const session = await mongoose.startSession();
    session.startTransaction();

     transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        status: 'PENDING',
        idempotencyKey
    }], { session }))[0];

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        type: 'DEBIT',
        transaction: transaction._id
    }], { session });

    await (()=>{
        return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        type: 'CREDIT',
        transaction: transaction._id
    }], { session });
    

    await transactionModel.findOneAndUpdate(
        { _id: transaction._id },
        { status: 'COMPLETED' },
        { session }
    )

    await session.commitTransaction();
    session.endSession();

    //send notification emails to both parties

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, fromUserAccount.accountNumber);

    return res.status(201).json({
        message: 'Transaction completed successfully',
        status: 'success',
        data: transaction
    });
    } catch (error) {
        return res.status(400).json({
            message: 'Transaction is pending due to an error. Please try again later.',
            status: 'failed',
            error: error.message
        })
    }


}


async function createInitialFundsController(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })


}

module.exports = {
    createTransactionController,
    createInitialFundsController
};