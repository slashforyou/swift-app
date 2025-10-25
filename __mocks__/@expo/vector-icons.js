// Mock pour @expo/vector-icons
const React = require('react');

// Créer un mock d'icon component
const createIconComponent = (name) => {
  const IconComponent = (props) => {
    return name; // Retourne juste le nom pour les snapshots
  };
  IconComponent.displayName = name;
  return IconComponent;
};

// Exporter tous les sets d'icônes
module.exports = {
  Ionicons: createIconComponent('Ionicons'),
  MaterialIcons: createIconComponent('MaterialIcons'),
  MaterialCommunityIcons: createIconComponent('MaterialCommunityIcons'),
  FontAwesome: createIconComponent('FontAwesome'),
  FontAwesome5: createIconComponent('FontAwesome5'),
  Feather: createIconComponent('Feather'),
  AntDesign: createIconComponent('AntDesign'),
  Entypo: createIconComponent('Entypo'),
  EvilIcons: createIconComponent('EvilIcons'),
  Foundation: createIconComponent('Foundation'),
  Octicons: createIconComponent('Octicons'),
  SimpleLineIcons: createIconComponent('SimpleLineIcons'),
  Zocial: createIconComponent('Zocial'),
};
