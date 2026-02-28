const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const tokenBlackListModel = require('../models/blackList.model');

/*
    Generate JWT Token
*/
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: '3d' }
    );
};


/*
    REGISTER CONTROLLER
*/
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        // 1️⃣ Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                message: 'All fields are required',
                status: 'failed'
            });
        }

        // 2️⃣ Check existing user
        const isExist = await userModel.findOne({ email });
        if (isExist) {
            return res.status(409).json({
                message: 'Email already exists',
                status: 'failed'
            });
        }

        // 3️⃣ Create user
        const user = await userModel.create({
            email,
            password,
            name
        });

        // 4️⃣ Generate token
        const token = generateToken(user._id);

        // 5️⃣ Secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        // 6️⃣ Send registration email (non-blocking)
        emailService
            .sendRegisterationEmail(user.email, user.name)
            .catch(err => console.error('Email error:', err));

        // 7️⃣ Response
        return res.status(201).json({
            message: 'User registered successfully',
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 'failed'
        });
    }
}


/*
    LOGIN CONTROLLER
*/
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        // 1️⃣ Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required',
                status: 'failed'
            });
        }

        // 2️⃣ Find user + password
        const user = await userModel
            .findOne({ email })
            .select('+password');

        if (!user) {
            return res.status(401).json({
                message: 'Email or password is incorrect',
                status: 'failed'
            });
        }

        // 3️⃣ Compare password (force string safety)
        const isMatch = await user.comparePassword(String(password));

        if (!isMatch) {
            return res.status(401).json({
                message: 'Email or password is incorrect',
                status: 'failed'
            });
        }

        // 4️⃣ Generate token
        const token = generateToken(user._id);

        // 5️⃣ Secure cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: true, 
                sameSite: 'none', 
                maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
            });

        // 6️⃣ Response
        return res.status(200).json({
            message: 'User logged in successfully',
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 'failed'
        });
    }
}

/*
    LOGOUT CONTROLLER
*/
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token) {
        return res.status(200).json({
            message: 'User logged out successfully',
        });
    }

    res.cookie('token', '');
    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie('token');

    return res.status(200).json({
        message: 'User logged out successfully',
    });


}


module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};
