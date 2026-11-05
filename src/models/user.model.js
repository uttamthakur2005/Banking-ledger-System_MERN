const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required for Creating user'],
        unique: [true, 'Email Already exists'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a Valid email address']

    },
    name: {
        type: String,
        required: [true, 'Name is required for creating a account'],
    },
    password: {
        type: String,
        required: [true, 'Password is required for creating a account'],
        minlength: [6, 'Password should be contain more than 6 character'],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
}, {timestamps: true})

userSchema.pre('save', async function() {
    if(!this.isModified('password')) {
        return 
    }
    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash

    return 
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model('User', userSchema)

module.exports = userModel