/**
 * Features Grid Component
 * 
 * Purpose: Showcase key features of RapidTriage in an engaging grid layout
 * Features:
 * - 6 main features with icons and descriptions
 * - Hover animations for engagement
 * - Responsive grid layout
 * - Links to detailed feature pages
 * 
 * Future enhancements:
 * - Interactive demos for each feature
 * - Video previews on hover
 * - Feature comparison with competitors
 */

import React from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

const features: Feature[] = [
  {
    id: 'performance',
    title: 'Performance Analysis',
    description: 'Get detailed Lighthouse performance scores including FCP, LCP, TTI, and CLS metrics in real-time.',
    color: 'bg-green-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'accessibility',
    title: 'Accessibility Testing',
    description: 'Ensure your site meets WCAG standards with comprehensive accessibility audits and recommendations.',
    color: 'bg-blue-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    id: 'seo',
    title: 'SEO Optimization',
    description: 'Analyze meta tags, structured data, and content optimization to improve search rankings.',
    color: 'bg-purple-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'realtime',
    title: 'Real-time Monitoring',
    description: 'Monitor your site continuously with instant alerts for performance degradation or issues.',
    color: 'bg-red-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'automation',
    title: 'Browser Automation',
    description: 'Test user flows and interactions with our powerful browser automation capabilities.',
    color: 'bg-yellow-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    id: 'reporting',
    title: 'Detailed Reports',
    description: 'Generate comprehensive reports with actionable insights and share with your team.',
    color: 'bg-indigo-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-6h4" />
      </svg>
    ),
  },
];

interface FeaturesProps {
  onFeatureClick?: (featureId: string) => void;
}

const Features: React.FC<FeaturesProps> = ({ onFeatureClick }) => {
  return (
    <section className="py-20 bg-gray-50" id="features">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Powerful Features for Modern Web Development
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to ensure your website performs at its best, 
            accessible to all users, and optimized for search engines.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              onClick={() => onFeatureClick?.(feature.id)}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden group"
            >
              {/* Feature card header with icon */}
              <div className={`${feature.color} p-6 text-white group-hover:opacity-90 transition-opacity`}>
                <div className="flex items-center justify-between">
                  {feature.icon}
                  <svg className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
              
              {/* Feature content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Learn more link */}
                <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  <span>Learn more</span>
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Want to see all features in action?
          </p>
          <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl">
            Schedule a Demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default Features;