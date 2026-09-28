/**
 * =================================================================
 * EMAIL SERVICE
 * =================================================================
 * Gửi email OTP qua Nodemailer (SMTP).
 * =================================================================
 */

const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    const port = Number(process.env.EMAIL_PORT) || 587;
    const secure = port === 465;
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Gửi OTP xác thực tài khoản
   */
  async sendOtpEmail(toEmail, otp, expiresInMinutes = 10) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: toEmail,
      subject: "Ma OTP kich hoat tai khoan",
      html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px">
                <h2 style="color:#2d3748">Kich hoat tai khoan</h2>
                <p>Ban vua dang ky tai khoan. Ma OTP cua ban la:</p>
                <div style="background:#edf2f7;padding:16px;text-align:center;border-radius:8px;margin:20px 0">
                    <span style="font-size:32px;font-weight:bold;color:#2b6cb0;letter-spacing:6px">${otp}</span>
                </div>
                <p>Ma co hieu luc trong <strong>${expiresInMinutes} phut</strong>.</p>
            </div>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Email OTP đã gửi tới:", toEmail);
      return info;
    } catch (error) {
      console.error("❌ Lỗi gửi email:", error.message);
      console.log(`\n======================================================`);
      console.log(`⚠️ [FALLBACK TESTER] Mã OTP kích hoạt tài khoản của ${toEmail} là: ${otp}`);
      console.log(`======================================================\n`);
      // Không ném lỗi ra ngoài để luồng đăng ký của môi trường test không bị gián đoạn
      return { fallback: true, otp };
    }
  }

  /**
   * Gửi OTP đặt lại mật khẩu
   */
  async sendResetPasswordOtp(toEmail, otp) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: toEmail,
      subject: "Mã OTP - Đặt lại mật khẩu",
      html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px">
                <h2 style="color:#f5576c">Đặt lại mật khẩu</h2>
                <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
                <div style="background:#f0f0f0;padding:20px;text-align:center;border-radius:8px;margin:20px 0">
                    <span style="font-size:36px;font-weight:bold;color:#f5576c;letter-spacing:8px">${otp}</span>
                </div>
                <p>Mã có hiệu lực trong <strong>10 phút</strong>.</p>
            </div>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Email Reset Password đã gửi tới:", toEmail);
      return info;
    } catch (error) {
      console.error("❌ Lỗi gửi email:", error.message);
      console.log(`\n======================================================`);
      console.log(`⚠️ [FALLBACK TESTER] Mã OTP đặt lại mật khẩu của ${toEmail} là: ${otp}`);
      console.log(`======================================================\n`);
      return { fallback: true, otp };
    }
  }
}

module.exports = new EmailService();
