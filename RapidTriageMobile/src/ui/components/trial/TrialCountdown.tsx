import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { COLORS } from '../../../constants/colors';

/**
 * Props for the TrialCountdown component
 */
export interface TrialCountdownProps {
  /** Days remaining in trial */
  daysRemaining: number;
  /** Trial end date for precise countdown */
  endDate: Date;
  /** Whether trial can be extended */
  canExtend: boolean;
  /** Number of extensions already used */
  extensionsUsed: number;
  /** Maximum extensions allowed */
  maxExtensions: number;
  /** Callback when user wants to upgrade */
  onUpgrade: () => void;
  /** Callback when user wants to extend trial */
  onExtend: () => void;
  /** Callback when countdown reaches zero */
  onTrialExpired: () => void;
  /** Display variant */
  variant?: 'compact' | 'detailed' | 'banner';
  /** Show extension offer */
  showExtensionOffer?: boolean;
  /** Custom styling */
  style?: any;
}

/**
 * Interactive trial countdown component with real-time updates
 * 
 * Features:
 * - Real-time countdown display (days, hours, minutes)
 * - Visual urgency indicators based on time remaining
 * - Extension offers with usage limits
 * - Conversion-optimized messaging
 * - Multiple display variants for different contexts
 * - Animated transitions for state changes
 * - Auto-refresh every minute for accuracy
 */
