import React, {useEffect, useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {firebaseAuth} from '../../firebase';
import firestore from '@react-native-firebase/firestore';

const Header = ({titleKey}) => {
  const {t, i18n} = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n.language, i18n]);

  useEffect(() => {
    const unsubscribeAuth = firebaseAuth.onAuthStateChanged(
      async currentUser => {
        setUser(currentUser);
        if (currentUser) {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();
          if (userDoc.exists) {
            setAvatarUrl(userDoc.data().avatarUrl || null);
          } else {
            setAvatarUrl(null);
          }
        } else {
          setAvatarUrl(null);
        }
      },
    );

    return () => unsubscribeAuth();
  }, []);

  const changeLanguage = () => {
    const newLanguage = currentLanguage === 'uk' ? 'en' : 'uk';
    i18n.changeLanguage(newLanguage);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.languageButton} onPress={changeLanguage}>
        <Text style={styles.languageButtonText}>
          {currentLanguage.toUpperCase()}
        </Text>
      </TouchableOpacity>
      <Text style={styles.title}>{t(titleKey)}</Text>
      <View style={styles.logoContainer}>
        {user && avatarUrl ? (
          <Image source={{uri: avatarUrl}} style={styles.avatar} />
        ) : user ? (
          <View style={styles.emptyAvatar} />
        ) : (
          <Text style={styles.logoText}>LOGO</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
});

export default Header;
