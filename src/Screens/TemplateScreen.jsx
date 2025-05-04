import React, {useEffect, useState, useCallback} from 'react';
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

const TemplateScreen = () => {
  const navigation = useNavigation();
  const [templateRows, setTemplateRows] = useState([]);
  const [newRowName, setNewRowName] = useState('');
  const [existingTemplate, setExistingTemplate] = useState(null);
  const {t} = useTranslation();
  const currentTrainerId = firebaseAuth.currentUser?.uid;

  const fetchExistingTemplate = useCallback(async () => {
    if (!currentTrainerId) {
      console.log('Тренер не авторизований.');
      return;
    }
    try {
      const templateCollection = await firestore()
        .collection('templates')
        .where('trainerId', '==', currentTrainerId)
        .limit(1)
        .get();

      if (!templateCollection.empty) {
        const templateDoc = templateCollection.docs[0];
        setExistingTemplate({id: templateDoc.id, ...templateDoc.data()});
        setTemplateRows(templateDoc.data().rows || []);
      } else {
        setExistingTemplate(null);
        setTemplateRows([]);
      }
    } catch (error) {
      console.error('Помилка отримання шаблону:', error);
      Alert.alert(t('error'), t('failedToLoadTemplate'));
    }
  }, [currentTrainerId, t]);

  useEffect(() => {
    fetchExistingTemplate();
  }, [fetchExistingTemplate]);

  const handleAddRow = () => {
    if (newRowName.trim()) {
      setTemplateRows([
        ...templateRows,
        {id: Date.now().toString(), name: newRowName.trim()},
      ]);
      setNewRowName('');
    }
  };

  const handleRemoveRow = rowId => {
    setTemplateRows(templateRows.filter(row => row.id !== rowId));
  };

  const handleSaveTemplate = async () => {
    if (!currentTrainerId) {
      Alert.alert(t('error'), t('trainerNotAuthorized'));
      return;
    }

    try {
      const templateData = {
        trainerId: currentTrainerId,
        rows: templateRows,
      };

      if (existingTemplate) {
        await firestore()
          .collection('templates')
          .doc(existingTemplate.id)
          .update(templateData);
        Alert.alert(t('success'), t('templateUpdated'));
      } else {
        await firestore().collection('templates').add(templateData);
        Alert.alert(t('success'), t('templateCreated'));
        fetchExistingTemplate(); // Оновлюємо стан для відображення редагування
      }
    } catch (error) {
      console.error('Помилка збереження шаблону:', error);
      Alert.alert(t('error'), t('failedToSaveTemplate'));
    }
  };

  const renderRowItem = ({item}) => (
    <View style={styles.rowItem}>
      <Text>{item.name}</Text>
      <TouchableOpacity onPress={() => handleRemoveRow(item.id)}>
        <Text style={styles.removeButton}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header titleKey={'template'} />
      <BackBtn />

      <View style={styles.content}>
        <View style={styles.addRowContainer}>
          <TextInput
            style={styles.newRowInput}
            placeholder={t('newRowName')}
            value={newRowName}
            onChangeText={setNewRowName}
          />
          <Button title={t('addRow')} onPress={handleAddRow} />
        </View>

        {templateRows.length > 0 && (
          <FlatList
            data={templateRows}
            renderItem={renderRowItem}
            keyExtractor={item => item.id}
            style={styles.rowsList}
          />
        )}

        <Button title={t('saveTemplate')} onPress={handleSaveTemplate} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  addRowContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  newRowInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  rowsList: {
    marginBottom: 20,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  removeButton: {
    fontSize: 20,
    color: 'red',
    fontWeight: 'bold',
    marginLeft: 15,
  },
});

export default TemplateScreen;
