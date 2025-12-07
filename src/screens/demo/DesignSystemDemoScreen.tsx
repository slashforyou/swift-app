/**
 * Demo Screen - Démonstration des composants avancés du Design System
 * Showcase des nouveaux composants Typography, Button, Card, Input
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Body, BodyLarge, BodySmall,
    Button,
    Caption,
    CardActions,
    CardContent,
    CardFooter,
    CardHeader,
    Code,
    DestructiveButton,
    // Typography
    Display,
    // Cards
    ElevatedCard,
    ErrorText,
    FilledCard,
    FilledInput,
    GhostButton,
    GlassCard,
    H1, H2, H3,
    IconButton,
    InfoButton,
    InfoText,
    // Inputs
    Input,
    InteractiveCard,
    Label,
    Link,
    OutlineButton,
    OutlinedCard,
    OutlinedInput,
    PasswordInput,
    // Buttons
    PrimaryButton,
    SearchInput,
    SecondaryButton,
    SEMANTIC_SPACING,
    SuccessButton,
    SuccessText,
    TextArea,
    UnderlinedInput,
    // Layout & Theme
    useTheme,
    WarningButton,
    WarningText,
} from '../components/ui';

export const DesignSystemDemoScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');

  const demoCardData = {
    balance: { available: 1250.75, currency: 'EUR' },
    todayStats: { paymentsReceived: 12 }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.section}>
        <Display style={{ color: colors.text }}>
          Design System Demo
        </Display>
        <Body style={{ color: colors.textSecondary, marginTop: SEMANTIC_SPACING.sm }}>
          Démonstration des nouveaux composants avancés
        </Body>
        <OutlineButton
          title={isDark ? "Mode Clair" : "Mode Sombre"}
          leftIcon="color-palette"
          onPress={toggleTheme}
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
      </View>

      {/* Typography Section */}
      <View style={styles.section}>
        <H2 style={{ color: colors.text }}>Typography</H2>
        
        <Display style={{ color: colors.text }}>Display Text</Display>
        <H1 style={{ color: colors.text }}>H1 Heading</H1>
        <H2 style={{ color: colors.text }}>H2 Heading</H2>
        <H3 style={{ color: colors.text }}>H3 Heading</H3>
        
        <BodyLarge style={{ color: colors.text }}>Body Large Text</BodyLarge>
        <Body style={{ color: colors.text }}>Body Regular Text</Body>
        <BodySmall style={{ color: colors.text }}>Body Small Text</BodySmall>
        
        <Label style={{ color: colors.text }}>Label Text</Label>
        <Caption style={{ color: colors.textSecondary }}>Caption Text</Caption>
        
        <Code style={{ color: colors.text }}>const code = 'example';</Code>
        <Link href="#" style={{ color: colors.interactive }}>Link Text</Link>
        
        <View style={styles.messagesRow}>
          <ErrorText>Erreur : Champ requis</ErrorText>
          <SuccessText>Succès : Opération réussie</SuccessText>
          <WarningText>Attention : Vérifiez</WarningText>
          <InfoText>Info : Pour information</InfoText>
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.section}>
        <H2 style={{ color: colors.text }}>Buttons</H2>
        
        <View style={styles.buttonGrid}>
          <PrimaryButton title="Primary" />
          <SecondaryButton title="Secondary" />
          <OutlineButton title="Outline" />
          <GhostButton title="Ghost" />
          
          <DestructiveButton title="Destructive" />
          <SuccessButton title="Success" />
          <WarningButton title="Warning" />
          <InfoButton title="Info" />
        </View>
        
        <View style={styles.buttonsRow}>
          <IconButton leftIcon="star" />
          <Button title="Loading" loading />
          <Button title="Disabled" disabled />
          <Button title="With Icon" leftIcon="add" rightIcon="arrow-forward" />
        </View>
        
        <View style={styles.buttonsRow}>
          <Button title="Small" size="sm" />
          <Button title="Medium" size="md" />
          <Button title="Large" size="lg" />
        </View>
        
        <Button title="Full Width" fullWidth style={{ marginTop: SEMANTIC_SPACING.md }} />
      </View>

      {/* Cards Section */}
      <View style={styles.section}>
        <H2 style={{ color: colors.text }}>Cards</H2>
        
        {/* Dashboard Card Example */}
        <ElevatedCard padding="lg" style={{ marginBottom: SEMANTIC_SPACING.md }}>
          <CardHeader>
            <H3 style={{ color: colors.text }}>Dashboard Card</H3>
          </CardHeader>
          <CardContent>
            <Body style={{ color: colors.success, fontSize: 24, fontWeight: '600' }}>
              {formatCurrency(demoCardData.balance.available)}
            </Body>
            <Body style={{ color: colors.textSecondary }}>
              Aujourd'hui: {demoCardData.todayStats.paymentsReceived} paiements
            </Body>
          </CardContent>
          <CardFooter>
            <Body style={{ color: colors.textSecondary, fontSize: 12 }}>
              Dernière mise à jour: maintenant
            </Body>
          </CardFooter>
        </ElevatedCard>
        
        <OutlinedCard padding="md" style={{ marginBottom: SEMANTIC_SPACING.md }}>
          <H3 style={{ color: colors.text }}>Outlined Card</H3>
          <Body style={{ color: colors.textSecondary }}>Contenu de la carte outlined</Body>
        </OutlinedCard>
        
        <FilledCard padding="md" style={{ marginBottom: SEMANTIC_SPACING.md }}>
          <H3 style={{ color: colors.text }}>Filled Card</H3>
          <Body style={{ color: colors.textSecondary }}>Contenu de la carte filled</Body>
        </FilledCard>
        
        <InteractiveCard 
          padding="md" 
          onPress={() => console.log('Card pressed')}
          style={{ marginBottom: SEMANTIC_SPACING.md }}
        >
          <H3 style={{ color: colors.text }}>Interactive Card</H3>
          <Body style={{ color: colors.textSecondary }}>Cliquez sur cette carte</Body>
          <CardActions align="right">
            <GhostButton title="Action" size="sm" />
          </CardActions>
        </InteractiveCard>
        
        <GlassCard padding="md">
          <H3 style={{ color: colors.text }}>Glass Card</H3>
          <Body style={{ color: colors.textSecondary }}>Effet de transparence</Body>
        </GlassCard>
      </View>

      {/* Inputs Section */}
      <View style={styles.section}>
        <H2 style={{ color: colors.text }}>Inputs</H2>
        
        <Input
          label="Input Standard"
          placeholder="Saisir du texte..."
          value={inputValue}
          onChangeText={setInputValue}
          helperText="Texte d'aide"
          clearable
        />
        
        <OutlinedInput
          label="Input Outlined"
          placeholder="Outlined input"
          leftIcon="person"
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <FilledInput
          label="Input Filled"
          placeholder="Filled input"
          rightIcon="calendar"
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <UnderlinedInput
          label="Input Underlined"
          placeholder="Underlined input"
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <PasswordInput
          label="Mot de passe"
          placeholder="Entrer votre mot de passe"
          value={passwordValue}
          onChangeText={setPasswordValue}
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <SearchInput
          label="Recherche"
          placeholder="Rechercher..."
          value={searchValue}
          onChangeText={setSearchValue}
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <TextArea
          label="Zone de texte"
          placeholder="Saisir un texte long..."
          value={textAreaValue}
          onChangeText={setTextAreaValue}
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <Input
          label="Input avec erreur"
          placeholder="Test erreur"
          error
          errorText="Ce champ est obligatoire"
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <Input
          label="Input avec succès"
          placeholder="Test succès"
          success
          successText="Valeur correcte"
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
        
        <Input
          label="Input désactivé"
          placeholder="Désactivé"
          disabled
          style={{ marginTop: SEMANTIC_SPACING.md }}
        />
      </View>

      <View style={{ height: SEMANTIC_SPACING['2xl'] }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SEMANTIC_SPACING.lg,
  },
  
  section: {
    marginBottom: SEMANTIC_SPACING['2xl'],
  },
  
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SEMANTIC_SPACING.md,
    marginTop: SEMANTIC_SPACING.md,
  },
  
  buttonsRow: {
    flexDirection: 'row',
    gap: SEMANTIC_SPACING.sm,
    marginTop: SEMANTIC_SPACING.md,
    flexWrap: 'wrap',
  },
  
  messagesRow: {
    gap: SEMANTIC_SPACING.xs,
    marginTop: SEMANTIC_SPACING.md,
  },
});

export default DesignSystemDemoScreen;