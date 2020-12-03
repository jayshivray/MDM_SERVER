const mongoose = require('mongoose');
const validator = require('validator');

const tblUserDetailsSchema = new mongoose.Schema({  
  createdate : { type: Date, default: Date.now() },
  emailid  : {
    type : String,
    required : true,
    unique : [true,'email id already present'],
    validate(val){
      if(!validator.isEmail(val)){
        throw new Error('invalid email');
      }
    }    
  },
  password : {
    type : String,
    required : true    
  }
});
//create a model
const tblUserDetails = mongoose.model('tblUserDetails',tblUserDetailsSchema);

//export the model
module.exports = tblUserDetails;