export const TrialCountdown: React.FC<TrialCountdownProps> = ({
  daysRemaining: initialDays,
  endDate,
  canExtend,
  extensionsUsed,
  maxExtensions,
  onUpgrade,
  onExtend,
  onTrialExpired,
  variant = 'detailed',
  showExtensionOffer = false,
  style
}) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: initialDays,
    hours: 0,
    minutes: 0,
    total: 0
  });
  const [pulseAnim] = useState(new Animated.Value(1));
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('low');

  /**
   * Calculate precise time remaining until trial end
   */
  const calculateTimeRemaining = () => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const total = end - now;

    if (total <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, total: 0 });
      onTrialExpired();
      return;
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

    setTimeRemaining({ days, hours, minutes, total });

    // Update urgency level based on time remaining
    if (days <= 1) {
      setUrgencyLevel('high');
    } else if (days <= 3) {
      setUrgencyLevel('medium');
    } else {
      setUrgencyLevel('low');
    }
  };

  /**
   * Start pulsing animation for urgent states
   */
  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (urgencyLevel === 'high' && timeRemaining.total > 0) {
          pulse();
        }
      });
    };
    
    if (urgencyLevel === 'high') {
      pulse();
    }
  };

  // Update countdown every minute
  useEffect(() => {
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [endDate]);

  // Handle urgency level changes
  useEffect(() => {
    if (urgencyLevel === 'high') {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [urgencyLevel]);

  /**
   * Get urgency-based styling
   */
  const getUrgencyColors = () => {
    switch (urgencyLevel) {
      case 'high':
        return {
          gradient: ['#FF6B6B', '#FF8E8E'],
          text: '#FFFFFF',
          accent: '#FFE5E5',
          border: '#FF6B6B'
        };
      case 'medium':
        return {
          gradient: ['#F59E0B', '#FCD34D'],
          text: '#FFFFFF',
          accent: '#FEF3C7',
          border: '#F59E0B'
        };
      default:
        return {
          gradient: ['#3B82F6', '#60A5FA'],
          text: '#FFFFFF',
          accent: '#E0F2FE',
          border: '#3B82F6'
        };
    }
  };

  /**
   * Format time display based on remaining time
   */
  const formatTimeDisplay = () => {
    const { days, hours, minutes } = timeRemaining;

    if (days > 0) {
      return {
        primary: `${days}`,
        primaryUnit: days === 1 ? 'Day' : 'Days',
        secondary: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        full: `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`
      };
    } else if (hours > 0) {
      return {
        primary: `${hours}`,
        primaryUnit: hours === 1 ? 'Hour' : 'Hours',
        secondary: `${minutes}m`,
        full: `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`
      };
    } else {
      return {
        primary: `${minutes}`,
        primaryUnit: minutes === 1 ? 'Minute' : 'Minutes',
        secondary: '',
        full: `${minutes} minute${minutes !== 1 ? 's' : ''}`
      };
    }
  };

  /**
   * Get contextual message based on time remaining and urgency
   */
  const getUrgencyMessage = () => {
    const { days, hours } = timeRemaining;

    if (days <= 0 && hours <= 0) {
      return 'Your trial expires in minutes! Upgrade now to keep your access.';
    } else if (days <= 0) {
      return 'Your trial expires today! Don\'t lose access to Pro features.';
    } else if (days === 1) {
      return 'Last day of your Pro trial! Upgrade now to continue.';
    } else if (days <= 3) {
      return 'Your Pro trial ends soon. Upgrade to keep your productivity boost.';
    } else if (days <= 7) {
      return 'You\'re halfway through your Pro trial. See what you\'ll miss?';
    } else {
      return 'Enjoying your Pro trial? Upgrade anytime to keep these features.';
    }
  };

  /**
   * Render compact variant for minimal space usage
   */
  const renderCompactVariant = () => {
    const colors = getUrgencyColors();
    const display = formatTimeDisplay();

    return (
      <Animated.View style={[
        styles.compactContainer,
        { borderColor: colors.border },
        urgencyLevel === 'high' && { transform: [{ scale: pulseAnim }] },
        style
      ]}>
        <View style={styles.compactContent}>
          <Text style={[styles.compactTime, { color: colors.border }]}>
            {display.primary} {display.primaryUnit.toLowerCase()}{display.secondary ? ` ${display.secondary}` : ''}
          </Text>
          <TouchableOpacity onPress={onUpgrade}>
            <Text style={[styles.compactUpgrade, { color: colors.border }]}>
              Upgrade ›
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  /**
   * Render banner variant for prominent display
   */
  const renderBannerVariant = () => {
    const colors = getUrgencyColors();
    const display = formatTimeDisplay();

    return (
      <Animated.View style={[
        styles.bannerContainer,
        urgencyLevel === 'high' && { transform: [{ scale: pulseAnim }] },
        style
      ]}>
        <LinearGradient
          colors={colors.gradient}
          style={styles.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>
                Trial ends in {display.full}
              </Text>
              <Text style={[styles.bannerMessage, { color: colors.text }]}>
                {getUrgencyMessage()}
              </Text>
            </View>
            <Button
              variant="secondary"
              onPress={onUpgrade}
              style={styles.bannerButton}
              textStyle={{ color: colors.border }}
            >
              Upgrade
            </Button>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  /**
   * Render detailed variant with full information
   */
  const renderDetailedVariant = () => {
    const colors = getUrgencyColors();
    const display = formatTimeDisplay();

    return (
      <Animated.View style={[
        styles.detailedContainer,
        urgencyLevel === 'high' && { transform: [{ scale: pulseAnim }] },
        style
      ]}>
        <LinearGradient
          colors={colors.gradient}
          style={styles.detailedGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Countdown Display */}
          <View style={styles.countdownDisplay}>
            <View style={styles.timeUnit}>
              <Text style={[styles.timeNumber, { color: colors.text }]}>
                {display.primary}
              </Text>
              <Text style={[styles.timeLabel, { color: colors.text }]}>
                {display.primaryUnit}
              </Text>
            </View>
            
            {display.secondary && (
              <View style={styles.secondaryTime}>
                <Text style={[styles.secondaryTimeText, { color: colors.text }]}>
                  {display.secondary} remaining
                </Text>
              </View>
            )}
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Typography
              variant="body1"
              style={[styles.trialMessage, { color: colors.text }]}
            >
              {getUrgencyMessage()}
            </Typography>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              variant="primary"
              onPress={onUpgrade}
              style={[styles.upgradeButton, { backgroundColor: colors.text }]}
              textStyle={{ color: colors.gradient[0] }}
            >
              Upgrade Now
            </Button>

            {/* Extension offer */}
            {showExtensionOffer && canExtend && (
              <TouchableOpacity
                style={styles.extensionButton}
                onPress={onExtend}
              >
                <Text style={[styles.extensionText, { color: colors.text }]}>
                  Get 7 More Days Free ({extensionsUsed}/{maxExtensions} used)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.max(0, 100 - (timeRemaining.days / 14) * 100)}%`,
                    backgroundColor: colors.text
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Trial Progress
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Don't render if trial has expired
  if (timeRemaining.total <= 0) {
    return null;
  }

  // Render appropriate variant
  switch (variant) {
    case 'compact':
      return renderCompactVariant();
    case 'banner':
      return renderBannerVariant();
    case 'detailed':
    default:
      return renderDetailedVariant();
  }
};

const styles = StyleSheet.create({
  // Compact variant styles
  compactContainer: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactUpgrade: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Banner variant styles
  bannerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  bannerGradient: {
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flex: 1,
    marginRight: 16,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerMessage: {
    fontSize: 14,
    opacity: 0.9,
  },
  bannerButton: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  // Detailed variant styles
  detailedContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  detailedGradient: {
    padding: 24,
  },
  countdownDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 56,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.9,
  },
  secondaryTime: {
    marginTop: 8,
  },
  secondaryTimeText: {
    fontSize: 14,
    opacity: 0.8,
  },
  messageContainer: {
    marginBottom: 24,
  },
  trialMessage: {
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.95,
  },
  actionButtons: {
    marginBottom: 20,
  },
  upgradeButton: {
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  extensionButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  extensionText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.8,
  },
});

export default TrialCountdown;