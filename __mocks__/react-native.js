// Mock complet de React Native pour les tests
const React = require('react');

const View = 'View';
const Text = 'Text';
const TouchableOpacity = 'TouchableOpacity';
const Image = 'Image';
const TextInput = 'TextInput';
const ScrollView = 'ScrollView';
const FlatList = 'FlatList';

// Modal component qui respecte la prop visible
const Modal = ({ children, visible }) => {
  return visible ? children : null;
};

const ActivityIndicator = 'ActivityIndicator';
const SafeAreaView = 'SafeAreaView';
const KeyboardAvoidingView = 'KeyboardAvoidingView';
const Pressable = 'Pressable';
const Button = 'Button';
const Switch = 'Switch';
const RefreshControl = 'RefreshControl';

const Platform = {
  OS: 'ios',
  Version: 14,
  select: (obj) => obj.ios || obj.default,
  isPad: false,
  isTVOS: false,
  isTV: false,
};

const StyleSheet = {
  create: (styles) => styles,
  flatten: (styles) => styles,
  compose: (a, b) => [a, b],
};

const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const Alert = {
  alert: jest.fn(),
  prompt: jest.fn(),
};

const Animated = {
  View: 'Animated.View',
  Text: 'Animated.Text',
  Image: 'Animated.Image',
  ScrollView: 'Animated.ScrollView',
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => ({
      setValue: jest.fn(),
    })),
  })),
  timing: jest.fn(() => ({
    start: jest.fn((callback) => callback && callback()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn((callback) => callback && callback()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  decay: jest.fn(() => ({
    start: jest.fn((callback) => callback && callback()),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  sequence: jest.fn(),
  parallel: jest.fn(),
  stagger: jest.fn(),
  loop: jest.fn(),
  event: jest.fn(),
  createAnimatedComponent: (component) => component,
};

const Keyboard = {
  dismiss: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

const PixelRatio = {
  get: jest.fn(() => 2),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
  roundToNearestPixel: jest.fn((size) => size),
};

const NativeModules = {
  DevMenu: {
    reload: jest.fn(),
    show: jest.fn(),
  },
  PlatformConstants: {
    isTesting: true,
    reactNativeVersion: { major: 0, minor: 73, patch: 0 },
  },
};

const NativeEventEmitter = jest.fn(() => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
}));

module.exports = {
  // Components
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Pressable,
  Button,
  Switch,
  RefreshControl,
  
  // APIs
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Keyboard,
  PixelRatio,
  NativeModules,
  NativeEventEmitter,
  
  // Utilities
  LayoutAnimation: {
    configureNext: jest.fn(),
    create: jest.fn(),
    Types: {},
    Properties: {},
  },
  
  StatusBar: {
    setBarStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
    setHidden: jest.fn(),
  },
  
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  },
  
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
  },
};
