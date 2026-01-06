import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();
setGlobalOptions({ region: "asia-southeast1" });

export { public_submitLead } from "./public/submitLead";
export { admin_createStaffUser } from "./admin/createStaffUser";
export { dev_setMyRoleAdmin } from "./admin/devSetMyRoleAdmin";
