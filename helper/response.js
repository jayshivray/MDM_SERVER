
const sendResponse=(code,status,data=null,message=null,error=null)=>{
  return {code,status,data,message,error};
}
module.exports.sendResponse = sendResponse; 