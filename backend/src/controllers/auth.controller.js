const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const sendEmail = require('../services/email.service')
const tokenBlacklistModel = require('../models/blacklist.model')


/** 
* - User Register Controller
* - POST /api/auth/register
*/
async function userRegister(req, res) {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({
        email: email
    })

    if(isExists) {
        return res.status(422).json({
            message: 'User Already exists with this Email',
            status: 'failed'
        })
    }

    const user = await userModel.create({
        name,
        email,
        password
    })

    const token = jwt.sign({
        userId: user._id
    }, process.env.JWT_SECRET,
       {expiresIn: '3d'} )

    res.cookie('token', token)

    res.status(201).json({
        message: 'User Registered Successfully',
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

    await sendEmail.sendRegistrationEmail(user.email, user.name)
}


/** 
* - User Login Controller
* - POST /api/auth/login
*/
async function userLogin(req, res) {
    const { email, password} = req.body

    const user = await userModel.findOne({ email }).select('+password')

    if(!user) {
        return res.status(401).json({
            message: 'Email or password is Invalid'
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword) {
        return res.status(401).json({
            message: 'Email or password is Invalid'
        })
    }

    const token = jwt.sign({
        userId: user._id
    }, process.env.JWT_SECRET,
       {expiresIn: '3d'} )

    res.cookie('token', token)

    res.status(200).json({
        message: 'User Logged in Successfully',
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })
    
}


/** 
* - User Logout Controller
* - POST /api/auth/logout
*/
async function userLogout(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

    if(!token) {
        return res.status(200).json({
            message: 'User Logged out Successfully'
        })
    }

    // Clear the cookie
    res.clearCookie('token')

    await tokenBlacklistModel.create({
         token: token
    })

    res.status(200).json({
        message: 'User Logged out Successfully'
    })
}


module.exports = {
    userRegister,
    userLogin,
    userLogout
}