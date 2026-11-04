const router = require('express').Router();
const pool = require('../config/database');
const seo = require('../services/seo.service');
router.get('/seo/catalog', async (req, res, next) => {
    try {res.set('Cache-Control','public, max-age=0, s-maxage=300').json({success:true,data:await seo.catalog(pool)});} catch(error) {next(error);}
});
router.get('/seo/sitemap.xml', async (req, res, next) => {
    try {res.set('Cache-Control','public, max-age=0, s-maxage=300').type('application/xml').send(seo.sitemap(await seo.catalog(pool)));} catch(error) {next(error);}
});
module.exports = router;
