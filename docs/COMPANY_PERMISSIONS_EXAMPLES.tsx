/**
 * Practical Usage Examples - Company/User Permissions
 * API v1.1.0 - Company Relationship Implementation
 *
 * This file contains ready-to-use examples for implementing
 * the new company-based permission system in your screens and components.
 */

// ============================================================================
// Example 1: Job Creation Button with Permission Check
// ============================================================================

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useCompanyPermissions , getUserCompanyData } from "../hooks/useCompanyPermissions";

// ============================================================================
// Example 2: Calendar Screen with Role-Based Title
// ============================================================================



// ============================================================================
// Example 3: Profile Screen with Company Information
// ============================================================================




// ============================================================================
// Example 4: Job Details with Creator Information
// ============================================================================

import { JobAPI } from '../services/jobs';

// ============================================================================
// Example 6: Navigation Guard for Job Creation
// ============================================================================

import { useNavigation } from '@react-navigation/native';

// ============================================================================
// Example 8: Error Handling for 403 Responses
// ============================================================================

import { getJobCreationErrorMessage } from '../utils/permissions';

export const CreateJobButton: React.FC<{ onPress: () => void }> = ({
  onPress,
}) => {
  const { canCreateJob, getJobCreationError } = useCompanyPermissions();

  if (!canCreateJob) {
    return (
      <View style={styles.disabledContainer}>
        <TouchableOpacity style={[styles.button, styles.disabled]} disabled>
          <Text style={styles.buttonText}>➕ Create Job</Text>
        </TouchableOpacity>
        <Text style={styles.errorHint}>{getJobCreationError()}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>➕ Create Job</Text>
    </TouchableOpacity>
  );
mport { useCompanyPermissions } from "../hooks/useCompanyPermissions";

export const CalendarScreen: React.FC = () => {
  const { calendarLabel, canSeeAllJobs, company } = useCompanyPermissions();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{calendarLabel}</Text>
        {company && <Text style={styles.subtitle}>{company.name}</Text>}
      </View>

      <View style={styles.info}>
        {canSeeAllJobs ? (
          <Text style={styles.infoText}>📊 Viewing all company jobs</Text>
        ) : (
          <Text style={styles.infoText}>
            👤 Viewing your assigned jobs only
          </Text>
        )}
      </View>

      {/* Calendar content here */}
    </View>
  );
};

// ============================================================================
// Example 3: Profile Screen with Company Information
//

a useEffect(() => {
    async function loadCompanyData() {
      try {
        const data = await getUserCompanyData();
        setCompanyData(data);
      } catch (error) {
        console.error("Failed to load company data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>👤 User Information</Text>
        {/* User details */}
      </View>

      {companyData && companyData.company && (
        <View style={styles.section}>
          <Text style={styles.label}>🏢 Company Information</Text>
          <Text style={styles.value}>{companyData.company.name}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>
            {getRoleBadge(companyData.companyRole)}
          </Text>
        </View>
      )}
    </View>
  );
};

// Helper function for role badges
function getRoleBadge(role?: string): string {
  switch (role) {
    case "patron":
      return "👑 Owner";
    case "cadre":
      return "👔 Manager";
    case "employee":
      return "👷 Employee";
    default:
      return "❓ Unknown";
  }
}

// ============================================================================
///


export const JobDetailsScreen: React.FC<JobDetailsProps> = ({ job }) => {
  const hasCreatorInfo = job.created_by_first_name && job.created_by_last_name;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.jobCode}>{job.code || job.id}</Text>
        <Text style={styles.jobStatus}>{job.status}</Text>
      </View>

      {/* Job details */}

      {hasCreatorInfo && (
        <View style={styles.creatorSection}>
          <Text style={styles.sectionTitle}>Created By</Text>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>
              👤 {job.created_by_first_name} {job.created_by_last_name}
            </Text>
            {job.created_by_email && (
              <Text style={styles.creatorEmail}>✉️ {job.created_by_email}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Example 5: Job Creation Form with Permission Validation
// ============================================================================

export const JobCreationForm: React.FC = () => {
  const { canCreateJob, getJobCreationError } = useCompanyPermissions();
  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    // Double-check permissions before submitting
    if (!canCreateJob) {
      Alert.alert("Permission Denied", getJobCreationError(), [{ text: "OK" }]);
      return;
    }

    try {
      // Submit job creation
      // The backend will auto-assign contractor_company_id
      const response = await fetch("/swift-app/v1/job", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.status === 403) {
        Alert.alert(
          "Permission Denied",
          "You do not have permission to create jobs",
        );
        return;
      }

      // Handle success
    } catch (error) {
      console.error("Job creation failed:", error);
    }
  };

  // Show access denied message if user doesn't have permission
  if (!canCreateJob) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
        <Text style={styles.accessDeniedMessage}>{getJobCreationError()}</Text>
        <Text style={styles.accessDeniedHint}>
          Contact your manager if you need to create jobs.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      {/* Form fields */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Create Job</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// Example 6: Navigation Guard for Job Creation
// ============================================================================

import { useNavigation } from "@react-navigation/native";

export const useJobCreationGuard = () => {
  const { canCreateJob, getJobCreationError } = useCompanyPermissions();
  const navigation = useNavigation();
a     return false;
    }

    navigation.navigate("CreateJob");
    return true;
  };

  return { navigateToJobCreation, canCreateJob };
};

// Usage in a component:
export const JobsList: React.FC = () => {
  const { navigateToJobCreation } = useJobCreationGuard();

  return (
    <View>
      <TouchableOpacity onPress={navigateToJobCreation}>
        <Text>Create New Job</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// Example 7: Conditional Menu Items Based on Permissions
// ============================================================================

export const SettingsMenu: React.FC = () => {
  const { isManager, isOwner, canCreateJob } = useCompanyPermissions();

  const menuItems = [
    { id: "profile", label: "My Profile", visible: true },
    { id: "calendar", label: "Calendar", visible: true },
    { id: "create-job", label: "Create Job", visible: canCreateJob },
    { id: "manage-staff", label: "Manage Staff", visible: isManager },
    { id: "company-settings", label: "Company Settings", visible: isOwner },
    { id: "reports", label: "Reports", visible: isManager },
  ];

  return (
    <View style={styles.menu}>
      {menuItems
        .filter((item) => item.visible)
        .map((item) => (
          <TouchableOpacity key={item.id} style={styles.menuItem}>
            <Text>{item.label}</Text>
          </TouchableOpacity>
        ))}
    </View>
  );
};

// ============================================================================
// Example 8: Error Handling for 403 Responses
// ============================================================================

import { getJobCreationErrorMessage } from "../utils/permissions";

export const handleJobCreationError = async (response: Response) => {
  if (response.status === 403) {
    


    return true; // Error was handled
  }

  return false; // Not a permission error
};

// Usage in API call:
const createJob = async (jobData: any) => {
  try {
    const response = await fetch("/swift-app/v1/job", {
      method: "POST",
      body: JSON.stringify(jobData),
    });

    // Check for permission error
    const wasPermissionError = await handleJobCreationError(response);
    if (wasPermissionError) return;

    // Handle other errors or success
    if (!response.ok) {
      throw new Error("Job creation failed");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

// ============================================================================
// STYLES (Example - adapt to your theme)
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledContainer: {
    alignItems: "center",
  },
  errorHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#FF3B30",
    textAlign: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  info: {
    padding: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  creatorSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  creatorInfo: {
    marginLeft: 8,
  },
  creatorName: {
    fontSize: 14,
    marginBottom: 4,
  },
  creatorEmail: {
    fontSize: 12,
    color: "#666",
  },
  accessDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  accessDeniedMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
    color: "#666",
  },
  accessDeniedHint: {
    fontSize: 14,
    textAlign: "center",
    color: "#999",
  },
  form: {
    flex: 1,
    padding: 16,
  },
  submitButton: {
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  submitText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  jobCode: {
    fontSize: 20,
    fontWeight: "bold",
  },
  jobStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});

export default styles;
