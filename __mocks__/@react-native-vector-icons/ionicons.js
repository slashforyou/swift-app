// Mock pour @react-native-vector-icons/ionicons
const React = require('react');

// Mock du composant Icon
const Icon = ({ name, size, color, style, ...props }) => {
  return name; // Retourne le nom de l'icône pour les snapshots/tests
};

Icon.Button = ({ children, ...props }) => {
  return React.createElement('TouchableOpacity', props, children);
};

Icon.TabBarItem = ({ children, ...props }) => {
  return React.createElement('View', props, children);
};

Icon.TabBarItemIOS = ({ children, ...props }) => {
  return React.createElement('View', props, children);
};

Icon.ToolbarAndroid = ({ children, ...props }) => {
  return React.createElement('View', props, children);
};

Icon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mock-icon' }));
Icon.getImageSourceSync = jest.fn(() => ({ uri: 'mock-icon' }));
Icon.loadFont = jest.fn(() => Promise.resolve());
Icon.hasIcon = jest.fn(() => true);
Icon.getRawGlyphMap = jest.fn(() => ({}));
Icon.getFontFamily = jest.fn(() => 'Ionicons');

module.exports = Icon;
module.exports.default = Icon;
