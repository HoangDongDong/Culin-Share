const writeOriginGuard=origins=>(req,res,next)=>{
    if(!['GET','HEAD','OPTIONS'].includes(req.method)){
        const origin=req.headers.origin;
        if((origin&&!origins.includes(origin))||req.headers['sec-fetch-site']==='cross-site'&&!origin)return res.status(403).json({success:false,message:'Nguồn gửi yêu cầu không được phép.'});
    }
    // Authentication continues to require Authorization: Bearer; cookies are not credentials for API routes.
    next();
};
const securityHeaders=(req,res,next)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');next();
};
module.exports={writeOriginGuard,securityHeaders};
