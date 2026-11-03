const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const cloudinary = require('../config/cloudinary');
const service = require('../services/community.service');
const repository = require('../repositories/community.repository');
const router = express.Router();
const optionalAuth = (req, res, next) => req.headers.authorization ? verifyToken(req, res, next) : next();
const writeLimit = rateLimit({ windowMs: 60000, max: 30, standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.' } });
const handle = action => async (req, res, next) => {
    try { const data = await action(req); res.json({ success: true, data: data ?? null }); }
    catch (error) { next(error); }
};
router.get('/community/stats', handle(() => repository.stats()));
router.get('/community/metadata', optionalAuth, handle(req => repository.metadata(req.user?.id)));
router.post('/community/challenges', verifyToken, writeLimit, handle(req => service.createActivity('challenge',req.user,req.body)));
router.post('/community/events', verifyToken, writeLimit, handle(req => service.createActivity('event',req.user,req.body)));
router.put('/community/posts/:id/save', verifyToken, writeLimit, handle(req => service.save(req.params.id,req.user,true)));
router.delete('/community/posts/:id/save', verifyToken, writeLimit, handle(req => service.save(req.params.id,req.user,false)));
router.put('/community/challenges/:id/join', verifyToken, writeLimit, handle(req => service.participate('challenge',req.params.id,req.user,true)));
router.delete('/community/challenges/:id/join', verifyToken, writeLimit, handle(req => service.participate('challenge',req.params.id,req.user,false)));
router.put('/community/events/:id/register', verifyToken, writeLimit, handle(req => service.participate('event',req.params.id,req.user,true)));
router.delete('/community/events/:id/register', verifyToken, writeLimit, handle(req => service.participate('event',req.params.id,req.user,false)));
router.get('/community/posts', optionalAuth, handle(req => service.feed(req.query, req.user)));
router.get('/community/posts/:id', optionalAuth, handle(req => service.post(req.params.id, req.user)));
router.post('/community/posts', verifyToken, writeLimit, (req, res, next) => {
    upload.array('images', 4)(req, res, error => error ? res.status(400).json({ success: false, message: error.message }) : next());
}, handle(async req => {
    try { return await service.create(req.user, req.body, req.files || []); }
    catch (error) {
        await Promise.allSettled((req.files || []).filter(file => file.filename).map(file => cloudinary.uploader.destroy(file.filename)));
        throw error;
    }
}));
router.patch('/community/posts/:id', verifyToken, writeLimit, handle(req => service.update(req.params.id, req.user, req.body.content)));
router.delete('/community/posts/:id', verifyToken, writeLimit, handle(req => service.remove(req.params.id, req.user)));
router.put('/community/posts/:id/like', verifyToken, writeLimit, handle(req => service.like(req.params.id, req.user, true)));
router.delete('/community/posts/:id/like', verifyToken, writeLimit, handle(req => service.like(req.params.id, req.user, false)));
router.get('/community/posts/:id/comments', optionalAuth, handle(req => service.comments(req.params.id, req.user, req.query.after)));
router.post('/community/posts/:id/comments', verifyToken, writeLimit, handle(req => service.addComment(req.params.id, req.user, req.body)));
router.delete('/community/comments/:id', verifyToken, writeLimit, handle(req => service.removeComment(req.params.id, req.user)));
router.post('/community/posts/:id/report', verifyToken, writeLimit, handle(req => service.report(req.params.id, req.user, req.body)));
router.post('/community/comments/:id/report', verifyToken, writeLimit, handle(req => service.reportComment(req.params.id, req.user, req.body)));
module.exports = router;
