var mongoose = require('./connection');


var pubSchema = new mongoose.Schema({
    title: String,
    pub: String,
    time:Object,
    count: Number,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    reply: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'reply'
        }

    ],
    note: Array
});

var Publish = mongoose.model('pub', pubSchema)


module.exports = Publish;