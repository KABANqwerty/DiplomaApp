import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';

const BackBtn = () => {
  const navigation = useNavigation();
  const handleGoBack = () => {
    navigation.goBack();
  };
  return (
    <TouchableOpacity onPress={handleGoBack}>
      <Text style={styles.backButtonText}>{'←'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButtonText: {
    fontSize: 30,
  },
});

export default BackBtn;
