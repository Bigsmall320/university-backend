const asyncHandler = require("express-async-handler");
const FinanceModel = require("../models/financeModel");

const getStudentFinances = asyncHandler( async(req, res) => {
    const studentId = req.user.id;
    if(!studentId) {
        return res.status(400).json({
            success: false,
            message: "Bad Request."
        });
    }

    const paymentHistory = await FinanceModel.getPaymentHistory(studentId);
    if(!paymentHistory) {
        return res.status(404).json({
            success: false,
            message: "No payments history."
        })
    }

    const totalFee = await FinanceModel.getTotalFees(studentId);
    if(!totalFee) {
        return res.status(404).json({
            success: false,
            message: "Fee Structure not found."
        })
    }

    const totalPaid = paymentHistory
        ? paymentHistory.reduce((sum, payment) => sum + Number(payment.payment_amount), 0)
        : 0;

    const balance = totalFee.total_amount - totalPaid;
    
    return res.status(200).json({
        success: true,
        message: "successfully retrieved student's Finances.",
        data: {
            totalFee,
            totalPaid,
            balance,
            paymentHistory
        }
    });
});

module.exports = {getStudentFinances};