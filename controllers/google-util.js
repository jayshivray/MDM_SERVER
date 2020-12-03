const {google}   = require('googleapis');
const conf  = require('../config/app');

if(conf.proxy.proxyValue=='1'){  
  google.options.proxy    = process.env.http_proxy || 'http://'+conf.proxy.proxyAddress+':'+conf.proxy.port;;
}

let methods = {
  urlGoogle : function() {
    const auth = this.createConnection(); 
    const url  = this.getConnectionUrl(auth);
    return url;
  },
  getGoogleAccountFromCode : async function(code){
    try {
      const auth2   = this.createConnection(); 
      const data    = await auth2.getToken(code); // get the auth "tokens" from the request
      const tokens  = data.tokens;
      
      auth2.setCredentials(tokens);                   // add the tokens to the google api so we have access to the account          

      const plus  = this.getGooglePlusApi(auth2);     // connect to google plus - need this to get the user's email
      const me    = await plus.people.get({ userId: 'me' });
      
      // get the google id and email
      const userGoogleId    = me.data.id;
      const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
      
      return {
        id      : userGoogleId,
        email   : userGoogleEmail,
        tokens  : tokens // you can save these to the user if you ever want to get their details without making them log in again
      };      
    } catch (error) {
      console.log(error);
    }
  },
  getAccessTokenFromCode : async function(code){
    const auth2  = this.createConnection();
    const {tokens} = await auth2.getToken(code);    
    auth2.setCredentials(tokens);
    return tokens;
  },
  getAccessToken : async function(){
    const auth2   = this.createConnection(); 
          auth2.setCredentials({
            refresh_token: conf.credentials.myCredentials.refreshToken        
          });  
    const data =  await auth2.getAccessToken();    
    if(data){
      return data.res.data.access_token;
    }    
  },
  createConnection : function(){//Create the google auth object which gives us access to talk to google's apis.
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirect
    ); 
    return oauth2Client;
  },
  getConnectionUrl : function(auth) {//Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
    return auth.generateAuthUrl({
      access_type : 'offline',
      prompt      : 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
      scope       : this.defaultScope
    });
  },
  getGooglePlusApi : function(auth) {//Helper function to get the library with access to the google plus api.
    return google.plus({ version: 'v1', auth });
  },
  defaultScope : [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/androidmanagement'
  ],  
  clientId      : conf.credentials.myCredentials.clientId,               
  clientSecret  : conf.credentials.myCredentials.clientSecret,
  redirect      : conf.credentials.myCredentials.redirect // this must match your google api settings          
}
module.exports = methods;

