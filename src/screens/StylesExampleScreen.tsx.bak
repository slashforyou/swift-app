/**
 * Exemple d'utilisation du système de styles communs
 * Démontre comment utiliser les styles centralisés dans vos composants
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import HomeButton from '../components/ui/home_button';

const StylesExampleScreen = () => {
  const { colors, styles } = useCommonThemedStyles();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      
      {/* Headers */}
      <View style={styles.card}>
        <Text style={styles.h1}>Système de Styles</Text>
        <Text style={styles.body}>
          Découvrez tous les styles disponibles pour une interface cohérente et professionnelle.
        </Text>
      </View>

      {/* Typography Examples */}
      <View style={styles.card}>
        <Text style={styles.h2}>Typographie</Text>
        <Text style={styles.h1}>Titre H1</Text>
        <Text style={styles.h2}>Titre H2</Text>
        <Text style={styles.h3}>Titre H3</Text>
        <Text style={styles.h4}>Titre H4</Text>
        <Text style={styles.bodyLarge}>Corps de texte large</Text>
        <Text style={styles.body}>Corps de texte normal</Text>
        <Text style={styles.bodySmall}>Corps de texte petit</Text>
        <Text style={styles.textMuted}>Texte atténué</Text>
        <Text style={styles.textSecondary}>Texte secondaire</Text>
      </View>

      {/* Button Examples */}
      <View style={styles.card}>
        <Text style={styles.h2}>Boutons</Text>
        
        <Text style={styles.h4}>Boutons Primaires (Orange)</Text>
        <HomeButton 
          title="Bouton Principal" 
          onPress={() => console.log('Primary button pressed')}
          variant="primary"
        />
        <HomeButton 
          title="Bouton Principal Large" 
          onPress={() => console.log('Large primary button pressed')}
          variant="primary"
          size="large"
        />
        
        <Text style={[styles.h4, styles.marginTop]}>Boutons Secondaires</Text>
        <HomeButton 
          title="Bouton Secondaire" 
          onPress={() => console.log('Secondary button pressed')}
          variant="secondary"
        />
        
        <Text style={[styles.h4, styles.marginTop]}>Boutons Outline</Text>
        <HomeButton 
          title="Bouton Outline" 
          onPress={() => console.log('Outline button pressed')}
          variant="outline"
        />
        
        <Text style={[styles.h4, styles.marginTop]}>Bouton Désactivé</Text>
        <HomeButton 
          title="Bouton Désactivé" 
          onPress={() => console.log('Disabled button pressed')}
          variant="primary"
          disabled={true}
        />
      </View>

      {/* Status Messages */}
      <View style={styles.card}>
        <Text style={styles.h2}>Messages de Statut</Text>
        
        <View style={[styles.statusSuccess, styles.marginBottom]}>
          <Text style={styles.statusSuccessText}>✓ Succès - Opération réussie</Text>
        </View>
        
        <View style={[styles.statusWarning, styles.marginBottom]}>
          <Text style={styles.statusWarningText}>⚠ Attention - Vérifiez vos données</Text>
        </View>
        
        <View style={[styles.statusError, styles.marginBottom]}>
          <Text style={styles.statusErrorText}>✗ Erreur - Une erreur s'est produite</Text>
        </View>
        
        <View style={styles.statusInfo}>
          <Text style={styles.statusInfoText}>ℹ Information - Nouvelle mise à jour disponible</Text>
        </View>
      </View>

      {/* Cards & Panels */}
      <View style={styles.card}>
        <Text style={styles.h2}>Cartes et Panneaux</Text>
        
        <View style={styles.panel}>
          <Text style={styles.h4}>Panneau Standard</Text>
          <Text style={styles.bodySmall}>Contenu du panneau avec ombre douce</Text>
        </View>
        
        <View style={styles.cardElevated}>
          <Text style={styles.h4}>Carte Élevée</Text>
          <Text style={styles.bodySmall}>Carte avec ombre plus prononcée pour les éléments importants</Text>
        </View>
      </View>

      {/* List Items */}
      <View style={styles.card}>
        <Text style={styles.h2}>Éléments de Liste</Text>
        
        <View style={styles.listItem}>
          <View style={[styles.buttonIcon, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.buttonPrimaryText, fontWeight: '600' }}>📋</Text>
          </View>
          <View style={styles.listItemContent}>
            <Text style={styles.listItemTitle}>Élément de Liste</Text>
            <Text style={styles.listItemSubtitle}>Description de l'élément avec style cohérent</Text>
          </View>
        </View>
        
        <View style={styles.listItem}>
          <View style={[styles.buttonIcon, { backgroundColor: colors.success }]}>
            <Text style={{ color: colors.buttonPrimaryText, fontWeight: '600' }}>✓</Text>
          </View>
          <View style={styles.listItemContent}>
            <Text style={styles.listItemTitle}>Tâche Terminée</Text>
            <Text style={styles.listItemSubtitle}>Cette tâche a été complétée avec succès</Text>
          </View>
        </View>
      </View>

      {/* Utility Classes */}
      <View style={styles.card}>
        <Text style={styles.h2}>Classes Utilitaires</Text>
        
        <View style={styles.rowBetween}>
          <Text style={styles.body}>Contenu aligné</Text>
          <Text style={[styles.bodySmall, styles.textMuted]}>À droite</Text>
        </View>
        
        <View style={styles.rowCenter}>
          <Text style={styles.body}>Contenu centré</Text>
        </View>
        
        <View style={styles.centerContent}>
          <Text style={[styles.h4, styles.textCenter]}>Complètement centré</Text>
        </View>
      </View>

      {/* Color Palette */}
      <View style={styles.card}>
        <Text style={styles.h2}>Palette de Couleurs</Text>
        <Text style={styles.bodySmall}>Notre palette respecte la règle : jamais de noir pur (#000000)</Text>
        
        <View style={[styles.rowBetween, styles.marginTop]}>
          <View style={[styles.buttonIcon, { backgroundColor: colors.primary }]} />
          <Text style={styles.bodySmall}>Orange Principal</Text>
        </View>
        
        <View style={[styles.rowBetween, styles.marginTop]}>
          <View style={[styles.buttonIcon, { backgroundColor: colors.text }]} />
          <Text style={styles.bodySmall}>Texte Principal (Blue-Grey)</Text>
        </View>
        
        <View style={[styles.rowBetween, styles.marginTop]}>
          <View style={[styles.buttonIcon, { backgroundColor: colors.background }]} />
          <Text style={styles.bodySmall}>Arrière-plan</Text>
        </View>
        
        <View style={[styles.rowBetween, styles.marginTop]}>
          <View style={[styles.buttonIcon, { backgroundColor: colors.backgroundSecondary }]} />
          <Text style={styles.bodySmall}>Arrière-plan Secondaire</Text>
        </View>
      </View>

    </ScrollView>
  );
};

export default StylesExampleScreen;