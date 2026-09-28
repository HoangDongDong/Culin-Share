/**
 * =================================================================
 * OTP UTILITY
 * =================================================================
 * Tiện ích sinh mã OTP ngẫu nhiên và tính thời gian hết hạn.
 * =================================================================
 */

/**
 * Sinh mã OTP ngẫu nhiên 6 chữ số
 * @returns {string} Mã OTP 6 chữ số (VD: "482917")
 */
const crypto = require('crypto');

const generateOtp = () => {
    // Sinh số ngẫu nhiên từ 100000 đến 999999 bằng crypto cho an toàn
    const otp = crypto.randomInt(100000, 1000000);
    return otp.toString();
};

/**
 * Tính thời gian hết hạn OTP
 * @param {number} minutes - Số phút hết hạn (mặc định 10 phút)
 * @returns {Date} Thời điểm hết hạn
 */
const getOtpExpiry = (minutes = 10) => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
};

module.exports = {
    generateOtp,
    getOtpExpiry
};
