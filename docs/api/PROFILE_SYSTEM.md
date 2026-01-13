# Profile System Documentation

## Overview
The profile system now supports two distinct user types with different access levels and features:

### User Types

#### 1. Employee (TFN)
- **Type**: `'employee'`
- **Description**: Traditional employees with Tax File Number (TFN)
- **Access**: Cannot see company information section
- **Use Case**: Drivers who work directly for the company as employees

#### 2. Worker (ABN)
- **Type**: `'worker'`
- **Description**: Independent contractors with Australian Business Number (ABN)  
- **Access**: Can see and edit company information section
- **Use Case**: Independent contractors who provide services through their own business

### Features

#### Profile Information
- **Personal Information**: Available to all user types
  - First Name, Last Name
  - Email, Phone
  
- **Address Information**: Available to all user types
  - Address, City, Postal Code, Country

- **Company Information**: Only visible for workers (ABN)
  - Company Name
  - SIRET Number
  - VAT Number

#### Gamification System
- **Level System**: Shows user's current level (1-∞)
- **Experience Points**: Current XP and target for next level
- **User Title**: Role-based titles (e.g., "Senior Driver", "Experienced Contractor")
- **Progress Visualization**: XP progress bar with percentage completion

#### API Integration
- **Real-time Data**: Fetches user profile from `/user-info` endpoint
- **Auto-refresh**: Handles token refresh automatically
- **Error Handling**: Comprehensive error states with retry functionality
- **Loading States**: Shows loading indicators during API calls

#### Development Features
- **Mock Data**: Toggle `USE_MOCK_DATA` in `useUserProfile.ts` for testing
- **User Type Testing**: Automatically alternates between employee/worker for testing
- **Realistic Data**: Mock profiles with appropriate data for each user type

### Implementation Details

#### File Structure
```
src/
├── services/
│   ├── user.ts           # API calls and type definitions
│   └── userMockData.ts   # Mock data for testing
├── hooks/
│   └── useUserProfile.ts # Profile management hook
└── screens/
    └── profile.tsx       # Profile UI component
```

#### Key Components

##### UserProfile Interface
```typescript
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: 'employee' | 'worker';
  
  // Address
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  
  // Company info (workers only)
  companyName?: string;
  siret?: string;
  tva?: string;
  
  // Gamification
  level?: number;
  experience?: number;
  experienceToNextLevel?: number;
  title?: string;
}
```

##### Profile Screen Logic
- Conditional rendering based on `userType`
- Real-time form validation
- Optimistic updates with error rollback
- Loading and error states

### Usage Examples

#### Mock Data Setup
```typescript
// Switch between user types for testing
const mockEmployee = getMockProfile('employee');
const mockWorker = getMockProfile('worker');
```

#### API Integration
```typescript
const { profile, isLoading, error, updateProfile } = useUserProfile();

// Update profile
await updateProfile({
  firstName: 'John',
  companyName: 'New Company' // Only for workers
});
```

#### Conditional UI
```typescript
// Show company section only for workers
{profile?.userType === 'worker' && (
  <CompanyInformationSection />
)}
```

### Security & Access Control

#### User Type Validation
- Server-side validation ensures users can only access appropriate sections
- Client-side UI adapts based on user type
- API endpoints validate user permissions

#### Data Protection
- Company information only accessible to workers
- Profile updates validated against user type
- Sensitive data filtered based on permissions

### Testing

#### Mock Data Testing
1. Set `USE_MOCK_DATA = true` in `useUserProfile.ts`
2. App will randomly switch between employee/worker profiles
3. Test all functionality with both user types

#### Real API Testing
1. Set `USE_MOCK_DATA = false`
2. Ensure `/user-info` endpoint returns correct `userType`
3. Test profile updates with real backend

### Future Enhancements

#### Planned Features
- Achievement system integration
- Role-based permissions
- Advanced gamification metrics
- Profile photo upload
- Multi-language support

#### Scalability
- Easy addition of new user types
- Modular permission system
- Extensible profile fields
- Plugin architecture for custom sections