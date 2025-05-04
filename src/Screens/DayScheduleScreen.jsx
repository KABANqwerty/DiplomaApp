import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Button,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Header from '../components/Header';
import BackBtn from '../components/BackBtn';
import firestore from '@react-native-firebase/firestore';
import {useTranslation} from 'react-i18next';
import {endOfDay, format, parseISO, startOfDay} from 'date-fns';
import {enGB, uk} from 'date-fns/locale';
import {firebaseAuth} from '../../firebase';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const DayScheduleScreen = () => {
  const route = useRoute();
  const {selectedDate} = route.params;
  const [schedule, setSchedule] = useState([]);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [availableClients, setAvailableClients] = useState([]);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');
  const {t, i18n} = useTranslation();
  const navigation = useNavigation();
  const currentTrainerId = firebaseAuth.currentUser?.uid;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  const currentLocale = i18n.language === 'uk' ? uk : enGB;
  const parsedDate = useMemo(() => {
    return selectedDate ? parseISO(selectedDate) : null;
  }, [selectedDate]);

  const formattedDate = parsedDate
    ? format(parsedDate, 'd MMMM', {locale: currentLocale})
    : '';

  const fetchScheduleForDate = useCallback(async () => {
    if (!currentTrainerId || !parsedDate) {
      setSchedule([]);
      return;
    }

    const start = startOfDay(parsedDate);
    const end = endOfDay(parsedDate);

    try {
      const scheduleCollection = await firestore()
        .collection('schedule')
        .where('trainerId', '==', currentTrainerId)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .orderBy('date')
        .orderBy('time')
        .get();

      const fetchedSchedule = scheduleCollection.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSchedule(fetchedSchedule);
    } catch (error) {
      Alert.alert(t('error'), t('failedToLoadSchedule'));
      setSchedule([]);
    }
  }, [currentTrainerId, parsedDate, t]);

  const fetchAvailableClientsForTrainer = useCallback(async () => {
    if (!currentTrainerId) {
      setAvailableClients([]);
      return;
    }
    try {
      const clientsCollection = await firestore()
        .collection('clients')
        .where('trainerId', '==', currentTrainerId)
        .get();
      const fetchedClients = clientsCollection.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().firstName} ${doc.data().lastName}`,
      }));
      setAvailableClients(fetchedClients);
    } catch (error) {
      Alert.alert(t('error'), t('failedToLoadClientsForAppointment'));
      setAvailableClients([]);
    }
  }, [currentTrainerId, t]);

  useEffect(() => {
    fetchScheduleForDate();
  }, [fetchScheduleForDate]);

  useEffect(() => {
    fetchAvailableClientsForTrainer();
  }, [fetchAvailableClientsForTrainer]);

  const handleAddAppointment = () => {
    setIsAddingAppointment(true);
    setSelectedClientId(null);
    setAppointmentTime('');
    setAppointmentDescription('');
    setSelectedTime(new Date());
  };

  const handleSaveAppointment = async () => {
    if (!selectedClientId) {
      Alert.alert(t('error'), t('selectClient'));
      return;
    }
    if (!appointmentTime) {
      Alert.alert(t('error'), t('enterAppointmentTime'));
      return;
    }

    try {
      const appointmentDateTime = new Date(parsedDate);
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      await firestore().collection('schedule').add({
        trainerId: currentTrainerId,
        clientId: selectedClientId,
        date: appointmentDateTime,
        time: appointmentTime,
        description: appointmentDescription,
      });
      setIsAddingAppointment(false);
      await fetchScheduleForDate();
    } catch (error) {
      Alert.alert(t('error'), t('failedToSaveAppointment'));
    }
  };

  const handleCancelAppointment = () => {
    setIsAddingAppointment(false);
  };

  const renderScheduleItem = ({item}) => (
    <TouchableOpacity
      style={styles.scheduleItem}
      onPress={() => {
        navigation.navigate('EnterValue', {
          appointmentId: item.id,
          clientId: item.clientId,
          selectedDate: selectedDate,
        });
      }}>
      <Text style={styles.scheduleTime}>{item.time}</Text>
      <Text>
        {t('client')}:{' '}
        {availableClients.find(client => client.id === item.clientId)?.name ||
          t('unknownClient')}
      </Text>
      {item.description && (
        <Text style={styles.scheduleDescription}>
          {t('description')}: {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  const hideTimepicker = () => {
    setShowTimePicker(false);
  };

  const handleTimeChange = (event, selected) => {
    hideTimepicker();
    if (selected) {
      const formattedTime = format(selected, 'HH:mm');
      setAppointmentTime(formattedTime);
      setSelectedTime(selected);
    }
  };

  return (
    <View style={styles.container}>
      <Header titleKey={'daySchedule'} />
      <BackBtn />

      <View style={styles.header}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <TouchableOpacity
          onPress={handleAddAppointment}
          style={styles.addButton}>
          <Text style={styles.addButtonText}>{t('addAppointment')}</Text>
        </TouchableOpacity>
      </View>

      {isAddingAppointment && (
        <View style={styles.addAppointmentContainer}>
          <Text style={styles.addAppointmentTitle}>{t('newAppointment')}</Text>
          <View style={styles.inputGroup}>
            <Picker
              selectedValue={selectedClientId}
              style={styles.picker}
              onValueChange={itemValue => setSelectedClientId(itemValue)}>
              <Picker.Item label={t('selectClient')} value={null} />
              {availableClients.map(client => (
                <Picker.Item
                  key={client.id}
                  label={client.name}
                  value={client.id}
                />
              ))}
            </Picker>
          </View>
          <TouchableOpacity onPress={showTimepicker} style={styles.timeInput}>
            <Text>{appointmentTime || t('selectTime')}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              testID="timePicker"
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'android' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              locale={i18n.language}
            />
          )}
          <TextInput
            style={styles.multilineInput}
            placeholder={t('descriptionOptional')}
            value={appointmentDescription}
            onChangeText={setAppointmentDescription}
            multiline
          />
          <View style={styles.buttonsContainer}>
            <Button title={t('save')} onPress={handleSaveAppointment} />
            <Button
              title={t('cancel')}
              onPress={handleCancelAppointment}
              color="red"
            />
          </View>
        </View>
      )}

      <FlatList
        data={schedule}
        renderItem={renderScheduleItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptySchedule}>
            {t('noAppointments')} {formattedDate}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  scheduleItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scheduleDescription: {
    fontSize: 14,
    color: 'gray',
  },
  emptySchedule: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: 'gray',
  },
  addAppointmentContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
  },
  addAppointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  multilineInput: {
    height: 80,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  picker: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  timeInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  selectedClientText: {
    color: 'blue',
    marginTop: 5,
  },
});

export default DayScheduleScreen;
