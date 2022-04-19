// GENERAR EL ARCHIVO KEY DESDE FIREBASE 

import * as admin from "firebase-admin";
import * as serviceAccount from "./key.json";

admin.initializeApp({
    //VALIDAR LOS serviceAccount CON  as any
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: "https://dwf-m6-crud-51731-default-rtdb.firebaseio.com"
});

const firestore = admin.firestore();
const RTDB = admin.database()
const usersCollection = firestore.collection('/Users')
const roomsCollection = firestore.collection('/rooms')

export{roomsCollection,usersCollection,firestore, RTDB}