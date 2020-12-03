const mongoose = require('../../node_modules/mongoose');
const schema  = mongoose.Schema;

const tblAntiTheftSchema = new schema({  
  clientName : String,        
  clientNumber : String,             
  clientOsType : { type: String, default: 'AND' },                        
  state : { type: String, default: 'DE-ACTIVE' },  
  lastPolicySyncTime : { type: String, default:null },     
  lockDateTime : { type: Date, default:null},
	wipeDateTime : { type: Date, default:null},
	rebootDateTime : { type: Date, default:null} 
});
//create a model
const tblAntiTheft = mongoose.model('tblAntiTheft',tblAntiTheftSchema);

//export the model
module.exports = tblAntiTheft;