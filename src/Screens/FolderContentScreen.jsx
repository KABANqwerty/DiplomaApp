import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
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
import {firebaseAuth} from '../../firebase';
import {launchImageLibrary} from 'react-native-image-picker';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';

const generateUniqueId = () => {
  const timestamp = new Date().getTime();
  const randomNumber = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomNumber}`;
};

const FolderContentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {folderId, folderName} = route.params;
  const {t} = useTranslation();
  const currentTrainerId = firebaseAuth.currentUser?.uid;
  const [videos, setVideos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isNamingVideo, setIsNamingVideo] = useState(false);
  const [newVideoName, setNewVideoName] = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState(null);
  const [selectedVideoToPlay, setSelectedVideoToPlay] = useState(null);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState(null);

  const fetchFolderVideos = useCallback(async () => {
    if (!currentTrainerId || !folderId) {
      setVideos([]);
      return;
    }
    try {
      const videosCollection = await firestore()
        .collection('videos')
        .where('trainerId', '==', currentTrainerId)
        .where('folderId', '==', folderId)
        .orderBy('name')
        .get();
      const fetchedVideos = videosCollection.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(fetchedVideos);
    } catch (error) {
      console.error('Помилка отримання відео з папки:', error);
      Alert.alert(t('error'), t('failedToLoadFolderContent'));
      setVideos([]);
    }
  }, [currentTrainerId, folderId, t]);

  useEffect(() => {
    fetchFolderVideos();
  }, [fetchFolderVideos]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleUploadVideo = async () => {
    const options = {
      mediaType: 'video',
      quality: 0,
    };

    await launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('Користувач скасував вибір відео');
      } else if (response.error) {
        console.log('Помилка вибору відео: ', response.error);
        Alert.alert(t('error'), t('failedToSelectVideo'));
      } else if (response.assets && response.assets.length > 0) {
        setSelectedVideoType(response.assets[0].type);
        setIsNamingVideo(true);
        setSelectedVideoUri(response.assets[0].uri);
        setNewVideoName(
          response.assets[0].fileName || generateUniqueId() + '.mp4',
        );
      }
    });
  };

  const handleSaveVideoName = async () => {
    if (newVideoName.trim() === '') {
      Alert.alert(t('error'), t('videoNameCannotBeEmpty'));
      return;
    }

    if (!selectedVideoUri) {
      Alert.alert(t('error'), t('noVideoSelected'));
      return;
    }

    setIsNamingVideo(false);
    setIsUploading(true);
    Alert.alert(t('info'), t('savingVideo'));

    const uniqueId = generateUniqueId();
    const videoFileName = `${newVideoName.replace(/\s+/g, '_')}_${uniqueId}.${
      selectedVideoType ? selectedVideoType.split('/')[1] : 'mp4'
    }`;
    const localVideoPath = `${RNFS.DocumentDirectoryPath}/${videoFileName}`;

    try {
      await RNFS.copyFile(selectedVideoUri, localVideoPath);

      const newVideo = {
        trainerId: currentTrainerId,
        folderId: folderId,
        name: newVideoName,
        url: `file://${localVideoPath}`,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('videos').add(newVideo);
      await fetchFolderVideos();
      Alert.alert(t('success'), t('videoSavedSuccessfully'));
    } catch (error) {
      console.error('Помилка збереження відео:', error);
      Alert.alert(t('error'), t('failedToSaveVideo'));
    } finally {
      setIsUploading(false);
      setNewVideoName('');
      setSelectedVideoUri(null);
      setSelectedVideoType(null);
    }
  };

  const handleCancelNaming = () => {
    setIsNamingVideo(false);
    setNewVideoName('');
    setSelectedVideoUri(null);
    setSelectedVideoType(null);
  };

  const filteredVideos = useMemo(() => {
    if (!searchText) {
      return videos;
    }
    const lowerCaseSearchText = searchText.toLowerCase();
    return videos.filter(video =>
      video.name.toLowerCase().includes(lowerCaseSearchText),
    );
  }, [videos, searchText]);

  const renderVideoItem = ({item}) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => {
        setSelectedVideoToPlay(item.url);
        setIsVideoPlayerVisible(true);
      }}>
      <Text style={styles.videoIcon}>🎬</Text>
      <Text style={styles.videoName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title={folderName} />
      <View style={styles.header}>
        <BackBtn onPress={handleGoBack} />
        <TouchableOpacity onPress={handleUploadVideo} disabled={isUploading}>
          <Text style={styles.addButtonText}>{isUploading ? '...' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchVideos')}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredVideos}
        renderItem={renderVideoItem}
        keyExtractor={item => item.id}
        numColumns={2}
        ListEmptyComponent={
          <Text style={styles.emptyList}>{t('noVideosInFolder')}</Text>
        }
      />

      <Modal
        visible={isNamingVideo}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelNaming}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('enterVideoName')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('videoName')}
              value={newVideoName}
              onChangeText={setNewVideoName}
            />
            <View style={styles.modalButtons}>
              <Button title={t('cancel')} onPress={handleCancelNaming} />
              <Button title={t('save')} onPress={handleSaveVideoName} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isVideoPlayerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsVideoPlayerVisible(false);
          setSelectedVideoToPlay(null);
        }}>
        <View style={styles.videoPlayerModal}>
          {selectedVideoToPlay && (
            <Video
              source={{uri: selectedVideoToPlay}}
              style={styles.videoPlayer}
              controls={true}
              resizeMode="contain"
              onError={error =>
                console.error('Помилка відтворення відео:', error)
              }
            />
          )}
          <Button
            title={t('close')}
            onPress={() => {
              setIsVideoPlayerVisible(false);
              setSelectedVideoToPlay(null);
            }}
          />
        </View>
      </Modal>
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
  videoItem: {
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
  videoIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  videoName: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyList: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: 'gray',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  videoPlayerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  videoPlayer: {
    width: '90%',
    height: 300,
  },
});

export default FolderContentScreen;
