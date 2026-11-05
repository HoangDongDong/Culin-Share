const {splitImportedSteps}=require('../imports/split-recipe-steps-v1');
module.exports={async up(c){await splitImportedSteps(c,{apply:true});}};
