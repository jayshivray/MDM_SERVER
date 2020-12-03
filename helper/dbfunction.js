const tblorganisationDetails   = require('../db/models/enterprise');
const tblManageDevices = require('../db/models/manageDevices');

var dbfunc = {
  createDefaultCollections : async function(){
    //have to maintain single enterprise entry in db so that creating default collection on db connect
    const EntInfo = await tblorganisationDetails.findOne({"id":1});
    if(!EntInfo){
      const tblorgdet = new tblorganisationDetails();    
      tblorgdet.save();        
    }
    console.log('create default db entries finished');
  },
  removeClientFromDb : async function(clientNumber){
    try{            
      await tblManageDevices.deleteOne({clientNumber}); 
      return true;           
    } catch (error) {
      return false;  
    }        
  }
}
module.exports = dbfunc;