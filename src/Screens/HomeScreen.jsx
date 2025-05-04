import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Header from '../components/Header.jsx';
import {useTranslation} from 'react-i18next';
import {firebaseAuth} from '../../firebase';
import firestore from '@react-native-firebase/firestore';
import {Calendar} from 'react-native-calendars';
import {useNavigation} from '@react-navigation/native';
import {format} from 'date-fns';
import {uk} from 'date-fns/locale';
import Footer from '../components/Footer';

const HomeScreen = () => {
  const {t, i18n} = useTranslation();
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [lastTap, setLastTap] = useState(null);
  const navigation = useNavigation();

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
            setUsername(userDoc.data().username || '');
          } else {
            setUsername('');
          }
        } else {
          setUsername('');
        }
      },
    );

    return () => unsubscribeAuth();
  }, []);

  const handleDayPress = day => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      navigation.navigate('DaySchedule', {selectedDate: day.dateString});
    }
    setLastTap(now);
  };

  const renderCustomHeader = date => {
    const currentLocaleCode = i18n.language;
    let locale = null;

    switch (currentLocaleCode) {
      case 'uk':
        locale = uk;
        break;
      case 'en':
      default:
        break;
    }

    const formattedDate = format(date, 'MMMM yyyy', {locale});
    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>{formattedDate}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header titleKey="home" />
      <View style={styles.content}>
        <Text style={styles.greeting}>
          {user ? t('greeting', {username}) : t('notLoggedIn')}
        </Text>
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDayPress}
            renderHeader={renderCustomHeader}
            style={styles.calendar}
          />
        </View>
      </View>
      <Footer />
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
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  notLoggedIn: {
    fontSize: 18,
    fontStyle: 'italic',
  },
  header: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarContainer: {
    width: '100%',
    marginTop: 20,
  },
  calendar: {},
});

export default HomeScreen;
