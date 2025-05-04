import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Header from '../components/Header';
import firestore from '@react-native-firebase/firestore';
import {useTranslation} from 'react-i18next';
import BackBtn from '../components/BackBtn';

const ClientInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {clientId} = route.params;
  const [clientInfo, setClientInfo] = useState(null);
  const {t} = useTranslation();

  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!clientId) {
        return;
      }
      const doc = await firestore().collection('clients').doc(clientId).get();
      if (doc.exists) {
        setClientInfo({id: doc.id, ...doc.data()});
      }
    };

    fetchClientInfo();
  }, [clientId]);

  const handleWatchStatistics = () => {
    if (clientInfo) {
      navigation.navigate('ClientStatistics', {
        clientId: clientInfo.id,
        firstName: clientInfo.firstName,
        lastName: clientInfo.lastName,
      });
    }
  };

  if (!clientInfo) {
    return (
      <View style={styles.container}>
        <Header titleKey={'clientInfo'} />
        <BackBtn />
        <View style={styles.loadingContainer}>
          <Text>{t('loadingClientInfo')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header titleKey={'clientInfo'} />
      <BackBtn />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text
          style={
            styles.name
          }>{`${clientInfo.lastName} ${clientInfo.firstName}`}</Text>
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>{t('description')}:</Text>
          {clientInfo.description ? (
            <Text style={styles.descriptionText}>{clientInfo.description}</Text>
          ) : (
            <Text style={styles.noDescriptionText}>{t('noDescription')}.</Text>
          )}
        </View>

        {clientInfo.socialNetworks && clientInfo.socialNetworks.length > 0 && (
          <View style={styles.socialNetworksContainer}>
            <Text style={styles.socialNetworksTitle}>
              {t('socialNetworks')}:
            </Text>
            {clientInfo.socialNetworks.map((network, index) => (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  console.log(`Відкрити ${network.name}: ${network.url}`)
                }>
                <Text style={styles.socialNetworkLink}>
                  {network.name}: {network.url}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={handleWatchStatistics}
          style={styles.statisticsButton}>
          <Text style={styles.statisticsButtonText}>
            {t('watchStatistics')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    marginLeft: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    width: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  noDescriptionText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  socialNetworksContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  socialNetworksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  socialNetworkLink: {
    fontSize: 16,
    color: 'blue',
    marginBottom: 5,
  },
  statisticsButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  statisticsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ClientInfoScreen;
