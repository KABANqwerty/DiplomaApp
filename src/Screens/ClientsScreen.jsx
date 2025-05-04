import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Header from '../components/Header';
import firestore from '@react-native-firebase/firestore';
import {useTranslation} from 'react-i18next';
import BackBtn from '../components/BackBtn';
import {firebaseAuth} from '../../firebase'; // Import для отримання ID тренера

const ClientsScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [clients, setClients] = useState([]);
  const [lastTap, setLastTap] = useState(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientFirstName, setNewClientFirstName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const {t} = useTranslation();
  const currentTrainerId = firebaseAuth.currentUser?.uid;

  const fetchClients = useCallback(async () => {
    if (!currentTrainerId) {
      console.log('Тренер не авторизований.');
      return;
    }
    try {
      const clientsCollection = await firestore()
        .collection('clients')
        .where('trainerId', '==', currentTrainerId)
        .get();
      const fetchedClients = clientsCollection.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(fetchedClients);
    } catch (error) {
      console.error('Помилка отримання клієнтів:', error);
      Alert.alert(t('error'), t('failedToLoadClients'));
    }
  }, [currentTrainerId, t]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = () => {
    setIsAddingClient(true);
  };

  const handleSaveNewClient = async () => {
    if (!newClientFirstName.trim() || !newClientLastName.trim()) {
      Alert.alert(t('error'), t('enterFirstNameAndLastName'));
      return;
    }

    if (!currentTrainerId) {
      Alert.alert(t('error'), t('trainerNotAuthorized'));
      return;
    }

    try {
      await firestore().collection('clients').add({
        firstName: newClientFirstName,
        lastName: newClientLastName,
        trainerId: currentTrainerId, // Додаємо ID тренера до даних клієнта
      });
      setNewClientFirstName('');
      setNewClientLastName('');
      setIsAddingClient(false);
      await fetchClients();
    } catch (error) {
      console.error('Помилка додавання клієнта:', error);
      Alert.alert(t('error'), t('failedToAddClient'));
    }
  };

  const handleCancelAddClient = () => {
    setIsAddingClient(false);
    setNewClientFirstName('');
    setNewClientLastName('');
  };

  const handleDoubleTap = client => {
    console.log('Подвійний клік на клієнті:', client);
    navigation.navigate('ClientInfo', {clientId: client.id});
  };

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

  const renderClientItem = ({item}) => (
    <TouchableOpacity
      onPress={() => {}}
      onLongPress={() => {}}
      delayLongPress={300}
      onPressIn={() => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
          handleDoubleTap(item);
        }
        setLastTap(now);
      }}>
      <View style={styles.clientItem}>
        <Text
          style={
            styles.clientName
          }>{`${item.firstName} ${item.lastName}`}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header titleKey={'clients'} />
      <View style={styles.header}>
        <BackBtn />
        <TouchableOpacity onPress={handleAddClient}>
          <Text style={styles.addButtonText}>{'+'}</Text>
        </TouchableOpacity>
      </View>

      {isAddingClient && (
        <View style={styles.addClientContainer}>
          <TextInput
            style={styles.addClientInput}
            placeholder={t('firstName')}
            value={newClientFirstName}
            onChangeText={setNewClientFirstName}
          />
          <TextInput
            style={styles.addClientInput}
            placeholder={t('lastName')}
            value={newClientLastName}
            onChangeText={setNewClientLastName}
          />
          <View style={styles.addClientButtons}>
            <Button title={t('save')} onPress={handleSaveNewClient} />
            <Button
              title={t('cancel')}
              onPress={handleCancelAddClient}
              color="red"
            />
          </View>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder={t('searchClients')}
        value={searchText}
        onChangeText={setSearchText}
      />
      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={item => item.id}
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
    marginBottom: 10,
    paddingRight: 20,
  },
  addButtonText: {
    fontSize: 30,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  clientItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  clientName: {
    fontSize: 18,
  },
  addClientContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  addClientInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addClientButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default ClientsScreen;
