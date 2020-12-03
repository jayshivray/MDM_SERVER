const fs = require('fs'),
index    = require('../index');
qrcode   = require('qrcode');
path     = require('path')
bcrypt = require('bcrypt'),
saltRounds = 10,
CryptoJS = require("crypto-js");

let methods = {  
  whiteListUrl : [
    'www.google.com',
    '/user/login',
    '/user/signup',
    '/enterprise/createSignupUrl'    
  ],
  convertToLocalDateTime : function(val){
    let d = new Date(val);        
    let currDateTime = d.toLocaleDateString()+' '+d.toLocaleTimeString();
    return currDateTime;
  },  
  getCurrentDateTime : function(){
    let d = new Date();        
    let currDateTime = d.toLocaleDateString()+' '+d.toLocaleTimeString();
    return currDateTime;
  },  
  getExpireDateTime : function(hours=1){
    let d = new Date();
        d.setHours( d.getHours()+hours);
        //d.setMinutes(d.getMinutes()+5);
    let currDateTime = d.toLocaleDateString()+' '+d.toLocaleTimeString();
    return currDateTime;
  },
  createToken : async function(email,pass){
    let expdateTime = methods.getExpireDateTime();
    let input = `${email}|${pass}|${expdateTime}`;
    return await methods.encodeToke(input);
  },
  encodeToke : async function(input){    
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
  },
  decodeToken : async function(input){
    return CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
  },
  isTokenValid : async function(req){  
    let token = req.headers.token;    
    let reqReferer = req.headers.referer;
    let reqpath = req.path;
    
    let isFromGServer = methods.whiteListUrl.includes(reqReferer);
    let isServerReq   = methods.whiteListUrl.includes(reqpath);    

    if(isFromGServer || isServerReq) {return true}        
    if((token==='null') || (typeof token==='undefined')){return false}
    
    let resp = await methods.decodeToken(token);
    if(resp){             
      let temp = resp.split('|');
      let eDateTime = temp[2];        
      if(eDateTime){
        let cDateTime = methods.getCurrentDateTime(); 
        // console.log('eDateTime',eDateTime);        
        // console.log('cDateTime',cDateTime);        
        if(new Date(cDateTime)>new Date(eDateTime)){              
          return false;
        }else{              
          return true;
        }
      }
    }   
  },
  getFileData : function(fileName){    
    return new Promise(function(resolve,reject){
      fs.readFile(fileName, 'utf-8', (err, data) => {
        if (err){
          reject(err);
        } 
        jsonData = JSON.parse(data);
        resolve(jsonData);     
      });
    }); 
  },
  deleteAll : function(directory,extention){
    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        let fileExt = path.extname(file);
        if(fileExt==extention){
          console.log('[deleteAll] Extention:'+extention+' deleting file',path.join(directory,file));
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }        
      }
    });    
  },  
  createQrCode : function(qrobj){//optimize 
    let response = {};    
    return new Promise(function(resolve,reject){
      
      qrcode.toDataURL(qrobj.data,{
        type: 'png'
      },function (err, url) {
        
        //methods.deleteAll(path.join(index.root_dir,'public','images','qrcodes'),'.png');
        
        let qrcodeFile  = qrobj.clientNumber+'_'+Date.now()+'.png',        
            qrcodePath  = path.join(index.root_dir,'public','images','qrcodes',qrcodeFile);
            url         = url.replace(/^data:image\/png;base64,/,"");          
        
        fs.writeFile(qrcodePath,url, 'base64', function(err) {
          if (err) {            
            reject(err);                            
          }
        });  
        response.fileName   = qrcodeFile;
        response.filePath   = 'https://192.168.2.107:300/images/qrcodes/'+qrcodeFile;   
        response.qrCodePath = '/images/qrcodes/'+qrcodeFile;   
        resolve(response);  
      });
    });
  }  
}
module.exports = methods;