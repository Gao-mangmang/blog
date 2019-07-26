
var mongoose = require('./connection');


var repSchema = new mongoose.Schema({
    time:Object,
    reply:String,
    username:String
});

var Reply = mongoose.model('reply',repSchema)


module.exports = Reply;
