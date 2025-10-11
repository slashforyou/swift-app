// Mock data for testing different user types
import { UserProfile, UserType } from './user';

export const mockEmployeeProfile: UserProfile = {
  id: '1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@swiftapp.com',
  phone: '+1 555 123 4567',
  role: 'driver',
  userType: 'employee', // TFN employee - cannot see company section
  
  // Address
  address: '123 Main Street',
  city: 'New York',
  postalCode: '10001',
  country: 'United States',
  
  // No company info for employees
  companyName: '',
  siret: '',
  tva: '',
  
  // General
  joinDate: '2024-01-15',
  lastLogin: '2025-10-10T10:30:00Z',
  profilePicture: '',
  
  // Gamification
  level: 8,
  experience: 1250,
  experienceToNextLevel: 1800,
  title: 'Experienced Driver',
  
  preferences: {
    theme: 'auto',
    language: 'en',
    notifications: true,
  },
  permissions: ['driver'],
  isActive: true,
};

export const mockWorkerProfile: UserProfile = {
  id: '2',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@logistics.com.au',
  phone: '+61 412 345 678',
  role: 'contractor',
  userType: 'worker', // ABN worker - can see company section
  
  // Address
  address: '456 Business Ave',
  city: 'Sydney',
  postalCode: '2000',
  country: 'Australia',
  
  // Company info for ABN workers
  companyName: 'Johnson Logistics Pty Ltd',
  siret: 'ABN 12 345 678 901',
  tva: 'GST123456789',
  
  // General
  joinDate: '2023-06-20',
  lastLogin: '2025-10-10T09:15:00Z',
  profilePicture: '',
  
  // Gamification
  level: 15,
  experience: 2890,
  experienceToNextLevel: 3500,
  title: 'Senior Contractor',
  
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: true,
  },
  permissions: ['contractor', 'advanced'],
  isActive: true,
};

// Function to switch between mock profiles for testing
export const getMockProfile = (userType: UserType): UserProfile => {
  return userType === 'employee' ? mockEmployeeProfile : mockWorkerProfile;
};