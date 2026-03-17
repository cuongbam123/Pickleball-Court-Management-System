const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: {type: String, required: true, unique: true },
    password: {type: String, reuqired: true},
    auth_prodive: {type: String, enum:['local','facebook','google']},
    role: {type: String, enum:[]}
})