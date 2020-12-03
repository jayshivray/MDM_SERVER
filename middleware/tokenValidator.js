const general = require('../helper/general');

module.exports = async function tokenValidator(req, res, next) {  
  let isTokenValide = await general.isTokenValid(req);   
  if(!isTokenValide){                    
    res.status(400).send({message:'token_expired'});
  }else{
    next();
  }    
};
//https://www.digitalocean.com/community/tutorials/nodejs-creating-your-own-express-middleware