import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '../../components/common';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';
import { TarotNavigationProp } from '../../types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';

interface TarotMainScreenProps {
  navigation: TarotNavigationProp<'TarotMain'>;
}

const TarotMainScreen: React.FC<TarotMainScreenProps> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌙 타로 리딩</Text>
        <Text style={styles.subtitle}>당신의 운명을 알아보세요</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="card-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>단일 카드 리딩</Text>
        <Text style={styles.cardDescription}>
          간단한 질문에 대한 명확한 답을 얻으세요
        </Text>
        <Button
          title="시작하기"
          onPress={() => navigation.navigate('CardSelection', { type: 'single' })}
          fullWidth
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="albums-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>3장 스프레드</Text>
        <Text style={styles.cardDescription}>
          과거, 현재, 미래를 통해 상황을 파악하세요
        </Text>
        <Button
          title="시작하기"
          onPress={() => navigation.navigate('CardSelection', { type: 'three-card' })}
          fullWidth
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="star-outline" size={48} color={colors.gold} />
        </View>
        <Text style={styles.cardTitle}>켈틱 크로스</Text>
        <Text style={styles.cardDescription}>
          종합적이고 깊이 있는 리딩 (Premium 전용)
        </Text>
        <Button
          title="시작하기"
          onPress={() => navigation.navigate('CardSelection', { type: 'celtic-cross' })}
          fullWidth
        />
      </Card>

      <Button
        title="리딩 히스토리"
        variant="outline"
        onPress={() => navigation.navigate('History')}
        fullWidth
        style={styles.historyButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  card: {
    margin: spacing.lg,
    marginTop: 0,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  historyButton: {
    margin: spacing.lg,
    marginTop: 0,
  },
});

export default TarotMainScreen;
