import React, {useState} from 'react';
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
import {sendPasswordResetEmail} from '@react-native-firebase/auth';
import BackBtn from '../components/BackBtn';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const {t} = useTranslation();
  const navigation = useNavigation();

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

  const handleSendResetLink = async () => {
    if (validateEmail(email)) {
      try {
        await sendPasswordResetEmail(firebaseAuth, email);
        Alert.alert(
          t('passwordResetEmailSentTitle'),
          t('passwordResetEmailSentMessage', {email}),
          [{text: t('ok'), onPress: () => navigation.goBack()}],
        );
      } catch (error) {
        console.error(
          'Помилка відправки листа для відновлення паролю:',
          error.message,
        );
        Alert.alert(
          t('passwordResetEmailFailedTitle'),
          t('passwordResetEmailFailedMessage', {message: error.message}),
          [{text: t('ok')}],
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Header titleKey="recoverPassword" />
      <View style={styles.headerContainer}>
        <BackBtn />
        <Text style={styles.headerTitle}>{t('resetYourPassword')}</Text>
      </View>
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
          <Button title={t('recover')} onPress={handleSendResetLink} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 30,
    width: 250,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    marginTop: 50,
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
});

export default ForgotPasswordScreen;
