import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

const Footer = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const handleFooterIconPress = iconName => {
    switch (iconName) {
      case 'clients':
        navigation.navigate('Clients');
        break;
      case 'templates':
        navigation.navigate('Template');
        break;
      case 'training':
        navigation.navigate('Training');
        break;
    }
  };
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.footerItem}
        onPress={() => handleFooterIconPress('clients')}>
        <Text style={styles.footerIcon}>👤</Text>
        <Text style={styles.footerText}>{t('clients')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.footerItem}
        onPress={() => handleFooterIconPress('templates')}>
        <Text style={styles.footerIcon}>📄</Text>
        <Text style={styles.footerText}>{t('templates')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.footerItem}
        onPress={() => handleFooterIconPress('training')}>
        <Text style={styles.footerIcon}>📂</Text>
        <Text style={styles.footerText}>{t('training')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.footerItem}
        onPress={() => handleFooterIconPress('settings')}>
        <Text style={styles.footerIcon}>⚙️</Text>
        <Text style={styles.footerText}>{t('settings')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#f8f8f8',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  footerText: {
    fontSize: 12,
  },
});

export default Footer;
