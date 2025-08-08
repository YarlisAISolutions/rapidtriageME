# RapidTriage Mobile

A comprehensive React Native mobile application for lightning-fast website diagnostics and performance analysis.

## Features

- **Performance Analysis**: Core Web Vitals and optimization recommendations
- **Accessibility Audit**: WCAG compliance checks and inclusive design insights
- **SEO Optimization**: Search engine visibility analysis
- **Security Scanning**: Vulnerability detection and security best practices
- **Mobile-First Analysis**: Responsive design analysis and mobile optimization
- **Continuous Monitoring**: 24/7 website monitoring with automated alerts

## Project Structure

```
src/
├── ui/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Common UI components (Button, Card, Typography)
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── forms/          # Form components
│   │   ├── landing/        # Landing page components (Hero, Features, Pricing, etc.)
│   │   ├── monetization/   # Subscription and billing components
│   │   └── onboarding/     # Onboarding flow components
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── main/          # Main app screens
│   │   ├── onboarding/    # Onboarding screens
│   │   ├── settings/      # Settings screens
│   │   └── subscription/  # Subscription management screens
│   ├── navigation/         # Navigation configuration
│   └── styles/            # Shared styles and themes
│       ├── colors/        # Color definitions
│       ├── themes/        # Theme configuration
│       └── typography/    # Typography styles
├── services/              # Business logic and API services
│   ├── api/              # API client and endpoints
│   ├── auth/             # Authentication services
│   ├── payment/          # Payment processing
│   └── storage/          # Local storage utilities
├── store/                # State management (Zustand)
│   ├── slices/           # State slices
│   └── types/            # TypeScript type definitions
├── utils/                # Utility functions
│   ├── formatters/       # Data formatting utilities
│   ├── helpers/          # Helper functions
│   └── validators/       # Input validation
└── constants/            # App constants and configuration
    ├── api/             # API endpoints and configuration
    ├── app/             # App-wide constants
    └── colors/          # Color definitions
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio and emulator (for Android development)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RapidTriageMobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on iOS**:
   ```bash
   npm run ios
   ```

6. **Run on Android**:
   ```bash
   npm run android
   ```

7. **Run on Web**:
   ```bash
   npm run web
   ```

### Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

```env
# API Configuration
API_BASE_URL=https://api.rapidtriage.com
API_VERSION=v1

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Architecture

### State Management

The app uses **Zustand** for lightweight and efficient state management:

- `useAuthStore`: Manages user authentication and profile data
- `useTriageStore`: Handles scan reports and analysis results
- `useAppStore`: Manages app-wide settings and configuration

### Navigation

Built with **React Navigation v6**:

- **Stack Navigation**: For linear flows (onboarding, auth)
- **Tab Navigation**: For main app sections
- **Drawer Navigation**: For settings and profile access

### Theming

Consistent theming system with:

- Light and dark mode support
- Brand color palette
- Typography scale based on Material Design
- Responsive spacing system (8-point grid)

### API Integration

- **Axios** for HTTP requests
- Centralized API configuration
- Request/response interceptors
- Error handling and retry logic

## Key Components

### Phase 1 UI Components

1. **Hero Component** (`src/ui/components/landing/Hero.tsx`)
   - Main value proposition
   - Call-to-action buttons
   - Trust indicators and metrics

2. **Features Component** (`src/ui/components/landing/Features.tsx`)
   - 6-feature grid layout
   - Interactive feature cards
   - Performance metrics display

3. **Interactive Demo** (`src/ui/components/landing/InteractiveDemo.tsx`)
   - Live website analysis playground
   - URL input and validation
   - Real-time scan results

4. **Pricing Table** (`src/ui/components/landing/Pricing.tsx`)
   - 4-tier subscription plans
   - Monthly/yearly billing toggle
   - Feature comparison

5. **Testimonials Carousel** (`src/ui/components/landing/Testimonials.tsx`)
   - Customer reviews and ratings
   - Auto-scrolling carousel
   - Company logos and metrics

### Common Components

- **Button**: Consistent button styling with variants
- **Card**: Container component with elevation
- **Typography**: Semantic text components (H1-H6, Body, Caption)
- **Form Components**: Input fields, validation, and error handling

## Subscription Tiers

- **Free**: 10 scans/month, community support
- **Pro ($29/mo)**: Unlimited scans, priority support, API access
- **Team ($99/mo)**: Team collaboration, advanced analytics, SSO
- **Enterprise**: Custom pricing, on-premise, SLA guarantees

## Development

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Path Aliases**: Absolute imports with `@` prefix

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for web
npm run build
```

## Deployment

### iOS

1. Configure iOS bundle identifier in `app.json`
2. Set up Apple Developer account
3. Run `expo build:ios`
4. Submit to App Store Connect

### Android

1. Configure Android package name in `app.json`
2. Generate keystore for signing
3. Run `expo build:android`
4. Upload to Google Play Console

### Web

1. Run `npm run build`
2. Deploy the `dist/` folder to your hosting provider

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@rapidtriage.com
- Documentation: https://docs.rapidtriage.com
- Issues: GitHub Issues page