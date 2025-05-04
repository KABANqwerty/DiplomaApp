import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import Header from '../components/Header';
import BackBtn from '../components/BackBtn';
import firestore from '@react-native-firebase/firestore';
import {useTranslation} from 'react-i18next';
import {firebaseAuth} from '../../firebase';
import {useNavigation} from '@react-navigation/native';

const TrainingScreen = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const currentTrainerId = firebaseAuth.currentUser?.uid;
  const [folders, setFolders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fetchTrainingFolders = useCallback(async () => {
    if (!currentTrainerId) {
      setFolders([]);
      return;
    }
    try {
      const foldersCollection = await firestore()
        .collection('trainingFolders')
        .where('trainerId', '==', currentTrainerId)
        .orderBy('name')
        .get();
      const fetchedFolders = foldersCollection.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('Помилка отримання папок тренувань:', error);
      Alert.alert(t('error'), t('failedToLoadTrainingFolders'));
      setFolders([]);
    }
  }, [currentTrainerId, t]);

  useEffect(() => {
    fetchTrainingFolders();
  }, [fetchTrainingFolders]);

  const handleCreateNewFolder = () => {
    setIsCreatingNewFolder(true);
  };

  const handleSaveNewFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert(t('error'), t('enterFolderName'));
      return;
    }
    if (!currentTrainerId) {
      Alert.alert(t('error'), t('notLoggedIn'));
      return;
    }
    try {
      await firestore().collection('trainingFolders').add({
        trainerId: currentTrainerId,
        name: newFolderName.trim(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setIsCreatingNewFolder(false);
      setNewFolderName('');
      await fetchTrainingFolders();
      Alert.alert(t('success'), t('folderCreatedSuccessfully'));
    } catch (error) {
      console.error('Помилка створення папки:', error);
      Alert.alert(t('error'), t('failedToCreateFolder'));
    }
  };

  const handleCancelNewFolder = () => {
    setIsCreatingNewFolder(false);
    setNewFolderName('');
  };

  const filteredFolders = useMemo(() => {
    if (!searchText) {
      return folders;
    }
    const lowerCaseSearchText = searchText.toLowerCase();
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(lowerCaseSearchText),
    );
  }, [folders, searchText]);

  const renderFolderItem = ({item}) => (
    <TouchableOpacity
      style={styles.folderItem}
      onPress={() => {
        navigation.navigate('FolderContent', {
          folderId: item.id,
          folderName: item.name,
        });
      }}>
      <Text style={styles.folderIcon}>📂</Text>
      <Text style={styles.folderName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header titleKey={'training'} />
      <View style={styles.header}>
        <BackBtn />
        <TouchableOpacity onPress={handleCreateNewFolder}>
          <Text style={styles.addButtonText}>{'+'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchFolders')}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {isCreatingNewFolder && (
        <View style={styles.newFolderContainer}>
          <TextInput
            style={styles.newFolderInput}
            placeholder={t('enterFolderName')}
            value={newFolderName}
            onChangeText={setNewFolderName}
          />
          <View style={styles.newFolderButtons}>
            <Button title={t('save')} onPress={handleSaveNewFolder} />
            <Button
              title={t('cancel')}
              onPress={handleCancelNewFolder}
              color="red"
            />
          </View>
        </View>
      )}

      <FlatList
        data={filteredFolders}
        renderItem={renderFolderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        ListEmptyComponent={
          <Text style={styles.emptyList}>{t('noFoldersCreated')}</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  searchContainer: {
    marginVertical: 15,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  folderItem: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    paddingVertical: 15,
  },
  folderIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  folderName: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyList: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: 'gray',
  },
  newFolderContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  newFolderInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  newFolderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default TrainingScreen;
