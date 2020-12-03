const tblUserDetails   = require('../db/models/user')
const general = require('../helper/general');
const serResp = require('../helper/response');

var methods = {  
  response : {
  },       
  login : async function(req,resp){
    try 
    {
      let {emailid,password}   = req.body;    
  
      if(emailid!='' && password!=''){
        const userinfo = await tblUserDetails.findOne({emailid});
        if(userinfo){
          let email = userinfo.emailid,pass = userinfo.password;
        
          if(email==emailid && pass==password){            
            await general.createToken(email,password)
            .then((token)=>{              
              methods.response = serResp.sendResponse(200,1,{emailid,password,token},'login sucessfull');
            })
            .catch(()=>{ 
              methods.response = serResp.sendResponse(500,0);
            });           
          }
          else if(pass!=password){//email match but pass wrong 
            methods.response = serResp.sendResponse(200,0,{emailid,password},'incorrect password');
          }
        }else{          
          methods.response = serResp.sendResponse(200,0,{emailid,password},'user not registred');
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
  signup : async function(req,resp){
    try 
    {
      let 
      emailid   = req.body.emailid,
      password  = req.body.password;    
  
      if (emailid!='' && password!=''){
        const userinfo = await tblUserDetails.findOne({emailid});
  
        if(!userinfo){
          const tbluser = new tblUserDetails({
            emailid,
            password  
          });    
          tbluser.save();           
          methods.response = serResp.sendResponse(200,1,{emailid,password},'user registred'); 
        }else{  
          methods.response = serResp.sendResponse(200,0,{emailid,password},'user already registred');      
        }     
      }else{
        methods.response = serResp.sendResponse(400,0);          
      }      
    }catch (error) {
      methods.response = serResp.sendResponse(500,0);
    }finally{
      resp.status(methods.response.code).send(methods.response);
    }        
  }  
}
module.exports = methods;