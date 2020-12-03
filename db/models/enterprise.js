const mongoose = require('mongoose');
const schema  = mongoose.Schema;

const tblorganisationDetailsSchema = new schema({
  id         : { type: String, default: '1' },
  createdate : { type: Date, default: Date.now() },
  enterpriseName  : String,
  signupName      : String,
  signupUrl       : String,
  enterpriseEmail : String,
  enterpriseId    : String,
  enterpriseToken : String
});
//create a model
const tblorganisationDetails = mongoose.model('tblorganisationDetails',tblorganisationDetailsSchema);

//export the model
module.exports = tblorganisationDetails;