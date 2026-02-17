const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Payslip', payslipSchema);
