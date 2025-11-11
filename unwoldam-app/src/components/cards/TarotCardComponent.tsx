import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { TarotCard } from '../../types/models';

interface TarotCardComponentProps {
  card: TarotCard;
  isReversed?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

const TarotCardComponent: React.FC<TarotCardComponentProps> = ({
  card,
  isReversed = false,
  onPress,
  size = 'medium',
  showDetails = false,
}) => {
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: withSpring(isReversed ? '180deg' : '0deg') },
      ],
    };
  });

  const sizeStyles = styles[`card_${size}`];

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.card, sizeStyles, cardStyle]}>
        {card.imageUrl ? (
          <Image source={{ uri: card.imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.cardNumber}>{card.cardNumber}</Text>
          </View>
        )}
        {showDetails && (
          <View style={styles.cardDetails}>
            <Text style={styles.cardName} numberOfLines={1}>
              {card.nameKo}
            </Text>
            {card.arcana && (
              <Text style={styles.arcana}>
                {card.arcana === 'major' ? '메이저 아르카나' : '마이너 아르카나'}
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    ...shadows.medium,
    overflow: 'hidden',
  },
  card_small: {
    width: 80,
    height: 140,
  },
  card_medium: {
    width: 120,
    height: 200,
  },
  card_large: {
    width: 160,
    height: 280,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cardDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: spacing.sm,
  },
  cardName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  arcana: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs / 2,
  },
});

export default TarotCardComponent;
