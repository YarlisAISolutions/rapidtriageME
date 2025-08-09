import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { COLORS } from '../../../constants/colors';
import { growthFeaturesService } from '../../../services/growth/growth-features.service';

/**
 * Props for the NPSSurveyModal component
 */
export interface NPSSurveyModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when survey is submitted */
  onSubmit: (score: number, feedback: string) => void;
  /** User ID for tracking */
  userId: string;
  /** Survey ID */
  surveyId: string;
  /** Custom survey question */
  customQuestion?: string;
}

/**
 * NPS (Net Promoter Score) survey modal component
 * 
 * Features:
 * - Standard NPS 0-10 rating scale
 * - Contextual follow-up questions based on score
 * - Animated interactions and feedback
 * - Mobile-optimized design
 * - Analytics tracking integration
 * - Customizable survey questions
 * - Proper keyboard handling
 */
export const NPSSurveyModal: React.FC<NPSSurveyModalProps> = ({
  visible,
  onClose,
  onSubmit,
  userId,
  surveyId,
  customQuestion
}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'rating' | 'feedback' | 'thank_you'>('rating');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scaleAnims = useRef(Array.from({ length: 11 }, () => new Animated.Value(1))).current;

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
      // Reset state when modal is closed
      setSelectedScore(null);
      setFeedback('');
      setShowFeedback(false);
      setStep('rating');
    }
  }, [visible]);

  /**
   * Handle score selection with animation
   */
  const handleScoreSelect = (score: number) => {
    setSelectedScore(score);

    // Animate selected score
    Animated.sequence([
      Animated.timing(scaleAnims[score], {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[score], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Show feedback step after short delay
    setTimeout(() => {
      setStep('feedback');
      setShowFeedback(true);
    }, 800);
  };

  /**
   * Handle survey submission
   */
  const handleSubmit = async () => {
    if (selectedScore === null) return;

    setIsSubmitting(true);

    try {
      // Submit to growth features service
      const success = await growthFeaturesService.submitNPSResponse(
        userId,
        surveyId,
        selectedScore,
        feedback.trim() || undefined
      );

      if (success) {
        // Call parent callback
        onSubmit(selectedScore, feedback);

        // Show thank you step
        setStep('thank_you');

        // Auto-close after thank you
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to submit survey');
      }
    } catch (error) {
      console.error('Failed to submit NPS survey:', error);
      // Could show error state here
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get score category and color
   */
  const getScoreInfo = (score: number) => {
    if (score <= 6) {
      return {
        category: 'detractor',
        color: '#EF4444',
        label: 'Not likely'
      };
    } else if (score <= 8) {
      return {
        category: 'passive',
        color: '#F59E0B',
        label: 'Neutral'
      };
    } else {
      return {
        category: 'promoter',
        color: '#10B981',
        label: 'Very likely'
      };
    }
  };

  /**
   * Get contextual feedback question based on score
   */
  const getFeedbackQuestion = () => {
    if (selectedScore === null) return '';

    const scoreInfo = getScoreInfo(selectedScore);
    
    switch (scoreInfo.category) {
      case 'promoter':
        return 'That\'s great to hear! What do you love most about RapidTriage?';
      case 'passive':
        return 'Thank you for the feedback. What could we do to make your experience better?';
      case 'detractor':
        return 'We\'re sorry to hear that. What\'s the main reason for your rating?';
      default:
        return 'What\'s the main reason for your rating?';
    }
  };

  /**
   * Render rating step
   */
  const renderRatingStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h3" style={styles.question}>
        {customQuestion || 'How likely are you to recommend RapidTriage to a friend or colleague?'}
      </Typography>

      <View style={styles.scaleContainer}>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>Not at all likely</Text>
          <Text style={styles.scaleLabel}>Extremely likely</Text>
        </View>

        <View style={styles.scoreButtons}>
          {Array.from({ length: 11 }, (_, i) => {
            const score = i;
            const isSelected = selectedScore === score;
            const scoreInfo = getScoreInfo(score);

            return (
              <TouchableOpacity
                key={score}
                style={[
                  styles.scoreButton,
                  isSelected && [styles.scoreButtonSelected, { backgroundColor: scoreInfo.color }]
                ]}
                onPress={() => handleScoreSelect(score)}
                activeOpacity={0.7}
              >
                <Animated.Text
                  style={[
                    styles.scoreButtonText,
                    isSelected && styles.scoreButtonTextSelected,
                    { transform: [{ scale: scaleAnims[score] }] }
                  ]}
                >
                  {score}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedScore !== null && (
        <Animated.View
          style={[
            styles.selectedInfo,
            {
              opacity: fadeAnim,
              backgroundColor: getScoreInfo(selectedScore).color + '15',
              borderColor: getScoreInfo(selectedScore).color,
            }
          ]}
        >
          <Text style={[styles.selectedInfoText, { color: getScoreInfo(selectedScore).color }]}>
            Score: {selectedScore} - {getScoreInfo(selectedScore).label}
          </Text>
        </Animated.View>
      )}
    </View>
  );

  /**
   * Render feedback step
   */
  const renderFeedbackStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h3" style={styles.feedbackQuestion}>
        {getFeedbackQuestion()}
      </Typography>

      <View style={styles.feedbackContainer}>
        <TextInput
          style={styles.feedbackInput}
          placeholder="Tell us more about your experience... (optional)"
          placeholderTextColor={COLORS.TEXT_TERTIARY}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {feedback.length}/500
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitButton}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
        
        <TouchableOpacity
          onPress={handleSubmit}
          style={styles.skipButton}
          disabled={isSubmitting}
        >
          <Text style={styles.skipButtonText}>Skip feedback</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Render thank you step
   */
  const renderThankYouStep = () => {
    const scoreInfo = selectedScore !== null ? getScoreInfo(selectedScore) : null;

    return (
      <View style={[styles.stepContainer, styles.thankYouContainer]}>
        <View style={styles.thankYouIcon}>
          <Text style={styles.thankYouEmoji}>
            {scoreInfo?.category === 'promoter' ? '🎉' : scoreInfo?.category === 'passive' ? '👍' : '💙'}
          </Text>
        </View>
        
        <Typography variant="h3" style={styles.thankYouTitle}>
          Thank you for your feedback!
        </Typography>
        
        <Text style={styles.thankYouMessage}>
          {scoreInfo?.category === 'promoter' 
            ? 'We\'re thrilled you love RapidTriage! Your feedback helps us continue improving.'
            : scoreInfo?.category === 'passive'
            ? 'Thank you for your input. We\'re always working to make RapidTriage better.'
            : 'We appreciate your honest feedback and will use it to improve your experience.'
          }
        </Text>

        {scoreInfo?.category === 'promoter' && (
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>
              Share RapidTriage with friends
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                disabled={isSubmitting}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Your Opinion Matters</Text>
                <Text style={styles.headerSubtitle}>Help us improve RapidTriage</Text>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {step === 'rating' && renderRatingStep()}
              {step === 'feedback' && renderFeedbackStep()}
              {step === 'thank_you' && renderThankYouStep()}
            </ScrollView>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: step === 'rating' ? '33%' : step === 'feedback' ? '66%' : '100%'
                    }
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
  modalGradient: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
    position: 'relative',
  },
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
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 14,
    opacity: 0.9,
  },
  content: {
    padding: 24,
    paddingTop: 12,
  },
  stepContainer: {
    alignItems: 'center',
  },
  question: {
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  scaleContainer: {
    width: '100%',
    marginBottom: 24,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  scaleLabel: {
    color: COLORS.WHITE,
    fontSize: 12,
    opacity: 0.8,
    flex: 1,
    textAlign: 'center',
  },
  scoreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoreButtonSelected: {
    borderColor: COLORS.WHITE,
    transform: [{ scale: 1.1 }],
  },
  scoreButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  scoreButtonTextSelected: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  selectedInfo: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedInfoText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackQuestion: {
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  feedbackContainer: {
    width: '100%',
    marginBottom: 24,
  },
  feedbackInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    color: COLORS.WHITE,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  characterCount: {
    color: COLORS.WHITE,
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
    marginTop: 8,
  },
  actionButtons: {
    width: '100%',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    width: '100%',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
  thankYouContainer: {
    paddingVertical: 32,
  },
  thankYouIcon: {
    marginBottom: 20,
  },
  thankYouEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  thankYouTitle: {
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 16,
  },
  thankYouMessage: {
    color: COLORS.WHITE,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 24,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shareButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    padding: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 2,
  },
});

export default NPSSurveyModal;