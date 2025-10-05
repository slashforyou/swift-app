/**
 * Exemple d'utilisation des nouveaux composants
 * Démontre les meilleures pratiques UI mobiles implémentées
 */

import React from 'react';
import { ScrollView } from 'react-native';
import { 
  Screen, 
  VStack, 
  HStack, 
  Card, 
  Button, 
  Input, 
  Title, 
  Subtitle, 
  Body, 
  Muted 
} from '../components';

export const ModernUIExample: React.FC = () => {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack gap="xl">
          
          {/* Header Section */}
          <VStack gap="sm">
            <Title>Swift App - Modern UI</Title>
            <Muted>Exemple des meilleures pratiques UI mobiles implémentées</Muted>
          </VStack>
          
          {/* Typography Demo */}
          <Card>
            <VStack gap="md">
              <Subtitle>Hiérarchie Typographique</Subtitle>
              <VStack gap="xs">
                <Title>Title (20/26, weight 600)</Title>
                <Subtitle>Subtitle (17/22, weight 500)</Subtitle>
                <Body>Body text (15/20, weight 400) - Texte principal avec retour à la ligne automatique, allowFontScaling activé pour l'accessibilité</Body>
                <Muted>Muted text (13/18, weight 400) - Informations secondaires</Muted>
              </VStack>
            </VStack>
          </Card>
          
          {/* Layout Demo */}
          <Card>
            <VStack gap="md">
              <Subtitle>Layout System</Subtitle>
              <Body>VStack et HStack avec gaps basés sur la grille 8pt :</Body>
              
              <HStack gap="md">
                <Card variant="elevated" style={{ flex: 1 }}>
                  <Body>Item 1</Body>
                </Card>
                <Card variant="elevated" style={{ flex: 1 }}>
                  <Body>Item 2</Body>
                </Card>
              </HStack>
              
              <VStack gap="sm">
                <Muted>Spacing scale: xs(4), sm(8), md(12), lg(16), xl(24), xxl(32), xxxl(40)</Muted>
              </VStack>
            </VStack>
          </Card>
          
          {/* Buttons Demo */}
          <Card>
            <VStack gap="md">
              <Subtitle>Touch Targets</Subtitle>
              <Body>Boutons conformes (height 48pt, hitSlop 8, radius 8) :</Body>
              
              <VStack gap="sm">
                <Button title="Primary Button" variant="primary" />
                <Button title="Secondary Button" variant="secondary" />
              </VStack>
              
              <Muted>✅ Touch targets ≥44pt selon Apple HIG et Material Design</Muted>
            </VStack>
          </Card>
          
          {/* Input Demo */}
          <Card>
            <VStack gap="md">
              <Subtitle>Form Elements</Subtitle>
              <Body>Champs uniformisés (height 48pt, radius 8, borders cohérents) :</Body>
              
              <VStack gap="sm">
                <Input 
                  placeholder="Nom complet" 
                  style={{ alignSelf: 'stretch' }}
                />
                <Input 
                  placeholder="Email" 
                  keyboardType="email-address"
                  style={{ alignSelf: 'stretch' }}
                />
              </VStack>
              
              <Muted>✅ États focus visibles, placeholders textMuted, allowFontScaling</Muted>
            </VStack>
          </Card>
          
          {/* Safe Area Demo */}
          <Card>
            <VStack gap="md">
              <Subtitle>Safe Areas & Spacing</Subtitle>
              <Body>Screen component gère automatiquement :</Body>
              
              <VStack gap="xs">
                <Muted>• Safe Area top/bottom (~44pt/34pt)</Muted>
                <Muted>• Gutters horizontaux (16pt)</Muted>
                <Muted>• Background cohérent avec le thème</Muted>
                <Muted>• Pas de marginTop/Bottom fixes</Muted>
              </VStack>
            </VStack>
          </Card>
          
          {/* Dark Mode Demo */}
          <Card>
            <VStack gap="md">
              <Subtitle>Thèmes Light/Dark</Subtitle>
              <Body>Système automatique basé sur les préférences utilisateur :</Body>
              
              <VStack gap="xs">
                <Muted>• Détection thème système</Muted>
                <Muted>• Ombres adaptées (soft/medium/strong)</Muted>
                <Muted>• Contraste texte ≥4.5:1</Muted>
                <Muted>• Couleurs semantiques cohérentes</Muted>
              </VStack>
            </VStack>
          </Card>
          
        </VStack>
      </ScrollView>
    </Screen>
  );
};

export default ModernUIExample;