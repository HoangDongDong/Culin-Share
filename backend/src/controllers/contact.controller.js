const contactService = require('../services/contact.service');

class ContactController {
    async submit(req, res, next) {
        try {
            const { name, email, phone, subject, message } = req.body;
            const data = await contactService.submitMessage({ name, email, phone, subject, message });
            res.status(201).json({
                success: true,
                message: 'Cảm ơn bạn! Tin nhắn liên hệ đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async getMessages(req, res, next) {
        try {
            const data = await contactService.getMessages(req.query);
            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const data = await contactService.updateStatus(id, status);
            res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công',
                data
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ContactController();
