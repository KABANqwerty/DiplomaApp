import React from 'react';
import LoginScreen from './src/Screens/LoginScreen';
import ForgotPasswordScreen from './src/Screens/ForgotPasswordScreen';
import {I18nextProvider} from 'react-i18next';
import i18n from './i18next';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './src/Screens/HomeScreen';
import ClientsScreen from './src/Screens/ClientsScreen';
import ClientInfoScreen from './src/Screens/ClientInfoScreen';
import TemplateScreen from './src/Screens/TemplateScreen';
import DayScheduleScreen from './src/Screens/DayScheduleScreen';
import TrainingScreen from './src/Screens/TrainingScreen';
import FolderContentScreen from './src/Screens/FolderContentScreen';
import EnterValueScreen from './src/Screens/EnterValueScreen';
import ClientStatisticsScreen from './src/Screens/ClientStatisticsScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Clients"
            component={ClientsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="ClientInfo"
            component={ClientInfoScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="ClientStatistics"
            component={ClientStatisticsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Template"
            component={TemplateScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="DaySchedule"
            component={DayScheduleScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Training"
            component={TrainingScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="FolderContent"
            component={FolderContentScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="EnterValue"
            component={EnterValueScreen}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </I18nextProvider>
  );
};

export default App;
