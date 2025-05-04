import React, {useEffect, useState} from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/Header.jsx';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {firebaseAuth} from '../../firebase';
import {createUserWithEmailAndPassword} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const {t} = useTranslation();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(user => {
      if (user) {
        navigation.replace('Home');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  const validateUsername = text => {
    if (!text) {
      setUsernameError(t('usernameRequired'));
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateEmail = text => {
    if (!text) {
      setEmailError(t('emailRequired'));
      return false;
    } else if (!/\S+@\S+\.\S+/.test(text)) {
      setEmailError(t('invalidEmailFormat'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = text => {
    if (!text) {
      setPasswordError(t('passwordRequired'));
      return false;
    } else if (text.length < 6) {
      setPasswordError(t('passwordTooShort'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLoginTrainer = async () => {
    const isEmailValid = validateEmail(email);
    validateUsername(username);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(
          email,
          password,
        );
        const user = userCredential.user;
        console.log('Успішно авторизовано тренера:', user.email);
        navigation.navigate('Home');
      } catch (error) {
        console.error('Помилка авторизації тренера:', error.message);
        let errorMessage = t('loginFailed');
        if (error.code === 'auth/user-not-found') {
          errorMessage = t('userNotFound');
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = t('wrongPassword');
        }
        Alert.alert(t('loginErrorTitle'), errorMessage, [{text: t('ok')}]);
      }
    }
  };

  const handleLoginClient = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isUsernameValid = validateUsername(username);

    if (isEmailValid && isPasswordValid && isUsernameValid) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password,
        );
        const user = userCredential.user;
        console.log(
          'Успішно зареєстровано клієнта:',
          user.email,
          username,
          user.uid,
        );
        await firestore().collection('users').doc(user.uid).set({
          username: username,
          email: email,
          role: 'trainer',
        });
        navigation.navigate('Home');
      } catch (error) {
        console.error('Помилка реєстрації клієнта:', error.message);
        let errorMessage = t('registrationFailed');
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = t('emailAlreadyInUse');
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = t('invalidEmail');
        } else if (error.code === 'auth/weak-password') {
          errorMessage = t('weakPassword');
        }
        Alert.alert(t('registrationErrorTitle'), errorMessage, [
          {text: t('ok')},
        ]);
      }
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      <Header titleKey="authorization" />
      <View style={styles.content}>
        <View>
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={text => {
              setEmail(text);
              setEmailError('');
            }}
            onBlur={() => validateEmail(email)}
            placeholder={t('email')}
            keyboardType="email-address"
          />
          <View style={styles.errorContainer}>
            {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
          </View>
        </View>

        <View>
          <Text style={styles.label}>{t('username')}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={text => {
              setUsername(text);
              setUsernameError('');
            }}
            onBlur={() => validateUsername(username)}
            placeholder={t('username')}
          />
          <View style={styles.errorContainer}>
            {usernameError ? (
              <Text style={styles.error}>{usernameError}</Text>
            ) : null}
          </View>
        </View>

        <View>
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={text => {
              setPassword(text);
              setPasswordError('');
            }}
            onBlur={() => validatePassword(password)}
            placeholder={t('password')}
            secureTextEntry
          />
          <View style={styles.errorContainer}>
            {passwordError ? (
              <Text style={styles.error}>{passwordError}</Text>
            ) : null}
          </View>
        </View>

        <Button title={t('loginAsTrainer')} onPress={handleLoginTrainer} />
        {/*<View style={styles.clientButtonContainer}>*/}
        {/*  <Button*/}
        {/*    title={t('loginAsClient')}*/}
        {/*    onPress={handleLoginClient}*/}
        {/*    style={styles.clientButton}*/}
        {/*  />*/}
        {/*</View>*/}
        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPassword}>{t('forgotPassword')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 60,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  errorContainer: {
    height: 20,
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
  clientButtonContainer: {
    alignSelf: 'center',
    width: '80%',
  },
  clientButton: {
    flex: 1,
  },
  forgotPasswordContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPassword: {
    color: 'blue',
    fontSize: 14,
  },
});

export default LoginScreen;
