const router = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const home = require('../repositories/home.repository');

router.get('/home', (req,res,next) => req.headers.authorization ? verifyToken(req,res,next) : next(), async (req,res,next) => {
    try { res.json({success:true,data:await home.load(req.query.sort,req.user?.id)}); }
    catch(error) { next(error); }
});
module.exports = router;
