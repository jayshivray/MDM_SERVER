const express        = require('express');
const bodyParser     = require('body-parser'); 
const cookieParser   = require('cookie-parser'); 
const path           = require('path');
const fs             = require('fs'); 
const https          = require('https');  
const cors           = require('cors') // middleware function  use to enable Cross-Origin Resource Sharing
const app            = express();
const conf           = require('./config/app');
                       require('./db/conn'); //db connectivity
const tokenValidator = require('./middleware/tokenValidator');                       

const _IMAGES     = express.static(__dirname+'/public/images');
const _SSL        = express.static(__dirname+'/SSL');
const _UPLOADS    = express.static(__dirname+'/uploads');
var jsonParser    = bodyParser.json();// create application/json parser


app.use('/images',_IMAGES); //create a virtual path
app.use('/uploads',_UPLOADS);
app.use(cors());
app.use(cookieParser());
app.use(tokenValidator);
app.use('/',jsonParser,require('./routes/main'));
/*custome middleware to validate token apply to all request if want to 
add in perticuler request then add in route*/
 

//exporting dir path available for all modules
module.exports.root_dir = __dirname;
module.exports.root_policy_dir = __dirname+'\\'+'policies';

//use self sign certificate here
const httpOptions = {
  cert:fs.readFileSync(path.join(__dirname,'SSL','server.cert')),
  key:fs.readFileSync(path.join(__dirname,'SSL','server.key')),
}

const port = process.env.port || 300;
//settings proxy here  
if(conf.proxy.proxyValue=='1'){
  process.env.HTTP_PROXY  = 'http://'+conf.proxy.proxyAddress+':'+conf.proxy.port; 
}

https.createServer(httpOptions,app).listen(port,()=>{
  console.log('server started on https://localhost:300');
});
