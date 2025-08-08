import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { COLORS } from '../../../constants/colors';
import { 
  emailMarketingService, 
  EmailPreferences,
  EmailCapturePoint 
} from '../../../services/email-marketing/email-marketing.service';

/**
 * Props for the EmailCaptureModal component
 */
export interface EmailCaptureModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when email is captured successfully */
  onEmailCaptured: (email: string, preferences: Partial<EmailPreferences>) => void;
  /** Current user ID */
  userId?: string;
  /** Capture point configuration */
  capturePoint?: EmailCapturePoint;
  /** Override display variant */
  variant?: 'minimal' | 'branded' | 'promotional';
  /** Pre-filled email address */
  initialEmail?: string;
  /** Custom incentive offer */
  customIncentive?: {
    type: 'discount' | 'free_resource' | 'early_access';
    value: string;
    description: string;
  };
}

/**
 * Email capture modal with multiple variants and incentives
 * 
 * Features:
 * - Multiple design variants (minimal, branded, promotional)
 * - Customizable incentive offers
 * - Email validation and verification
 * - Preference selection (optional)
 * - GDPR/CCPA compliance messaging
 * - Animated entrance and interactions
 * - Mobile-optimized design
 * - Analytics tracking integration
 */
export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  visible,
  onClose,
  onEmailCaptured,
  userId,
  capturePoint,
  variant = 'branded',
  initialEmail = '',
  customIncentive
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Partial<EmailPreferences>>({
    frequency: 'weekly',
    contentTypes: {
      productUpdates: true,
      tips: true,
      casestudies: false,
      newsletters: true,
      promotions: false,
      surveys: false
    }
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  /**
   * Animate modal entrance/exit
   */
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible]);

  /**
   * Validate email format
   */
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  /**
   * Handle email submission
   */
  const handleSubmit = async () => {
    if (!isValidEmail) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Submit email capture
      const success = await emailMarketingService.captureEmail(
        email,
        userId,
        capturePoint?.id,
        preferences,
        customIncentive?.value || capturePoint?.incentive?.value
      );

      if (success) {
        // Bounce animation for success
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        // Call success callback
        onEmailCaptured(email, preferences);

        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        Alert.alert('Error', 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Email capture error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle preference change
   */
  const handlePreferenceChange = (key: keyof EmailPreferences['contentTypes'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      contentTypes: {
        ...prev.contentTypes,
        [key]: value
      }
    }));
  };

  /**
   * Get variant-specific styling
   */
  const getVariantStyles = () => {
    const variants = {
      minimal: {
        gradient: [COLORS.WHITE, COLORS.GRAY_50],
        primaryColor: COLORS.PRIMARY,
        textColor: COLORS.TEXT_PRIMARY,
        backgroundColor: COLORS.WHITE,
        borderColor: COLORS.BORDER_PRIMARY
      },
      branded: {
        gradient: ['#667eea', '#764ba2'],
        primaryColor: '#667eea',
        textColor: COLORS.WHITE,
        backgroundColor: '#667eea',
        borderColor: '#667eea'
      },
      promotional: {
        gradient: ['#FF6B6B', '#FF8E8E'],
        primaryColor: '#FF6B6B',
        textColor: COLORS.WHITE,
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B'
      }
    };

    return variants[variant] || variants.branded;
  };

  /**
   * Get incentive configuration
   */
  const getIncentive = () => {
    if (customIncentive) return customIncentive;
    if (capturePoint?.incentive) return capturePoint.incentive;
    
    return {
      type: 'free_resource' as const,
      value: 'Website Optimization Guide',
      description: 'Get our comprehensive guide to website optimization'
    };
  };

  /**
   * Render minimal variant
   */
  const renderMinimalVariant = () => {
    const styles = getVariantStyles();
    const incentive = getIncentive();

    return (
      <View style={[modalStyles.minimalContainer, { backgroundColor: styles.backgroundColor }]}>
        <View style={modalStyles.minimalHeader}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <Text style={[modalStyles.closeButtonText, { color: styles.textColor }]}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={modalStyles.minimalContent}>
          <Text style={[modalStyles.minimalTitle, { color: styles.textColor }]}>
            {capturePoint?.headline || 'Stay Updated'}
          </Text>
          <Text style={[modalStyles.minimalDescription, { color: styles.textColor }]}>
            {capturePoint?.description || 'Get the latest optimization tips and insights'}
          </Text>

          <View style={modalStyles.inputContainer}>
            <TextInput
              style={[modalStyles.emailInput, { borderColor: styles.borderColor, color: styles.textColor }]}
              placeholder={capturePoint?.placeholder || 'Enter your email'}
              placeholderTextColor={variant === 'minimal' ? COLORS.TEXT_TERTIARY : 'rgba(255,255,255,0.7)'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="email"
            />
            <Button
              variant="primary"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!isValidEmail}
              style={[modalStyles.submitButton, { backgroundColor: styles.primaryColor }]}
            >
              {capturePoint?.ctaText || 'Subscribe'}
            </Button>
          </View>

          <Text style={[modalStyles.privacyText, { color: styles.textColor }]}>
            We respect your privacy. Unsubscribe at any time.
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render branded variant
   */
  const renderBrandedVariant = () => {
    const styles = getVariantStyles();
    const incentive = getIncentive();

    return (
      <LinearGradient
        colors={styles.gradient}
        style={modalStyles.brandedContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
          <Text style={[modalStyles.closeButtonText, { color: styles.textColor }]}>×</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={modalStyles.brandedContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
            <Text style={modalStyles.incentiveEmoji}>
              {incentive.type === 'discount' ? '💰' : incentive.type === 'free_resource' ? '📚' : '🚀'}
            </Text>
          </Animated.View>

          <Text style={[modalStyles.brandedTitle, { color: styles.textColor }]}>
            {capturePoint?.headline || 'Get Your Free Guide'}
          </Text>
          
          <Text style={[modalStyles.brandedDescription, { color: styles.textColor }]}>
            {capturePoint?.description || incentive.description}
          </Text>

          {/* Incentive highlight */}
          <View style={modalStyles.incentiveBox}>
            <Text style={[modalStyles.incentiveTitle, { color: styles.textColor }]}>
              What you'll get:
            </Text>
            <Text style={[modalStyles.incentiveValue, { color: styles.textColor }]}>
              ✓ {incentive.value}
            </Text>
            <Text style={[modalStyles.incentiveExtra, { color: styles.textColor }]}>
              ✓ Weekly optimization tips
            </Text>
            <Text style={[modalStyles.incentiveExtra, { color: styles.textColor }]}>
              ✓ Exclusive Pro features preview
            </Text>
          </View>

          <View style={modalStyles.inputContainer}>
            <TextInput
              style={[modalStyles.brandedEmailInput, { color: styles.textColor }]}
              placeholder={capturePoint?.placeholder || 'Enter your email address'}
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="email"
            />
          </View>

          {/* Preferences (optional) */}
          {showPreferences && (
            <View style={modalStyles.preferencesContainer}>
              <Text style={[modalStyles.preferencesTitle, { color: styles.textColor }]}>
                What interests you most?
              </Text>
              <View style={modalStyles.preferencesGrid}>
                <TouchableOpacity
                  style={[
                    modalStyles.preferenceItem,
                    preferences.contentTypes?.tips && modalStyles.preferenceItemSelected
                  ]}
                  onPress={() => handlePreferenceChange('tips', !preferences.contentTypes?.tips)}
                >
                  <Text style={[modalStyles.preferenceText, { color: styles.textColor }]}>
                    Optimization Tips
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.preferenceItem,
                    preferences.contentTypes?.productUpdates && modalStyles.preferenceItemSelected
                  ]}
                  onPress={() => handlePreferenceChange('productUpdates', !preferences.contentTypes?.productUpdates)}
                >
                  <Text style={[modalStyles.preferenceText, { color: styles.textColor }]}>
                    Product Updates
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.preferenceItem,
                    preferences.contentTypes?.casestudies && modalStyles.preferenceItemSelected
                  ]}
                  onPress={() => handlePreferenceChange('casestudies', !preferences.contentTypes?.casestudies)}
                >
                  <Text style={[modalStyles.preferenceText, { color: styles.textColor }]}>
                    Case Studies
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!isValidEmail}
            style={modalStyles.brandedSubmitButton}
          >
            {isLoading ? 'Subscribing...' : capturePoint?.ctaText || 'Get My Free Guide'}
          </Button>

          <TouchableOpacity onPress={() => setShowPreferences(!showPreferences)} style={modalStyles.preferencesToggle}>
            <Text style={[modalStyles.preferencesToggleText, { color: styles.textColor }]}>
              {showPreferences ? 'Hide' : 'Customize'} preferences
            </Text>
          </TouchableOpacity>

          <Text style={[modalStyles.privacyText, { color: styles.textColor }]}>
            We respect your privacy and never share your email. Unsubscribe anytime.
          </Text>
        </ScrollView>
      </LinearGradient>
    );
  };

  /**
   * Render promotional variant
   */
  const renderPromotionalVariant = () => {
    const styles = getVariantStyles();
    const incentive = getIncentive();

    return (
      <LinearGradient
        colors={styles.gradient}
        style={modalStyles.promotionalContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
          <Text style={[modalStyles.closeButtonText, { color: styles.textColor }]}>×</Text>
        </TouchableOpacity>

        <View style={modalStyles.promotionalContent}>
          <View style={modalStyles.urgencyBanner}>
            <Text style={modalStyles.urgencyText}>⏰ LIMITED TIME OFFER</Text>
          </View>

          <Text style={[modalStyles.promotionalTitle, { color: styles.textColor }]}>
            {capturePoint?.headline || 'Exclusive Deal Inside!'}
          </Text>

          <View style={modalStyles.offerHighlight}>
            <Text style={[modalStyles.offerText, { color: styles.textColor }]}>
              {incentive.value}
            </Text>
            <Text style={[modalStyles.offerDescription, { color: styles.textColor }]}>
              {incentive.description}
            </Text>
          </View>

          <View style={modalStyles.inputContainer}>
            <TextInput
              style={modalStyles.promotionalEmailInput}
              placeholder="Enter your email to claim offer"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="email"
            />
          </View>

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!isValidEmail}
            style={modalStyles.promotionalSubmitButton}
          >
            {isLoading ? 'Claiming...' : 'Claim My Offer Now'}
          </Button>

          <Text style={[modalStyles.disclaimerText, { color: styles.textColor }]}>
            * Offer expires in 24 hours. No spam, unsubscribe anytime.
          </Text>
        </View>
      </LinearGradient>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            modalStyles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {variant === 'minimal' && renderMinimalVariant()}
          {variant === 'branded' && renderBrandedVariant()}
          {variant === 'promotional' && renderPromotionalVariant()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  // Minimal variant
  minimalContainer: {
    padding: 24,
  },
  minimalHeader: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  minimalContent: {
    alignItems: 'center',
  },
  minimalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  minimalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },

  // Branded variant
  brandedContainer: {
    minHeight: 400,
  },
  brandedContent: {
    padding: 24,
    paddingTop: 60, // Space for close button
    alignItems: 'center',
  },
  incentiveEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  brandedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  brandedDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    opacity: 0.9,
  },
  incentiveBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  incentiveTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  incentiveValue: {
    fontSize: 16,
    marginBottom: 6,
    opacity: 0.9,
  },
  incentiveExtra: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },

  // Promotional variant
  promotionalContainer: {
    minHeight: 350,
  },
  promotionalContent: {
    padding: 24,
    paddingTop: 60, // Space for close button
    alignItems: 'center',
  },
  urgencyBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  urgencyText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  promotionalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  offerHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  offerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },

  // Common elements
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  emailInput: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  brandedEmailInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  promotionalEmailInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.WHITE,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  brandedSubmitButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 12,
  },
  promotionalSubmitButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 16,
  },

  // Preferences
  preferencesContainer: {
    width: '100%',
    marginBottom: 16,
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  preferenceItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  preferenceText: {
    fontSize: 14,
  },
  preferencesToggle: {
    paddingVertical: 8,
  },
  preferencesToggleText: {
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },

  // Privacy
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 16,
    marginTop: 8,
  },
});

export default EmailCaptureModal;