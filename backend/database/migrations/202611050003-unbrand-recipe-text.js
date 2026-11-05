const {unbrand,ensureBackup}=require('../imports/unbrand-recipes-v1');
module.exports={async up(connection){await ensureBackup(connection);await unbrand(connection,{apply:true});}};
