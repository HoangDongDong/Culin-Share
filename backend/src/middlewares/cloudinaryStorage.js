const {randomUUID}=require('node:crypto');
// Multer storage adapter for the current Cloudinary SDK. Upload options are server-owned.
module.exports=cloudinary=>({
    _handleFile(req,file,callback){
        const folder=file.fieldname==='avatar'?'mamngon/avatars':file.fieldname==='images'?'mamngon/community':'mamngon/recipes';
        let completed=false;
        const done=(error,result)=>{if(completed)return;completed=true;callback(error,result);};
        const stream=cloudinary.uploader.upload_stream({folder,resource_type:'image',allowed_formats:['jpg','jpeg','png','gif','webp'],public_id:`${file.fieldname}-${randomUUID()}`},(error,result)=>{
            if(error)return done(error);
            done(null,{path:result.secure_url,filename:result.public_id,size:result.bytes});
        });
        file.stream.once('error',error=>{stream.destroy();done(error);});
        stream.once('error',done);
        file.stream.pipe(stream);
    },
    _removeFile(req,file,callback){
        if(!file.filename)return callback(null);
        cloudinary.uploader.destroy(file.filename).then(()=>callback(null),callback);
    }
});
