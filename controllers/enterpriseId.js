const index = require('../index');
const https = require('https'); 
const googleUtils = require('./google-util');
const conf = require('../config/app');
const querystring = require('querystring');
const general = require('../helper/general');
const db = require('../helper/dbfunction');
const serResp = require('../helper/response');
const tblorganisationDetails = require('../db/models/enterprise');
const tblManageDevices = require('../db/models/manageDevices');

var methods = {
  projectId   : conf.credentials.myCredentials.projectId,
  callbackUrl : conf.credentials.myCredentials.callbackUrl,
  clientId    : conf.credentials.myCredentials.clientId,
  clientSecret: conf.credentials.myCredentials.clientSecret,  
  response : {
  },
  get : async function(req,resp) {                 
    const EntInfo = await tblorganisationDetails.findOne({"id":1});             
    methods.response = serResp.sendResponse(200,1,EntInfo.enterpriseId,'success');
    resp.status(methods.response.code).send(methods.response);                      
  },  
  getEmailInfo : async function(req,resp) {//not in use 
    methods.response.status  = 1;
    methods.response.error   = null;
    methods.response.message = 'success';
    methods.response.data    = googleUtils.urlGoogle();          
    resp.status(200).send(methods.response);                     
  },
  validate : async function(req,resp){
    try 
    {
      let Gobject = {};       
      const EntInfo = await tblorganisationDetails.findOne({"id":1});
      
      if(!EntInfo){
        db.createDefaultCollections();
      }
  
      if(EntInfo.enterpriseId)
      {    
        let access_token,accessToken = await googleUtils.getAccessToken();
        
        Gobject.method      = 'GET';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+EntInfo.enterpriseId+'?';      
        Gobject.accessToken = accessToken;
        Gobject.queryparams = { access_token};
        Gobject.postData    = {};                       
  
        let data  = await methods.makeRequest(Gobject);      
        if(data){
          if(data.error){
            methods.response = serResp.sendResponse(200,0,null,'enterprise not registered');             
          }
          else if(data.name){
            let obj = {name: 'Test',email:'deepak.parab92@gmail.com',actdate : '22 sep 2020'}            
            methods.response = serResp.sendResponse(200,1,obj,'success'); 
          }
        }                
      }else{        
        methods.response = serResp.sendResponse(200,0,null,'enterprise not registered');   
      }       
    }catch (error) {
      methods.response = serResp.sendResponse(500,0); 
    }finally{
      resp.status(methods.response.code).send(methods.response);      
    }        
  },
  getcredentials : async function(req,resp) {  
    try 
    {
      const code = req.query.code;//authorizationCode
      let url = '';
      let info = '';
      if(!code){
        url  = await googleUtils.urlGoogle();    
        methods.response = serResp.sendResponse(200,1,url,url);      
      }  
      else{
        info = await googleUtils.getGoogleAccountFromCode(code);           
        methods.response = serResp.sendResponse(200,1,info,info);  
      }       
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }		                        
  },
  createSignupUrl : async function(req,resp) {                 
    try 
    {
      let enterpriseName  = req.query.enterpriseName;    
      let enterpriseEmail = req.query.enterpriseEmail;    
      let enterpriseToken = req.query.enterpriseToken;
      
      let access_token,accessToken = await googleUtils.getAccessToken();
      let Gobject = {};
  
      if(enterpriseToken)
      {
        /* 
          step 3 : 
          after completing signup flow google redirect to call back url with enrollment token
          this enrollment token use for create enterprise id
          and here we get enterprise id and save in db
        */  
        await tblorganisationDetails.updateOne({"id":1},{$set:{"enterpriseToken":enterpriseToken}}); //update quantity here                
        //const EntInfo = await tblorganisationDetails.findOne({enterpriseEmail});
        const EntInfo = await tblorganisationDetails.findOne({"id":1});    
        
        Gobject.method      = 'POST';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/enterprises?';
        Gobject.accessToken = accessToken;
        Gobject.queryparams = {
                                projectId       : methods.projectId,
                                signupUrlName   : EntInfo.signupName,
                                enterpriseToken           
                              };                        
        Gobject.postData    = {};    
        let data = await methods.makeRequest(Gobject);
        
        await tblorganisationDetails.updateOne(
          {"id":1},
          {$set:{enterpriseId:data.name}}
        ); 
        //when enterprise created make default policy here
        if(data.name)
        {
          let policyfile  = index.root_policy_dir+'\\byod_default.json';
          let postData    = await general.getFileData(policyfile);        
          
          if(postData)
          {
            let enterpriseId =  data.name;
            let Gobject = {};
  
            let access_token,accessToken = await googleUtils.getAccessToken();
        
            Gobject.method      = 'PATCH';
            Gobject.hostname    = 'androidmanagement.googleapis.com';
            Gobject.endpoints   = '/v1/'+enterpriseId+'/policies/byod_default?';
            Gobject.accessToken =  accessToken;
            Gobject.queryparams = { access_token };
            Gobject.postData    = postData;                        
            
            let data2  = await methods.makeRequest(Gobject);
          
            resp.redirect(200,'http://localhost:3000/');      
            resp.end();              
          }
        }              
      }else{
        
        //let callbackUrl = methods.callbackUrl+'?enterpriseEmail='+enterpriseEmail; //append email coz have to return from google             
        let callbackUrl = methods.callbackUrl;
            
        Gobject.method      = 'POST';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/signupUrls?';
        Gobject.accessToken = accessToken;
        Gobject.queryparams = {
                                callbackUrl,
                                projectId : methods.projectId,
                                access_token       
                              };
        Gobject.postData    = {};
      
        let data  = await methods.makeRequest(Gobject);
  
        await tblorganisationDetails.updateOne(
          {"id":1},
          //{$set:{signupName:data.name,signupUrl:data.url,enterpriseEmail,enterpriseName}}
          {$set:{signupName:data.name,signupUrl:data.url}}
        );                  
        methods.response = serResp.sendResponse(200,1,data,'success');
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);
    }finally{
      resp.status(methods.response.code).send(methods.response);  
    }        
  },
  createEnrollmentToken : async function(req,resp){
    try 
    {
      let clientMobileNumber  = req.body.clientMobileNumber;     
      // let policyName          = req.body.policyName;      
      let policyName          = 'byod_default';      
      let enterpriseId        = req.body.enterpriseId;
      let Gobject = {};
  
      if(enterpriseId && policyName)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
        //policyName = enterpriseId+'/policies/'+commanFunc.createAdpPolicyName(policyTemplateName);              
        let postData = {name: policyName,policyName:policyName};
  
        Gobject.method      = 'POST';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+enterpriseId+'/enrollmentTokens?';
        Gobject.accessToken = accessToken;
        Gobject.queryparams = { access_token};
        Gobject.postData    = postData;                       
  
        let data  = await methods.makeRequest(Gobject);
        
        methods.response = serResp.sendResponse(200,1,data,'success');

      }else{    
        methods.response = serResp.sendResponse(400,0);
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response); 
    }         
  },
  getemmqrcode : async function(req,resp){
    try 
    {
      let clientNumber  = req.query.clientNumber;     
      let policyName    = req.query.policyName;           
      let enterpriseId  = req.query.enterpriseId;
      let Gobject = {};
  
      if(enterpriseId && policyName)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
        //policyName = enterpriseId+'/policies/'+commanFunc.createAdpPolicyName(policyTemplateName);              
        let postData = {name: policyName,policyName:policyName,additionalData:clientNumber,oneTimeOnly:true};
  
        Gobject.method      = 'POST';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+enterpriseId+'/enrollmentTokens?';
        Gobject.accessToken = accessToken;
        Gobject.queryparams = { access_token};
        Gobject.postData    = postData;                       
  
        let data  = await methods.makeRequest(Gobject);
        let value = data.value;
        if(value)
        {
          const qrcode = {clientNumber,data:value};
          
          await general.createQrCode(qrcode)
          .then(function(result){                        
            methods.response = serResp.sendResponse(200,1,result,'Qr code Created successfully');
          });         
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
  getPolicy : async function(req,resp){
    try 
    {
      let policyName =  req.body.policyName;
      let Gobject = {};
      if(policyName)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
  
        Gobject.method      = 'GET';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+policyName+'?';
        Gobject.accessToken =  accessToken;
        Gobject.queryparams = { access_token };
        Gobject.postData    = {};                        
        
        let data  = await methods.makeRequest(Gobject);
            
        methods.response = serResp.sendResponse(200,1,data);
      }else{
        methods.response = serResp.sendResponse(400,0);
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0); 
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }    
  },  
  policyList : async function(req,resp){
    try 
    {
      let enterpriseId =  req.body.enterpriseId;
      let Gobject = {};
      if(enterpriseId)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
  
        Gobject.method      = 'GET';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+enterpriseId+'/policies?';
        Gobject.accessToken =  accessToken;
        Gobject.queryparams = { access_token };
        Gobject.postData    = {};                        
        
        let data  = await methods.makeRequest(Gobject);
                    
        methods.response = serResp.sendResponse(200,1,data);
      }else{
        methods.response = serResp.sendResponse(400,0);
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);   
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }    
  },
  patchPolicy : async function(req,resp){
    try 
    {
      let policyfile = index.root_policy_dir+'\\byod_default.json';
      let postData   = await general.getFileData(policyfile);
      
      if(json)
      {
        let enterpriseId =  req.body.enterpriseId;
        let Gobject = {};
        if(enterpriseId)
        {
          let access_token,accessToken = await googleUtils.getAccessToken();
    
          Gobject.method      = 'PATCH';
          Gobject.hostname    = 'androidmanagement.googleapis.com';
          Gobject.endpoints   = '/v1/'+enterpriseId+'/policies?';
          Gobject.accessToken =  accessToken;
          Gobject.queryparams = { access_token };
          Gobject.postData    = postData;                        
          
          let data  = await methods.makeRequest(Gobject);
                
          methods.response = serResp.sendResponse(200,1,data);
        }else{
          methods.response = serResp.sendResponse(400,0);
        }      
      }      
    }catch (error) {
			methods.response = serResp.sendResponse(500,0);	
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }        
  },
  deletePolicy : async function(req,resp){
    try 
    {
      let policyName =  req.body.policyName;
      let Gobject = {};
      if(policyName)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
  
        Gobject.method      = 'DELETE';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+policyName+'?';
        Gobject.accessToken =  accessToken;
        Gobject.queryparams = { access_token };
        Gobject.postData    = {};                        
        
        let data  = await methods.makeRequest(Gobject);
            
        methods.response = serResp.sendResponse(200,1,data);  
      }else{
        methods.response = serResp.sendResponse(400,0);  
      }      
    }catch (error) {
			methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }        
  },
  devicesGet : async function(req,resp){
    try 
    {
      let deviceId =  req.body.deviceId;
      let Gobject = {};
      if(deviceId)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
  
        Gobject.method      = 'GET';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+deviceId+'?';
        Gobject.accessToken =  accessToken;
        Gobject.queryparams = { access_token };
        Gobject.postData    = {};                        
        
        let data  = await methods.makeRequest(Gobject);
            
        methods.response = serResp.sendResponse(200,1,data);  
      }else{
        methods.response = serResp.sendResponse(400,0);  
      }      
    }catch (error) {
			methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }        
  },
  devicesList : async function(req,resp){
    try 
    {
      let enterpriseId =  req.body.enterpriseId;
      let Gobject = {};
      if(enterpriseId)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
  
        Gobject.method      = 'GET';
        Gobject.hostname    = 'androidmanagement.googleapis.com';
        Gobject.endpoints   = '/v1/'+enterpriseId+'/devices?';
        Gobject.accessToken =  accessToken;
        Gobject.queryparams = { access_token };
        Gobject.postData    = {};                        
        
        let data  = await methods.makeRequest(Gobject);
    
        methods.response = serResp.sendResponse(200,1,data);
      }else{
        methods.response = serResp.sendResponse(400,0);
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }
  },   
  deleteDevices : async function(req,resp){
    try 
    {
      let deviceList = req.body.deviceList;      

      let Gobject = {};
      if(deviceList)
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
  
        for(let ind=0; ind<deviceList.length; ind++)
        {
          let deviceId = deviceList[ind].deviceId; 
          let clientNumber = deviceList[ind].clientNumber; 
          let clientUserName = deviceList[ind].clientUserName; 
  
          if(deviceId)
          {
            Gobject.method      = 'DELETE';
            Gobject.hostname    = 'androidmanagement.googleapis.com';
            Gobject.endpoints   = '/v1/'+deviceId+'?';
            Gobject.accessToken =  accessToken;
            Gobject.queryparams = { access_token };
            Gobject.postData    = {}; 

            await methods.makeRequest(Gobject)
            .then(async(resp)=>{          
              db.removeClientFromDb(clientNumber);                                          
            })
            .catch(async(error)=>{
              console.log(`[deleteDevices] Exception: ${error}`);       
            });            
          }else{
            db.removeClientFromDb(clientNumber); 
          }                
          methods.response = serResp.sendResponse(200,1,null,'success');                           
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
  issueCommand : async function(req,resp){
    try 
    {
      let {command}  = req.body;
      let deviceList = req.body.deviceList;    
      let Gobject = {};    
      if(command && deviceList )
      {
        let access_token,accessToken = await googleUtils.getAccessToken();
        for(let ind=0; ind<deviceList.length; ind++)
        {
          let deviceId            = deviceList[ind].deviceId; 
          let clientMobileNumber  = deviceList[ind].clientMobileNumber; 
          let clientUserName      = deviceList[ind].clientUserName;         
  
          if(deviceId)
          {          
            Gobject.method      = 'POST';
            Gobject.hostname    = 'androidmanagement.googleapis.com';
            Gobject.endpoints   = '/v1/'+deviceId+':issueCommand?';
            Gobject.accessToken =  accessToken;
            Gobject.queryparams = { access_token };
            Gobject.postData    = { type :command };                        
            
            await methods.makeRequest(Gobject)
            .then(async(resp)=>{          
              await tblManageDevices.updateOne(
                {clientNumber : clientMobileNumber},        
                {$set:{
                  lockDateTime : general.getCurrentDateTime() 
                }}
              );
              methods.response = serResp.sendResponse(200,1,resp);  
            })
            .catch(async(error)=>{
              console.log('[enterprise]:[issueCommand]: Exception',error);
              await tblManageDevices.updateOne(
                {clientNumber},        
                {$set:{
                  lockDateTime : 'N/A'
                }}
              );            
            });        
          }else{
            console.log('[enterprise]:[issueCommand]: deviceId Not Found');
          }
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
  makeRequest : function(credentials){
    const {method,hostname,endpoints,accessToken,agent} = credentials;
    let queryparams = querystring.stringify(credentials.queryparams);
    let postData    = JSON.stringify(credentials.postData)

    return new Promise(function(resolve,reject){
      var options = {
                        hostname,
                        port: 443,
                        path: endpoints+queryparams,
                        method,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',           
                            'Authorization':  'Bearer '+accessToken                       
                        }
                      };     
      let data = '';
      const req = https.request(options, function(resp) {
        resp.setEncoding('utf8');
        resp.on('data', function (body) {  
          if(body){                                         
            data += body;
          }          
        }); 
        resp.on('end',function(){                  
          resolve(JSON.parse(data));          
        });                    
      });        
      req.on('error', function(e) {        
        reject(e.message)
      }); 
      req.write(postData);
      req.end();            
    });            
  }     
}  
module.exports = methods;