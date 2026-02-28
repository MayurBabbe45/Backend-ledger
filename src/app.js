const express = require('express');
const cookieparser = require('cookie-parser');
const cors = require('cors');



const app = express();

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieparser()); // Middleware to parse cookies
app.use(cors({
  // Replace this with your actual Render frontend URL
  origin: "https://frontend-ledger-ledger.onrender.com", 
  credentials: true, // Required for your JWT cookies to work
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Import routes
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.route');

// Use routes
app.get('/', (req, res) => {
    res.send('Welcome to the Banking API');
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);



module.exports = app ;