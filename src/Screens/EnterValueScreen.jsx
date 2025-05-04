import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import {useTranslation} from 'react-i18next';
import Header from '../components/Header';
import BackBtn from '../components/BackBtn';
import {firebaseAuth} from '../../firebase';
import {parseISO} from 'date-fns';

const EnterValuesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {clientId, selectedDate} = route.params;
  const [clientTemplate, setClientTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const {t} = useTranslation();
  const currentTrainerId = firebaseAuth.currentUser?.uid;
  const [existingRecordId, setExistingRecordId] = useState(null);

  const fetchClientTemplate = useCallback(async () => {
    if (!clientId) {
      return;
    }
    try {
      const templateSnapshot = await firestore()
        .collection('templates')
        .where('trainerId', '==', currentTrainerId)
        .limit(1)
        .get();
      if (!templateSnapshot.empty) {
        setClientTemplate(templateSnapshot.docs[0].data());
      } else {
        setClientTemplate({rows: []});
      }
    } catch (error) {
      console.error(t('templateLoadingError'), error);
      Alert.alert(t('error'), t('failedToLoadTemplate'));
    }
  }, [clientId, currentTrainerId, t]);

  const fetchExistingRecord = useCallback(async () => {
    if (!clientId || !selectedDate) {
      return;
    }
    try {
      const firestoreDate = firestore.Timestamp.fromDate(
        parseISO(selectedDate),
      );
      const existingRecordSnapshot = await firestore()
        .collection('progressRecords')
        .where('clientId', '==', clientId)
        .where('date', '==', firestoreDate)
        .limit(1)
        .get();

      if (!existingRecordSnapshot.empty) {
        const existingData = existingRecordSnapshot.docs[0].data();
        setExistingRecordId(existingRecordSnapshot.docs[0].id);
        setValues(existingData.values || {});
      } else {
        const initialValues = {};
        if (clientTemplate?.rows) {
          clientTemplate.rows.forEach(row => {
            initialValues[row.id] = '';
          });
          setValues(initialValues);
        }
        setExistingRecordId(null);
      }
    } catch (error) {
      console.error(t('errorFetchingExistingRecord'), error);
      Alert.alert(t('error'), t('errorFetchingExistingRecord'));
    }
  }, [clientId, selectedDate, clientTemplate, t]);

  useEffect(() => {
    fetchClientTemplate();
  }, [fetchClientTemplate]);

  useEffect(() => {
    fetchExistingRecord();
  }, [fetchExistingRecord]);

  useEffect(() => {
    if (
      clientTemplate?.rows &&
      Object.keys(values).length === 0 &&
      !existingRecordId
    ) {
      const initialValues = {};
      const initialErrors = {};
      clientTemplate.rows.forEach(row => {
        initialValues[row.id] = '';
        initialErrors[row.id] = '';
      });
      setValues(initialValues);
      setErrors(initialErrors);
    } else if (clientTemplate?.rows && Object.keys(values).length > 0) {
      const initialErrors = {};
      clientTemplate.rows.forEach(row => {
        initialErrors[row.id] = '';
      });
      setErrors(initialErrors);
    }
  }, [clientTemplate, values, existingRecordId]);

  const handleValueChange = (rowId, text) => {
    setValues(prevValues => ({...prevValues, [rowId]: text}));
    setErrors(prevErrors => ({...prevErrors, [rowId]: ''}));
  };

  const handleSaveValues = async () => {
    const valuesToSave = {};
    const errorsOccurred = {};
    let hasErrors = false;

    const firestoreDate = selectedDate
      ? firestore.Timestamp.fromDate(parseISO(selectedDate))
      : null;

    if (!firestoreDate) {
      Alert.alert(t('error'), t('dateMissing'));
      return;
    }

    if (clientTemplate?.rows) {
      clientTemplate.rows.forEach(row => {
        const inputValue = values[row.id];

        if (inputValue === '' || inputValue == null) {
          errorsOccurred[row.id] = t('requiredField');
          hasErrors = true;
        } else {
          const parsed = parseFloat(String(inputValue).replace(',', '.'));
          if (isNaN(parsed)) {
            errorsOccurred[row.id] = t('invalidNumber');
            hasErrors = true;
          } else {
            valuesToSave[row.id] = parsed;
          }
        }
      });
    }

    setErrors(errorsOccurred);

    if (hasErrors) {
      Alert.alert(t('error'), t('pleaseCorrectErrors'));
      return;
    }

    try {
      const dataToSave = {
        clientId,
        date: firestoreDate,
        values: valuesToSave,
      };

      if (existingRecordId) {
        await firestore()
          .collection('progressRecords')
          .doc(existingRecordId)
          .set(dataToSave, {merge: true});
        Alert.alert(t('success'), t('valuesUpdated'));
      } else {
        await firestore().collection('progressRecords').add(dataToSave);
        Alert.alert(t('success'), t('valuesSaved'));
      }

      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t('error'), t('failedToSaveValues'));
    }
  };

  if (!clientTemplate) {
    return (
      <View style={styles.container}>
        <Header titleKey={'enterClientValues'} />
        <BackBtn />
        <Text>{t('loadingTemplate')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header titleKey={'enterClientValues'} />
      <BackBtn />
      <ScrollView style={styles.content}>
        {clientTemplate.rows.map(row => (
          <View key={row.id} style={styles.inputGroup}>
            <Text style={styles.label}>{t(row.name)}</Text>
            <TextInput
              key={`input-${row.id}`}
              style={[styles.input, errors[row.id] && styles.inputError]}
              placeholder={t('enterValue')}
              keyboardType="decimal-pad"
              value={
                values[row.id] !== undefined
                  ? String(values[row.id]).replace('.', ',')
                  : ''
              }
              onChangeText={text => handleValueChange(row.id, text)}
            />
            <Text style={styles.errorPlaceholder}>{errors[row.id]}</Text>
          </View>
        ))}
        {clientTemplate.rows.length > 0 && (
          <Button title={t('save')} onPress={handleSaveValues} />
        )}
      </ScrollView>
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
  },
  inputGroup: {
    marginBottom: 30,
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
  inputError: {
    borderColor: 'red',
  },
  errorPlaceholder: {
    color: 'red',
    fontSize: 12,
    marginTop: 3,
    minHeight: 16,
  },
});

export default EnterValuesScreen;
