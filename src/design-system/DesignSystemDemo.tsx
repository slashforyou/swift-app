/**
 * Exemple d'utilisation du Design System
 * Démo simple des composants disponibles
 */

import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

// Import du design system complet
import {
    Body,
    // Composants UI modernisés
    Button,
    Caption,
    Card,
    // Tokens et hooks
    DESIGN_TOKENS,
    Display,
    Heading1,
    Heading2,
    Input,
    Screen,
    Title,
    useTheme
} from '@/src/design-system/components';

const DesignSystemDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  
  // Hook pour accéder au thème et couleurs
  const { theme, colors } = useTheme();

  const handleButtonPress = (variant: string) => {
    Alert.alert('Bouton pressé', `Variant: ${variant}`);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (text.length < 3 && text.length > 0) {
      setInputError('Minimum 3 caractères');
    } else {
      setInputError('');
    }
  };

  return (
    <Screen variant="default">
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          padding: DESIGN_TOKENS.spacing.lg,
          gap: DESIGN_TOKENS.spacing.xl 
        }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Section Header */}
        <Card variant="default" padding={DESIGN_TOKENS.spacing.lg}>
          <Display style={{ textAlign: 'center', marginBottom: DESIGN_TOKENS.spacing.md }}>
            Design System Demo
          </Display>
          
          <Caption style={{ 
            textAlign: 'center', 
            color: colors.textSecondary,
            marginBottom: DESIGN_TOKENS.spacing.lg 
          }}>
            Mode actuel: {theme}
          </Caption>
          
          <Heading1 style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
            Typography
          </Heading1>
          
          <Heading2 style={{ marginBottom: DESIGN_TOKENS.spacing.xs }}>
            Heading 2 - Sections principales
          </Heading2>
          
          <Title style={{ marginBottom: DESIGN_TOKENS.spacing.xs }}>
            Title - Sous-sections
          </Title>
          
          <Body style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
            Body - Texte de contenu principal. Lorem ipsum dolor sit amet, 
            consectetur adipiscing elit.
          </Body>
          
          <Caption style={{ color: colors.textSecondary }}>
            Caption - Notes et métadonnées
          </Caption>
        </Card>

        {/* Section Buttons */}
        <Card variant="elevated" padding={DESIGN_TOKENS.spacing.lg}>
          <Heading2 style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            Boutons - Variants
          </Heading2>
          
          <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
            <Button 
              title="Primary Button"
              variant="primary" 
              size="medium"
              onPress={() => handleButtonPress('primary')}
            />
            
            <Button 
              title="Secondary Button"
              variant="secondary"
              size="medium" 
              onPress={() => handleButtonPress('secondary')}
            />
            
            <Button 
              title="Outline Button"
              variant="outline"
              size="medium"
              onPress={() => handleButtonPress('outline')}
            />
            
            <Button 
              title="Ghost Button"
              variant="ghost"
              size="medium"
              onPress={() => handleButtonPress('ghost')}
            />
          </View>
        </Card>

        {/* Section Inputs */}
        <Card variant="default" padding={DESIGN_TOKENS.spacing.lg}>
          <Heading2 style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            Champs de saisie
          </Heading2>
          
          <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
            <Input
              variant="default"
              size="medium"
              label="Input Default"
              placeholder="Saisissez votre texte"
              value={inputValue}
              onChangeText={handleInputChange}
              error={inputError}
            />
            
            <Input
              variant="outlined"
              size="medium"
              label="Input Outlined"
              placeholder="Version outlined"
            />
            
            <Input
              variant="filled"
              size="medium"
              label="Input Filled"
              placeholder="Version filled"
            />
          </View>
        </Card>

        {/* Section Cards */}
        <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
          <Heading2>Cartes - Variants</Heading2>
          
          <Card variant="default" padding={DESIGN_TOKENS.spacing.md}>
            <Title>Card Default</Title>
            <Body style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
              Carte avec style par défaut
            </Body>
          </Card>
          
          <Card variant="elevated" padding={DESIGN_TOKENS.spacing.md}>
            <Title>Card Elevated</Title>
            <Body style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
              Carte avec ombre prononcée
            </Body>
          </Card>
          
          <Card variant="outlined" padding={DESIGN_TOKENS.spacing.md}>
            <Title>Card Outlined</Title>
            <Body style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
              Carte avec bordure visible
            </Body>
          </Card>
          
          <Card variant="flat" padding={DESIGN_TOKENS.spacing.md}>
            <Title>Card Flat</Title>
            <Body style={{ marginTop: DESIGN_TOKENS.spacing.xs }}>
              Carte sans ombre ni bordure
            </Body>
          </Card>
        </View>

        {/* Section Design Tokens */}
        <Card variant="elevated" padding={DESIGN_TOKENS.spacing.lg}>
          <Heading2 style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            Design Tokens
          </Heading2>
          
          <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
            <View>
              <Title style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
                Spacing System Disponible
              </Title>
              <Body>
                xs: {DESIGN_TOKENS.spacing.xs}px{'\n'}
                sm: {DESIGN_TOKENS.spacing.sm}px{'\n'}
                md: {DESIGN_TOKENS.spacing.md}px{'\n'}
                lg: {DESIGN_TOKENS.spacing.lg}px{'\n'}
                xl: {DESIGN_TOKENS.spacing.xl}px
              </Body>
            </View>
            
            <View>
              <Title style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
                Typography Scale
              </Title>
              <Body>
                Les composants Typography utilisent automatiquement{'\n'}
                la hiérarchie définie dans DESIGN_TOKENS.typography
              </Body>
            </View>
          </View>
        </Card>

        {/* Espacement final */}
        <View style={{ height: DESIGN_TOKENS.spacing.xl }} />
        
      </ScrollView>
    </Screen>
  );
};

export default DesignSystemDemo;