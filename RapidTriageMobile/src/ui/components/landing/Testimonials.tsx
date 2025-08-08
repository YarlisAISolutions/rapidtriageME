/**
 * Testimonials carousel component
 * Displays customer testimonials and reviews
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H3, H4, Body1, Body2, Caption } from '../common/Typography';
import { Card } from '../common/Card';

const { width } = Dimensions.get('window');
const TESTIMONIAL_WIDTH = width * 0.8;

export interface TestimonialsProps {
  onTestimonialPress?: (testimonialId: string) => void;
}

export const Testimonials: React.FC<TestimonialsProps> = ({
  onTestimonialPress,
}) => {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % testimonials.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (TESTIMONIAL_WIDTH + SPACING.LG),
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [currentIndex, isAutoScrolling]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (TESTIMONIAL_WIDTH + SPACING.LG));
    setCurrentIndex(index);
  };

  const scrollToTestimonial = (index: number) => {
    setIsAutoScrolling(false);
    scrollViewRef.current?.scrollTo({
      x: index * (TESTIMONIAL_WIDTH + SPACING.LG),
      animated: true,
    });
    setCurrentIndex(index);
    
    // Re-enable auto-scrolling after 10 seconds
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Body1
        key={i}
        style={[
          styles.star,
          { color: i < rating ? theme.WARNING : theme.GRAY_300 }
        ]}
      >
        ★
      </Body1>
    ));
  };

  const getCompanyLogo = (company: string) => {
    // In a real app, these would be actual images
    const logos: Record<string, string> = {
      'TechCorp': '🏢',
      'StartupXYZ': '🚀',
      'DesignStudio': '🎨',
      'DevAgency': '💻',
      'E-Commerce Co': '🛍️',
      'MediaGroup': '📺'
    };
    return logos[company] || '🏢';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BACKGROUND_PRIMARY }]}>
      {/* Header */}
      <View style={styles.header}>
        <H3 style={[styles.title, { color: theme.TEXT }]}>
          Loved by developers worldwide
        </H3>
        <Body1 style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
          See what our users are saying about RapidTriage
        </Body1>
      </View>

      {/* Overall stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <H4 style={[styles.statNumber, { color: theme.SUCCESS }]}>
            4.9/5
          </H4>
          <Caption style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
            Average Rating
          </Caption>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <H4 style={[styles.statNumber, { color: theme.PRIMARY }]}>
            10,000+
          </H4>
          <Caption style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
            Happy Users
          </Caption>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <H4 style={[styles.statNumber, { color: theme.SECONDARY }]}>
            500K+
          </H4>
          <Caption style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
            Sites Analyzed
          </Caption>
        </View>
      </View>

      {/* Testimonials carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={TESTIMONIAL_WIDTH + SPACING.LG}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContainer}
      >
        {testimonials.map((testimonial, index) => (
          <TouchableOpacity
            key={testimonial.id}
            activeOpacity={0.9}
            onPress={() => onTestimonialPress?.(testimonial.id)}
          >
            <Card
              style={[
                styles.testimonialCard,
                {
                  width: TESTIMONIAL_WIDTH,
                  transform: [{ 
                    scale: index === currentIndex ? 1 : 0.95 
                  }],
                  opacity: index === currentIndex ? 1 : 0.7,
                }
              ]}
              padding="LG"
              shadow="LG"
            >
              {/* Rating stars */}
              <View style={styles.rating}>
                {renderStars(testimonial.rating)}
              </View>

              {/* Testimonial text */}
              <Body1 style={[styles.testimonialText, { color: theme.TEXT }]}>
                "{testimonial.text}"
              </Body1>

              {/* Author info */}
              <View style={styles.authorSection}>
                <View style={styles.authorInfo}>
                  <View style={[styles.avatar, { backgroundColor: testimonial.avatarColor }]}>
                    <Body1 style={[styles.avatarText, { color: theme.WHITE }]}>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </Body1>
                  </View>
                  <View style={styles.authorDetails}>
                    <Body2 style={[styles.authorName, { color: theme.TEXT }]}>
                      {testimonial.name}
                    </Body2>
                    <Caption style={[styles.authorRole, { color: theme.TEXT_SECONDARY }]}>
                      {testimonial.role}
                    </Caption>
                  </View>
                </View>
                
                {/* Company info */}
                <View style={styles.companyInfo}>
                  <Body1 style={styles.companyLogo}>
                    {getCompanyLogo(testimonial.company)}
                  </Body1>
                  <Caption style={[styles.companyName, { color: theme.TEXT_SECONDARY }]}>
                    {testimonial.company}
                  </Caption>
                </View>
              </View>

              {/* Key benefit highlighted */}
              <View style={[styles.benefitTag, { backgroundColor: `${theme.SUCCESS}15` }]}>
                <Caption style={[styles.benefitText, { color: theme.SUCCESS }]}>
                  {testimonial.keyBenefit}
                </Caption>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {testimonials.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => scrollToTestimonial(index)}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentIndex ? theme.PRIMARY : theme.GRAY_300,
                transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
              }
            ]}
          />
        ))}
      </View>

      {/* Call to action */}
      <View style={styles.ctaSection}>
        <Body1 style={[styles.ctaText, { color: theme.TEXT_SECONDARY }]}>
          Join thousands of satisfied developers
        </Body1>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: theme.PRIMARY }]}
          onPress={() => onTestimonialPress?.('signup')}
        >
          <Body2 style={[styles.ctaButtonText, { color: theme.WHITE }]}>
            Start Free Trial
          </Body2>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Testimonials data
