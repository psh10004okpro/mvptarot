import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TarotStackParamList } from '../types/navigation';
import TarotMainScreen from '../screens/Tarot/TarotMainScreen';

const Stack = createStackNavigator<TarotStackParamList>();

const TarotStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: '#0f1419' },
      }}
    >
      <Stack.Screen
        name="TarotMain"
        component={TarotMainScreen}
        options={{ headerShown: false }}
      />
      {/* CardSelection, Reading, History는 추후 구현 */}
    </Stack.Navigator>
  );
};

export default TarotStack;
