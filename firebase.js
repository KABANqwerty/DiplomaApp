import {getApps, initializeApp} from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBEPKtYyi27xsRYhnHYqYk7aRCD5fX8Wbk',
  authDomain: 'diploma-26a8e.firebaseapp.com',
  projectId: 'diploma-26a8e',
  storageBucket: 'diploma-26a8e.appspot.com',
  messagingSenderId: '367290157169',
  appId: '1:367290157169:android:839f87da9cc0987c22f3d0',
};

let firebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

export const firebaseAuth = auth(firebaseApp);
export default firebaseApp;
