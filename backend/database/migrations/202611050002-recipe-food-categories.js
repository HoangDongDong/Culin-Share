const {reclassify} = require('../imports/recipe-categories-v1');
module.exports = {async up(connection) { await reclassify(connection, {apply: true}); }};
