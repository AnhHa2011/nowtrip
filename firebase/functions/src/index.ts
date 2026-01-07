import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2";

initializeApp();
setGlobalOptions({region: "asia-southeast1"});

export {publicSubmitLead} from "./public/submitLead";
export {adminCreateStaffUser} from "./admin/createStaffUser";
export {devSetMyRoleAdmin} from "./admin/devSetMyRoleAdmin";
export {adminExportLeadsCsv} from "./admin/exportLeadsCsv";
