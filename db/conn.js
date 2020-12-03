const mongoose = require('mongoose');
const app = require('../config/app');
const dbfunc = require('../helper/dbfunction');

mongoose.connect(`mongodb://${app.database.ipAddress}/${app.database.dbName}`,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true  
})
.then(()=>{
  console.log(`database connected to ${app.database.ipAddress}/${app.database.dbName}`);
})
.catch((err)=>{
  console.log(`Exception occured while connecting db: ${err}`); 
});
const db = mongoose.connection;
db.once('open', function() {
  dbfunc.createDefaultCollections();    
});