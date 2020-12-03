const conf = {
  credentials : {
    myCredentials : {
      clientId       : "306267182367-vnm4io6el35c8f48p01ph10n5id783u7.apps.googleusercontent.com",
      clientSecret   : "MKYQ6vj5IEkGD2Jc2Cbxx1So",
      redirect       : "https://localhost:300/enterprise/getcredentials",      
      refreshToken   : "1//0gnGWDG5MZlJ3CgYIARAAGBASNwF-L9IrnAipDzSRSFnarTwI_RJikpA6E-Y4WY1aTMfcRpHTRUHxNtumKq99_t-nJLYKcDIeMik",
      projectId      : "studious-rhythm-246118",
      callbackUrl    : "https://localhost:300/enterprise/createSignupUrl"
    }
  },  
  database : {
    ipAddress : 'localhost',
    dbName : 'MDM'
  },
  proxy : {
    proxyValue : "0",
    proxyAddress : "192.168.0.10",
    port : "3127"
  }  
}

module.exports = conf;