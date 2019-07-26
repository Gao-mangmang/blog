var mongoose=require('./connection')

var userSchema=new mongoose.Schema({
    username:String,
    password:String,
    email:String,
    introduction:String,
    headerurl:String
})

var User=mongoose.model('user',userSchema)
module.exports=User