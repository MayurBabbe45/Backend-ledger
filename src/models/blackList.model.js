const mongoose = require('mongoose');




const tokenBlackListSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, 'Token is required to be blacklisted'],
        unique: true,
    },

},{
    timestamps: true
});

tokenBlackListSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 }); // Index for efficient querying by token


const tokenBlackListModel = mongoose.model('tokenBlackList', tokenBlackListSchema);

module.exports = tokenBlackListModel;