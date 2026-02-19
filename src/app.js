const express = require('express');
const cookieparser = require('cookie-parser');



const app = express();

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieparser()); // Middleware to parse cookies


// Import routes
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.route');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);

module.exports = app ;