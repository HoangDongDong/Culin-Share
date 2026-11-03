const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Readable,Writable}=require('node:stream');
const createStorage=require('../backend/src/middlewares/cloudinaryStorage');
test('Cloudinary adapter forwards server-owned image options and exposes multer-compatible metadata',async()=>{
    let options,bytes=0,removed;
    const storage=createStorage({uploader:{upload_stream(config,callback){options=config;return new Writable({write(chunk,encoding,next){bytes+=chunk.length;next();},final(next){callback(null,{secure_url:'https://example.com/upload.png',public_id:'test/image',bytes});next();}});},async destroy(id){removed=id;}}});
    const result=await new Promise((resolve,reject)=>storage._handleFile({body:{folder:'evil',resource_type:'raw'}},{fieldname:'images',stream:Readable.from(Buffer.from('test-image'))},(error,data)=>error?reject(error):resolve(data)));
    assert.equal(options.folder,'mamngon/community');assert.equal(options.resource_type,'image');assert.equal(result.path,'https://example.com/upload.png');assert.equal(result.filename,'test/image');assert.equal(result.size,10);
    await new Promise((resolve,reject)=>storage._removeFile({},result,error=>error?reject(error):resolve()));assert.equal(removed,'test/image');
});
test('new Nodemailer version builds Vietnamese email without contacting an SMTP server',async()=>{
    const nodemailer=require('../backend/node_modules/nodemailer');
    const transport=nodemailer.createTransport({streamTransport:true,buffer:true});
    const message=await transport.sendMail({from:'test@example.invalid',to:'recipient@example.invalid',subject:'Mã xác thực CulinShare',text:'Đây là kiểm thử tạo email, không gửi ra ngoài.'});
    assert.ok(message.message.length>100);assert.match(message.message.toString(),/recipient@example.invalid/);transport.close();
});
test('email delivery failure never falls back to exposing an OTP',async t=>{
    const email=require('../backend/src/services/email.service');
    t.mock.method(email.transporter,'sendMail',async()=>{throw Error('SMTP unavailable');});
    t.mock.method(console,'error',()=>{});
    const logs=[];t.mock.method(console,'log',(...args)=>logs.push(args.join(' ')));
    await assert.rejects(email.sendOtpEmail('test@example.invalid','123456'),error=>error.statusCode===503);
    await assert.rejects(email.sendResetPasswordOtp('test@example.invalid','123456'),error=>error.statusCode===503);
    assert.ok(logs.every(line=>!line.includes('123456')));
});
