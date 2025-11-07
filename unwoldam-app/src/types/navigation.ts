import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { ReadingType, ReadingContext } from './models';

// Auth Stack
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

// Main Tab
export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

// Tarot Stack
export type TarotStackParamList = {
  SpreadSelection: undefined;
  CardSelection: {
    type: ReadingType;
    context?: ReadingContext;
  };
  Reading: {
    readingId: string;
  };
  DailyFortune: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Tarot: undefined;
  Premium: undefined;
  Settings: undefined;
};

// Navigation Props
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;
export type MainNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<RootStackParamList>
>;
export type TarotNavigationProp = StackNavigationProp<TarotStackParamList>;

// Route Props
export type CardSelectionRouteProp = RouteProp<TarotStackParamList, 'CardSelection'>;
export type ReadingRouteProp = RouteProp<TarotStackParamList, 'Reading'>;

// Combined Navigation Prop
export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