const testimonials = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Senior Frontend Developer',
    company: 'TechCorp',
    rating: 5,
    text: 'RapidTriage has transformed our development workflow. We catch performance issues before they reach production, and the insights are incredibly actionable.',
    keyBenefit: 'Improved deployment confidence',
    avatarColor: '#3B82F6'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'CTO & Co-Founder',
    company: 'StartupXYZ',
    rating: 5,
    text: 'The accessibility audits alone have saved us countless hours of manual testing. Our WCAG compliance improved dramatically within weeks of using RapidTriage.',
    keyBenefit: 'Enhanced accessibility compliance',
    avatarColor: '#10B981'
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    role: 'UX Engineer',
    company: 'DesignStudio',
    rating: 5,
    text: 'I love how RapidTriage gives me both technical metrics and user experience insights. It bridges the gap between design and performance perfectly.',
    keyBenefit: 'Better UX-performance balance',
    avatarColor: '#8B5CF6'
  },
  {
    id: '4',
    name: 'David Park',
    role: 'Full Stack Developer',
    company: 'DevAgency',
    rating: 4,
    text: 'The mobile-first analysis is spot on. Our client sites consistently score better on Core Web Vitals since we started using RapidTriage for optimization.',
    keyBenefit: 'Improved Core Web Vitals',
    avatarColor: '#F59E0B'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'Engineering Manager',
    company: 'E-Commerce Co',
    rating: 5,
    text: 'RapidTriage integrates seamlessly into our CI/CD pipeline. We prevent performance regressions and our conversion rates have improved by 15%.',
    keyBenefit: '15% conversion rate increase',
    avatarColor: '#EF4444'
  },
  {
    id: '6',
    name: 'Ahmed Hassan',
    role: 'DevOps Engineer',
    company: 'MediaGroup',
    rating: 5,
    text: 'The continuous monitoring and alerting features are game-changers. We know about issues before our users do, and can react immediately.',
    keyBenefit: 'Proactive issue detection',
    avatarColor: '#06B6D4'
  }
];

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.XXL,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: SPACING.MD,
  },
  carouselContainer: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  testimonialCard: {
    marginRight: SPACING.LG,
    minHeight: 300,
  },
  rating: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
  },
  star: {
    fontSize: 18,
    marginRight: 2,
  },
  testimonialText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: SPACING.LG,
  },
  authorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.MD,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
    marginBottom: SPACING.XS / 2,
  },
  authorRole: {
    fontSize: 12,
  },
  companyInfo: {
    alignItems: 'center',
  },
  companyLogo: {
    fontSize: 20,
    marginBottom: SPACING.XS / 2,
  },
  companyName: {
    fontSize: 11,
    textAlign: 'center',
  },
  benefitTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  benefitText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    gap: SPACING.SM,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  ctaText: {
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  ctaButton: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    ...SHADOWS.SM,
  },
  ctaButtonText: {
    fontWeight: '600',
  },
});