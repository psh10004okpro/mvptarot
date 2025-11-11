import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Button, Card } from '../../components/common';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { currentSubscription } = useAppSelector((state) => state.subscription);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
          },
        },
      ]
    );
  };

  const getMembershipInfo = () => {
    switch (user?.membershipType) {
      case 'premium':
        return {
          name: 'Premium',
          color: colors.gold,
          icon: 'star',
          dailyLimit: '무제한',
        };
      case 'basic':
        return {
          name: 'Basic',
          color: colors.info,
          icon: 'diamond',
          dailyLimit: '10회',
        };
      default:
        return {
          name: 'Free',
          color: colors.textSecondary,
          icon: 'person',
          dailyLimit: '3회',
        };
    }
  };

  const membershipInfo = getMembershipInfo();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: membershipInfo.color }]}>
          <Icon name={membershipInfo.icon} size={48} color={colors.text} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.membershipBadge, { backgroundColor: membershipInfo.color }]}>
          <Text style={styles.membershipText}>{membershipInfo.name}</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>멤버십 정보</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>플랜</Text>
          <Text style={styles.infoValue}>{membershipInfo.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>일일 리딩 제한</Text>
          <Text style={styles.infoValue}>{membershipInfo.dailyLimit}</Text>
        </View>
        {user?.dailyReadingCount !== undefined && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>오늘 사용한 리딩</Text>
            <Text style={styles.infoValue}>{user.dailyReadingCount}회</Text>
          </View>
        )}
        {user?.membershipType === 'free' && (
          <Button
            title="Premium 업그레이드"
            onPress={() => {}}
            fullWidth
            style={styles.upgradeButton}
          />
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>계정 정보</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>가입일</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>최근 로그인</Text>
          <Text style={styles.infoValue}>
            {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : '-'}
          </Text>
        </View>
      </Card>

      <Button
        title="로그아웃"
        variant="outline"
        onPress={handleLogout}
        loading={isLoading}
        fullWidth
        style={styles.logoutButton}
      />

      <Text style={styles.version}>버전 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  membershipBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  membershipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  card: {
    margin: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  upgradeButton: {
    marginTop: spacing.md,
  },
  logoutButton: {
    margin: spacing.lg,
    marginTop: 0,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
});

export default ProfileScreen;
