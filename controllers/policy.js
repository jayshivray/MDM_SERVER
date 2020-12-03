const serResp = require('../helper/response');

var methods = {
  response : {
  },  
  get : function(req,resp){

  },
  list : async function(req,resp){
    try 
    {  
      let param = req.body.param;
      
      if(param==1){
        let policylist = [];
        policylist.push('select-policy-template');
        policylist.push('byod_default');
     
        methods.response = serResp.sendResponse(200,1,policylist);
      }else{ 
        methods.response = serResp.sendResponse(400,0);    
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);  
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }        
  },
  delete : function(req,resp){
  }    
}
module.exports = methods;
