import React, {useCallback, useEffect, useState} from 'react';
import {Dimensions, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import {useTranslation} from 'react-i18next';
import Header from '../components/Header';
import BackBtn from '../components/BackBtn';
import {LineChart} from 'react-native-chart-kit';
import {firebaseAuth} from '../../firebase';
import {format} from 'date-fns';

const ClientStatisticsScreen = () => {
  const route = useRoute();
  const {clientId, firstName, lastName} = route.params;
  const [template, setTemplate] = useState(null);
  const [progressRecords, setProgressRecords] = useState([]);
  const {t} = useTranslation();
  const currentTrainerId = firebaseAuth.currentUser?.uid;
  const screenWidth = Dimensions.get('window').width;

  const fetchTemplate = useCallback(async () => {
    if (!clientId || !currentTrainerId) {
      return;
    }
    const templateSnapshot = await firestore()
      .collection('templates')
      .where('trainerId', '==', currentTrainerId)
      .limit(1)
      .get();
    if (!templateSnapshot.empty) {
      setTemplate(templateSnapshot.docs[0].data());
    }
  }, [clientId, currentTrainerId]);

  const fetchProgressRecords = useCallback(async () => {
    if (!clientId) {
      return;
    }
    const recordsSnapshot = await firestore()
      .collection('progressRecords')
      .where('clientId', '==', clientId)
      .orderBy('date', 'asc')
      .get();
    setProgressRecords(
      recordsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})),
    );
  }, [clientId]);

  useEffect(() => {
    Promise.all([fetchTemplate(), fetchProgressRecords()]);
  }, [fetchTemplate, fetchProgressRecords]);

  const headerTitle =
    firstName && lastName ? `${firstName} ${lastName}` : t('clientStatistics');

  if (!template?.rows) {
    return (
      <View>
        <Header titleKey={headerTitle} />
        <BackBtn />
        <Text>{t('noTemplateData')}</Text>
      </View>
    );
  }
  if (progressRecords.length === 0) {
    return (
      <View>
        <Header titleKey={headerTitle} />
        <BackBtn />
        <Text>{t('noProgressRecords')}</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
  };

  console.log(headerTitle);
  return (
    <View style={styles.container}>
      <Header titleKey={headerTitle} />
      <BackBtn />
      <ScrollView>
        {template.rows.map(row => {
          const chartData = {
            labels: progressRecords.map(record =>
              format(record.date.toDate(), 'dd.MM'),
            ),
            datasets: [
              {
                data: progressRecords.map(
                  record => record.values?.[row.id] || 0,
                ),
                strokeWidth: 2,
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              },
            ],
          };

          const validDataPoints = progressRecords.filter(
            record => record.values?.[row.id] !== undefined,
          );
          chartData.labels = validDataPoints.map(record =>
            format(record.date.toDate(), 'dd.MM'),
          );
          chartData.datasets[0].data = validDataPoints.map(
            record => record.values?.[row.id] || 0,
          );

          if (chartData.datasets[0].data.length < 2) {
            return (
              <View key={row.id} style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{t(row.name)}</Text>
                <Text style={styles.noDataText}>
                  {t('notEnoughDataForChart')}
                </Text>
              </View>
            );
          }

          return (
            <View key={row.id} style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{t(row.name)}</Text>
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{marginVertical: 8}}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  chartContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataText: {fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 10},
});

export default ClientStatisticsScreen;
