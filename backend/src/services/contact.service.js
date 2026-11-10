const contactRepository = require('../repositories/contact.repository');

class ContactService {
    async submitMessage({ name, email, phone, subject, message }) {
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            throw Object.assign(new Error('Họ và tên phải có ít nhất 2 ký tự'), { statusCode: 400 });
        }

        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            throw Object.assign(new Error('Địa chỉ email không hợp lệ'), { statusCode: 400 });
        }

        if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
            throw Object.assign(new Error('Tiêu đề hoặc chủ đề liên hệ không được để trống'), { statusCode: 400 });
        }

        if (!message || typeof message !== 'string' || message.trim().length < 10) {
            throw Object.assign(new Error('Nội dung tin nhắn phải có ít nhất 10 ký tự để chúng tôi hỗ trợ tốt nhất'), { statusCode: 400 });
        }

        if (phone && (typeof phone !== 'string' || phone.trim().length > 25)) {
            throw Object.assign(new Error('Số điện thoại không hợp lệ'), { statusCode: 400 });
        }

        const created = await contactRepository.create({
            name,
            email,
            phone,
            subject,
            message
        });

        return created;
    }

    async getMessages(query) {
        const { page = 1, limit = 20, status = null } = query || {};
        return contactRepository.findAll({ page, limit, status });
    }

    async updateStatus(id, status) {
        const message = await contactRepository.findById(id);
        if (!message) {
            throw Object.assign(new Error('Không tìm thấy tin nhắn liên hệ này'), { statusCode: 404 });
        }
        return contactRepository.updateStatus(id, status);
    }
}

module.exports = new ContactService();
