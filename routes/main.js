const router = require('express-promise-router')();
const enterpriseId = require('../controllers/enterpriseId');
const user = require('../controllers/user');
const managedMobile = require('../controllers/manageDevices');
const policy = require('../controllers/policy');

//enrollment
router.route('/enterprise/get').get(enterpriseId.get);
router.route('/enterprise/validate').get(enterpriseId.validate);
router.route('/enterprise/getcredentials').get(enterpriseId.getcredentials);
router.route('/enterprise/createSignupUrl').get(enterpriseId.createSignupUrl);
router.route('/enterprise/createEnrollmentToken').post(enterpriseId.createEnrollmentToken);
router.route('/enterprise/getemmqrcode').get(enterpriseId.getemmqrcode);
//devices
router.route('/enterprise/devicesGet').get(enterpriseId.devicesGet);
router.route('/enterprise/devicesList').get(enterpriseId.devicesList);
router.route('/enterprise/deleteDevices').post(enterpriseId.deleteDevices);
//policy
router.route('/enterprise/getPolicy').get(enterpriseId.getPolicy);
router.route('/enterprise/policyList').get(enterpriseId.policyList);
router.route('/enterprise/deletePolicy').post(enterpriseId.deletePolicy);
router.route('/enterprise/patchPolicy').get(enterpriseId.patchPolicy);
router.route('/enterprise/info').get(enterpriseId.getEmailInfo);
//anti theft
router.route('/enterprise/issueCommand').post(enterpriseId.issueCommand);
//login/signup
router.route('/user/login').post(user.login);
router.route('/user/signup').post(user.signup);
//Managed Mobile
router.route('/managedMobile/add').post(managedMobile.add);
router.route('/managedMobile/get').post(managedMobile.get);
router.route('/managedMobile/delete').post(managedMobile.delete);
router.route('/managedMobile/patch').post(managedMobile.patch);
router.route('/managedMobile/list').post(managedMobile.list);
router.route('/managedMobile/getTableData').post(managedMobile.getTableData);
router.route('/managedMobile/updateManagedMobile').post(managedMobile.updateManagedMobile);
//policy
router.route('/policy/get').post(policy.get);
router.route('/policy/list').post(policy.list);


module.exports = router;