const { validationResult } = require('express-validator')
const Data = require('../models/data')
const bcrypt = require('bcryptjs')


exports.signup = async (req, res, next) => { 
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) return;

    const name = req.body.name
    const username = req.body.username;
    const password = req.body.password;

    try {
        const hashedPassword = await bcrypt.hash(password, 12)
        const userDetails = {
            name: name,
            username: username,
            password: hashedPassword
        }
        const result = await User.save(userDetails)
        res.status(201).json({ message: 'User registered' });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error)
    }
}

