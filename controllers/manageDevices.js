const app = require('../index'); 
const path = require('path');
const googleUtils  = require('./google-util');
const enterpriseid = require('./enterpriseid');
const serResp = require('../helper/response');
const tblManageDevices = require('../db/models/manageDevices');
const general = require('../helper/general');

var methods = {
  response : {
  },    
  get : async function(req,resp){
    try 
    {
      let clientNumber = req.body.clientNumber; 
    
      if(clientNumber)
      {      
        const cliInfo = await tblManageDevices.findOne({clientNumber});      
        if(cliInfo){  
          methods.response = serResp.sendResponse(200,1,cliInfo);              
        }else{
          methods.response = serResp.sendResponse(200,0,clientNumber,'client not present on server');       
        }
      }
      else{
        methods.response = serResp.sendResponse(400,0);    
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }                
  },  
  list : async function(req,resp){
    try 
    {
      let appliedPolicyName = req.body.appliedPolicyName;
    
      if(appliedPolicyName){
        const device_list = await tblManageDevices.find({appliedPolicyName});             
        methods.response = serResp.sendResponse(200,1,device_list);  
      }
      else{        
        methods.response = serResp.sendResponse(400,0);     
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }        
  },
  updateManagedMobile : async function(req,resp){//this function compair data on g server and update in db      
    try 
    {
      let enterpriseId      = req.body.enterpriseId;
      //let appliedPolicyName = req.body.appliedPolicyName;
      let Gobject           = {};
  
      if(enterpriseId)
      {
        const device_list = await tblManageDevices.find({state:'DE-ACTIVE'});
        
        if(device_list.length>0)
        {
          let accessToken   = await googleUtils.getAccessToken(),
              access_token  = accessToken;
      
          if(accessToken)
          {
            Gobject.method      = 'GET';
            Gobject.hostname    = 'androidmanagement.googleapis.com';
            Gobject.endpoints   = '/v1/'+enterpriseId+'/devices?';
            Gobject.accessToken = accessToken;
            Gobject.queryparams = { access_token};
            Gobject.postData    = {};                       
          
            await enterpriseid.makeRequest(Gobject)
            .then(function(response){
            
              let list  = response.devices;
              
              if(!list){//when no devices present on G server
                methods.response = serResp.sendResponse(200,1,null,'sync sucessfull');   
              }
              else if(list.length>0){      
  
                list.forEach(function(val,ind){
                  let name = val.name,
                      state = val.state,
                      enrollmentTime = val.enrollmentTime,
                      lastPolicySyncTime = general.convertToLocalDateTime(val.lastPolicySyncTime),
                      enrollmentTokenData = val.enrollmentTokenData;
                      //appliedPolicyName = val.appliedPolicyName;
                  
                  device_list.forEach(async function(val,ind){
                    let cliNumber = val.clientNumber;
                    if(enrollmentTokenData==cliNumber){
                      await tblManageDevices.updateOne(
                        {"clientNumber":cliNumber},
                        {$set:{"deviceId":name,state,enrollmentTime,lastPolicySyncTime}
                      });                
                    }
                  });
                });                   
                methods.response = serResp.sendResponse(200,1,null,'sync sucessfull');                  
              }
            })
            .catch(function(error){
              console.log('error',error);
              methods.response = serResp.sendResponse(200,0,null,'sync failed');
            });         
          } 
        }else{  
          methods.response = serResp.sendResponse(200,1,null,'sync sucessfull');      
        }
      }else{
        methods.response = serResp.sendResponse(400,0);
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }          
  },
  getTableData : async function(req,resp){
    try
    {
      let appliedPolicyName = req.body.appliedPolicyName,
      tbltype = req.query.type,    
      datatable = '';
  
      if(appliedPolicyName){
  
        if(tbltype=='mb'){
          datatable = await methods.getManagedMobileTableData(req);  
        }else if(tbltype=='at'){
          datatable = await methods.getAntiTheftTableData(req);
        }     
        methods.response = serResp.sendResponse(200,1,datatable);    
      }
      else{
        methods.response = serResp.sendResponse(400,0);      
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }       
  },
  getManagedMobileTableData : async function(req){
    try 
    {
      let appliedPolicyName = req.body.appliedPolicyName;
    
      if(appliedPolicyName){
        
        const device_list = await tblManageDevices.find({appliedPolicyName});
        
        let rows = [];
        device_list.forEach(function(val,ind){
          let cbid = val.clientNumber;
              cbid = 'cb'+cbid;
  
          checkBox = {
            id    : cbid,
            type  : 'checkbox',
            userName : val.clientName, 
            mobileNumber : val.clientNumber,
            email : val.clientEmailId,
            ostype : val.clientOsType,
            policyName : val.policyTemplateName,                                        
            state : val.state,
            deviceId : val.deviceId                                                                                                                                 
          }
  
          rows.push({
            checkBox,
            addedDate : val.clientDate,
            userName : val.clientName,
            mobileNumber : val.clientNumber,
            qrcode: 'view' ,
            email: val.clientEmailId,
            ostype: val.clientOsType,
            policyName: val.appliedPolicyName,
            state: val.state
          });
        });
  
        let datatable ={
          columns: [
            {
              label : 'User Name',
              field : 'checkBox',
              sort: 'disabled'
            },          
            {
              label: 'Added Date',
              field: 'addedDate',
              width: 150,
              attributes: {
                'aria-controls': 'DataTable',
                'aria-label': 'Added Date',
              },
            },
            {
              label: 'User Name',
              field: 'userName',
              width: 270,
            },
            {
              label: 'Mobile Number',
              field: 'mobileNumber',
              width: 200,
            },
            {
              label: 'QR Code',
              field: 'qrcode',
              width: 200,
              sort: 'disabled',
            },        
            {
              label: 'Email',
              field: 'email',
              width: 100,
              sort: 'disabled',
            },
            {
              label: 'OS type',
              field: 'ostype',
              sort: 'disabled',
              width: 50,
            },
            {
              label: 'Policy Name',
              field: 'policyName',
              sort: 'disabled',
              width: 100,
            },
            {
              label: 'State',
              field: 'state',
              sort: 'disabled',
              width: 100,
            }        
          ],
          rows 
        }      
        return datatable;      
      }      
    }catch (error) {
      console.log(`[getManagedMobileTableData] Exception: ${error.message}`);
    }       
  },
  getAntiTheftTableData : async function(req){
    try 
    {
      let appliedPolicyName = req.body.appliedPolicyName;
      let state = 'ACTIVE';
  
      if(appliedPolicyName){
  
        const device_list = await tblManageDevices.find({appliedPolicyName,state});
  
        let rows = [];
        device_list.forEach(function(val,ind){
          let cbid = val.clientNumber;
              cbid = 'cb'+cbid;
  
          checkBox = {
            id    : cbid,
            type  : 'checkbox',
            userName : val.clientName, 
            mobileNumber : val.clientNumber,
            ostype : val.clientOsType,                                       
            state : val.state,
            deviceId : val.deviceId                                                                                                                                 
          }
  
          rows.push({
            checkBox,
            addedDate : val.clientDate,
            userName : val.clientName,
            mobileNumber : val.clientNumber,
            ostype: val.clientOsType,
            state: val.state,
            lockDateTime : val.lockDateTime,
            wipeDateTime : val.wipeDateTime,
            rebootDateTime : val.rebootDateTime
          });
        });
  
        let datatable ={
          columns: [
            {
              label : 'User Name',
              field : 'checkBox',
              sort: 'disabled'
            },          
            {
              label: 'Added Date',
              field: 'addedDate',
              width: 150,
              attributes: {
                'aria-controls': 'DataTable',
                'aria-label': 'Added Date',
              },
            },
            {
              label: 'User Name',
              field: 'userName',
              width: 270,
            },
            {
              label: 'Mobile Number',
              field: 'mobileNumber',
              width: 200,
            },          
            {
              label: 'OS type',
              field: 'ostype',
              sort: 'disabled',
              width: 50,
            },
            {
              label: 'State',
              field: 'state',
              sort: 'disabled',
              width: 100,
            },
            {
              label: 'Locak',
              field: 'lock',
              sort: 'disabled'
            },    
            {
              label: 'Wipe',
              field: 'wipe',
              sort: 'disabled'
            },
            {
              label: 'Reboot',
              field: 'reboot',
              sort: 'disabled'
            }                        
          ],
          rows 
        }      
        return datatable;      
      }      
    }catch (error) {
      console.log(`[getAntiTheftTableData] Exception: ${error.message}`);  
    }          
  },
  add : async function(req,resp){
    try 
    {
      let 
      clientName         = req.body.clientName,
      clientNumber       = req.body.clientNumber,    
      clientEmailId      = req.body.clientEmailId,         
      policyTemplateName = req.body.policyTemplateName,
      appliedPolicyName  = req.body.policyTemplateName;
  
      methods.response.data    = {        
        clientName,        
        clientNumber,      
        clientEmailId,     
        policyTemplateName,
        appliedPolicyName
      };
  
      const cliInfo = await tblManageDevices.findOne({clientNumber});
  
      if(cliInfo){        
        methods.response = serResp.sendResponse(200,0,null,'client present in database','client present');
      }
      else if(clientName && clientNumber && clientEmailId && policyTemplateName)
      {
        const tblMngMobile = new tblManageDevices({
          clientName,
          clientNumber, 
          clientEmailId, 
          policyTemplateName,
          appliedPolicyName
        });
        tblMngMobile.save();

        methods.response = serResp.sendResponse(200,1,null,'client added');        
      }
      else{
        methods.response = serResp.sendResponse(400,0);            
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }           
  },
  delete : async function(req,resp){
    try 
    {
      let clientNumber = req.body.clientNumber; 
    
      if(clientNumber)
      {      
        const cliInfo = await tblManageDevices.findOne({clientNumber});      
        if(cliInfo)
        {
          tblManageDevices.deleteOne({clientNumber}, function (err) {
            if (err){
              console.log('[managedDevices][delete] Exception: '+err);
            }          
          }); 
          methods.response = serResp.sendResponse(200,1,clientNumber,'client deleted from server');                 
        }
        else{ 
          methods.response = serResp.sendResponse(200,0,clientNumber,'client not present on server');       
        }
      }
      else{
        methods.response = serResp.sendResponse(400,0);    
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }       
  },
  patch : async function(req,resp){
    try 
    {
      let 
      clientName         = req.body.clientName,
      clientNumber       = req.body.clientNumber,    
      clientEmailId      = req.body.clientEmailId,         
      policyTemplateName = req.body.policyTemplateName;
  
      let data = {        
        clientName,        
        clientNumber,      
        clientEmailId,     
        policyTemplateName
      };
  
      const cliInfo = await tblManageDevices.findOne({clientNumber});
      
      if(!clientName || !clientNumber || !clientEmailId || !policyTemplateName){
        methods.response = serResp.sendResponse(200,0,null,'all fields required');         
      }else if(cliInfo){
        await tblManageDevices.updateOne(
          {clientNumber},        
          {$set:{
            clientName, 
            clientEmailId, 
            policyTemplateName
          }}
        );
        methods.response = serResp.sendResponse(200,1,data,'client info updated');
      }    
      else{        
        methods.response = serResp.sendResponse(200,0,null,'client not present on server');            
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }    
  }    
}  
module.exports = methods;