import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchDailyFortune } from '../../store/slices/tarotSlice';
import { fetchProfile } from '../../store/slices/authSlice';
import { Button, Card, Loading } from '../../components/common';
import { TarotCardComponent } from '../../components/cards';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';
import { MainNavigationProp } from '../../types/navigation';

interface HomeScreenProps {
  navigation: MainNavigationProp<'Home'>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { dailyFortune, isLoading } = useAppSelector((state) => state.tarot);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchProfile()).unwrap(),
        dispatch(fetchDailyFortune()).unwrap(),
      ]);
    } catch (error) {
      console.log('데이터 로드 실패:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침입니다';
    if (hour < 18) return '좋은 오후입니다';
    return '좋은 저녁입니다';
  };

  const getMembershipBadge = () => {
    switch (user?.membershipType) {
      case 'premium':
        return { text: 'Premium', color: colors.gold };
      case 'basic':
        return { text: 'Basic', color: colors.info };
      default:
        return { text: 'Free', color: colors.textSecondary };
    }
  };

  if (isLoading && !dailyFortune) {
    return <Loading fullScreen message="로딩 중..." />;
  }

  const membershipBadge = getMembershipBadge();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name}님</Text>
        </View>
        <View style={[styles.membershipBadge, { backgroundColor: membershipBadge.color }]}>
          <Text style={styles.membershipText}>{membershipBadge.text}</Text>
        </View>
      </View>

      {/* 오늘의 운세 */}
      {dailyFortune && (
        <Card style={styles.dailyFortuneCard} variant="elevated">
          <Text style={styles.cardTitle}>🌙 오늘의 운세</Text>
          <View style={styles.dailyFortuneContent}>
            {dailyFortune.cards && dailyFortune.cards.length > 0 && (
              <View style={styles.cardContainer}>
                <TarotCardComponent
                  card={dailyFortune.cards[0].cardId as any}
                  isReversed={dailyFortune.cards[0].orientation === 'reversed'}
                  size="medium"
                  showDetails
                />
              </View>
            )}
            <Text style={styles.interpretation} numberOfLines={4}>
              {dailyFortune.interpretation}
            </Text>
            <Button
              title="자세히 보기"
              variant="outline"
              size="small"
              onPress={() => navigation.navigate('Tarot', { screen: 'Reading', params: { readingId: dailyFortune.id } })}
            />
          </View>
        </Card>
      )}

      {/* 타로 리딩 시작 */}
      <Card style={styles.readingOptionsCard}>
        <Text style={styles.cardTitle}>타로 리딩 시작하기</Text>
        <View style={styles.readingOptions}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => navigation.navigate('Tarot', { screen: 'CardSelection', params: { type: 'single' } })}
          >
            <Icon name="card-outline" size={32} color={colors.primary} />
            <Text style={styles.optionTitle}>단일 카드</Text>
            <Text style={styles.optionSubtitle}>간단한 질문</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => navigation.navigate('Tarot', { screen: 'CardSelection', params: { type: 'three-card' } })}
          >
            <Icon name="albums-outline" size={32} color={colors.primary} />
            <Text style={styles.optionTitle}>3장 스프레드</Text>
            <Text style={styles.optionSubtitle}>과거-현재-미래</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, user?.membershipType !== 'premium' && styles.optionDisabled]}
            onPress={() => {
              if (user?.membershipType === 'premium') {
                navigation.navigate('Tarot', { screen: 'CardSelection', params: { type: 'celtic-cross' } });
              }
            }}
          >
            <Icon name="star-outline" size={32} color={user?.membershipType === 'premium' ? colors.gold : colors.textSecondary} />
            <Text style={styles.optionTitle}>켈틱 크로스</Text>
            <Text style={styles.optionSubtitle}>Premium</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* 히스토리 */}
      <Card style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>최근 리딩</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tarot', { screen: 'History' })}>
            <Text style={styles.viewAllText}>전체 보기</Text>
          </TouchableOpacity>
        </View>
        <Button
          title="리딩 히스토리 보기"
          variant="outline"
          fullWidth
          onPress={() => navigation.navigate('Tarot', { screen: 'History' })}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  membershipBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  membershipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  dailyFortuneCard: {
    margin: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dailyFortuneContent: {
    alignItems: 'center',
  },
  cardContainer: {
    marginBottom: spacing.md,
  },
  interpretation: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  readingOptionsCard: {
    margin: spacing.lg,
    marginTop: 0,
  },
  readingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  optionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  historyCard: {
    margin: spacing.lg,
    marginTop: 0,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});

export default HomeScreen;
