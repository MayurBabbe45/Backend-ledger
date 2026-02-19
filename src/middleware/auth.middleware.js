const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blackList.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {

    return res.status(401).json({
      message: "Unauthorized: No token provided",
      status: "failed",

    });
  }

  const isBlackListed = await tokenBlackListModel.findOne({ token });
  if (isBlackListed) {
    return res.status(401).json({
      message: "Unauthorized: Token is blacklisted",
      status: "failed",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        status: "failed",
      });
    }

    req.user = user; // Attach user to request object

    next();

  } catch (error) {

    return res.status(401).json({

      message: "Unauthorized: Invalid token",
      status: "failed",

    });
  }
}


async function authSystemUserMiddleware(req, res, next) {

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {

    return res.status(401).json({
      message: "Unauthorized: No token provided",
      status: "failed",
    });

  }

  const isBlackListed = await tokenBlackListModel.findOne({ token });
  if (isBlackListed) {
    return res.status(401).json({
      message: "Unauthorized: Token is blacklisted",
      status: "failed",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select('+systemUser');
    
    if (!user || !user.systemUser) {
      return res.status(403).json({
        message: "Forbidden: Access is denied",
        status: "failed",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid token",
      status: "failed",
    });
  }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};