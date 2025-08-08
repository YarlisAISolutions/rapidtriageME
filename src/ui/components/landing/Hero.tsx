/**
 * Hero Section Component for RapidTriage Homepage
 * 
 * Purpose: Main landing section that captures user attention with value proposition
 * Features: 
 * - Compelling headline and subheadline
 * - Clear CTA buttons for sign up and demo
 * - Animated background gradient
 * - Responsive design for all devices
 * 
 * Future enhancements: 
 * - A/B testing for different headlines
 * - Dynamic content based on traffic source
 * - Video background option
 */

import React from 'react';

interface HeroProps {
  onStartTrial: () => void;
  onViewDemo: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStartTrial, onViewDemo }) => {
  return (
    <section className="hero-section relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-black opacity-10">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-5"></div>
      </div>
      
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Instant Web Performance Analysis
            <span className="block text-3xl md:text-4xl mt-2 text-blue-200">
              Powered by AI-Driven Browser Automation
            </span>
          </h1>
          
          {/* Subheadline with value proposition */}
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            RapidTriage analyzes your website's performance, accessibility, and SEO in real-time. 
            Get actionable insights in seconds, not hours.
          </p>
          
          {/* Key benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm md:text-base">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Real-time Analysis</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Installation Required</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Lighthouse Metrics</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onStartTrial}
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Free Trial
              <span className="block text-sm font-normal">14 days free, no credit card</span>
            </button>
            <button
              onClick={onViewDemo}
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-purple-600 transition duration-300"
            >
              Watch Live Demo
              <span className="block text-sm font-normal">See it in action</span>
            </button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center space-x-8 opacity-70">
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">1M+</div>
              <div className="text-sm">Sites Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;