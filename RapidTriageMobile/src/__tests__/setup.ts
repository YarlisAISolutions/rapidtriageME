import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.RNCNetInfo = {
    getCurrentState: jest.fn(() => Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi'
    })),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };
  return RN;
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => 'mocked-hash'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-auth-session', () => ({
  AuthRequest: jest.fn(),
  makeRedirectUri: jest.fn(() => 'mock://redirect'),
  exchangeCodeAsync: jest.fn(),
  ResponseType: {
    Code: 'code',
  },
}));

// Mock Firebase
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    GoogleAuthProvider: {
      credential: jest.fn(),
    },
    EmailAuthProvider: {
      credential: jest.fn(),
    },
  }),
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({
    // Mock Firebase app
  }),
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn(() => Promise.resolve({ error: null })),
  createPaymentMethod: jest.fn(),
  confirmPayment: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({
    width: 375,
    height: 812,
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock timers for analytics flush tests
jest.useFakeTimers();

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Silence console warnings in tests unless explicitly testing them
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      originalWarn.call(console, ...args);
    }
  };

  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('Warning:') &&
      !args[0].includes('Error: Not implemented')
    ) {
      originalError.call(console, ...args);
    }
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});