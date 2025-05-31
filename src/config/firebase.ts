import admin from "firebase-admin";

// Add the 'assert' statement when importing JSON
import serviceAccount from "./kmcc-riyadh-app-firebase-adminsdk-fbsvc-1f13d464b0.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export { admin };
