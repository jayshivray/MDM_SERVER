const mongoose = require('mongoose');
const general = require('../../helper/general');
const schema  = mongoose.Schema;

const tblManageDevicesSchema = new schema({
  clientDate : { type: String, default: general.getCurrentDateTime() },
  clientName : { type: String, default: null},        
  clientNumber : { type: String, default: null},    
  clientEmailId : { type: String, default: null},         
  clientOsType : { type: String, default: 'AND' },                            
  policyTemplateName : { type: String, default: 'byod_default' },
  state : { type: String, default: 'DE-ACTIVE' },
  enrollmentTime : { type: String, default: null},
  lastPolicySyncTime : { type: String, default: null},
  appliedPolicyName : { type: String, default: null},
  serialNumber : { type: String, default: null},
  deviceId : { type: String, default: null},
  lockDateTime : { type: String, default:'N/A'},
	wipeDateTime : { type: String, default:'N/A'},
	rebootDateTime : { type: String, default:'N/A'}    
});
//create a model
const tblManageDevices = mongoose.model('tblManageDevices',tblManageDevicesSchema);

//export the model
module.exports = tblManageDevices;