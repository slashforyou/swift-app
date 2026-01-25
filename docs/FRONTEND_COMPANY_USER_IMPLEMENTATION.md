# 🔄 Frontend Implementation - Company/User Relationship

**Date:** 24 janvier 2026  
**API Version:** 1.1.0  
**Status:** ✅ Implemented

---

## 📋 Summary of Changes

The frontend has been updated to support the new backend company/user relationship system. Users are now linked to a **company** with a **role** that determines their permissions and job visibility in the calendar.

---

## ✅ Completed Implementation

### 1. Type System Updates

#### New Types Added

**File:** `src/services/user.ts`

```typescript
// Company roles for the new backend system
export type CompanyRole = "patron" | "cadre" | "employee";

export interface Company {
  id: number;
  name: string;
}
```

#### Updated UserProfile Interface

```typescript
export interface UserProfile {
  // ... existing fields ...

  // New company relationship fields (API v1.1.0)
  company_id?: number;
  company_role?: CompanyRole;
  company?: Company | null;
}
```

**File:** `src/hooks/useAuth.ts`

```typescript
export interface User {
  // ... existing fields ...

  // New company relationship fields (API v1.1.0)
  company_id?: number;
  company_role?: CompanyRole;
  company?: Company | null;
}
```

### 2. Authentication Updates

**File:** `src/utils/auth.ts`

The `login` function now:

- Extracts user data from the login response
- Stores company information (`company_id`, `company_role`, `company`) in SecureStore
- Returns the user object along with session tokens

```typescript
// Login response now includes:
const { sessionToken, refreshToken, success, user } = json;

// User data is stored for later use
await SecureStore.setItemAsync(
  "user_data",
  JSON.stringify({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    company_id: user.company_id,
    company_role: user.company_role,
    company: user.company,
  }),
);
```

### 3. Job Model Updates

**File:** `src/services/jobs.ts`

```typescript
export interface JobAPI {
  // ... existing fields ...

  // New fields from API v1.1.0
  code?: string; // Job code (e.g., JOB-TEST-20260124-947)
  contractor_company_id?: number; // Auto-assigned company ID
  created_by_user_id?: number; // User who created the job
  created_by_first_name?: string;
  created_by_last_name?: string;
  created_by_email?: string;
}
```

### 4. Permission System

**File:** `src/utils/permissions.ts` (NEW)

Utility functions for permission checks:

```typescript
// Check if user can create jobs
canCreateJob(companyRole?: CompanyRole): boolean

// Check if user can see all company jobs
canSeeAllCompanyJobs(companyRole?: CompanyRole): boolean

// Get appropriate calendar label
getCalendarLabel(companyRole?: CompanyRole): string

// Check if user is a manager
isManager(companyRole?: CompanyRole): boolean

// Check if user is the owner
isOwner(companyRole?: CompanyRole): boolean

// Get error message for job creation restriction
getJobCreationErrorMessage(companyRole?: CompanyRole): string
```

**File:** `src/hooks/useCompanyPermissions.ts` (NEW)

React hook for easy permission access:

```typescript
const {
  companyRole,
  company,
  canCreateJob,
  canSeeAllJobs,
  isManager,
  isOwner,
  calendarLabel,
  getJobCreationError,
} = useCompanyPermissions();
```

---

## 🎯 Usage Examples

### 1. Checking if User Can Create Jobs

```typescript
import { useCompanyPermissions } from '@/hooks/useCompanyPermissions';

const CreateJobButton = () => {
  const { canCreateJob, getJobCreationError } = useCompanyPermissions();

  if (!canCreateJob) {
    return (
      <Tooltip message={getJobCreationError()}>
        <Button disabled>Create Job</Button>
      </Tooltip>
    );
  }

  return <Button onPress={handleCreateJob}>Create Job</Button>;
};
```

### 2. Adapting Calendar Title

```typescript
import { useCompanyPermissions } from '@/hooks/useCompanyPermissions';

const CalendarScreen = () => {
  const { calendarLabel, canSeeAllJobs } = useCompanyPermissions();

  return (
    <View>
      <Text style={styles.title}>{calendarLabel}</Text>
      {canSeeAllJobs && <Text>Viewing all company jobs</Text>}
      {!canSeeAllJobs && <Text>Viewing your assigned jobs</Text>}
    </View>
  );
};
```

### 3. Displaying Company Information

```typescript
import { getUserCompanyData } from '@/hooks/useCompanyPermissions';
import { useEffect, useState } from 'react';

const ProfileScreen = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function loadUserData() {
      const data = await getUserCompanyData();
      setUserData(data);
    }
    loadUserData();
  }, []);

  if (!userData) return <Loading />;

  return (
    <View>
      <Text>Company: {userData.company?.name}</Text>
      <Text>Role: {userData.companyRole}</Text>
    </View>
  );
};
```

### 4. Displaying Job Creator Information

```typescript
const JobDetailsScreen = ({ job }: { job: JobAPI }) => {
  const hasCreatorInfo = job.created_by_first_name && job.created_by_last_name;

  return (
    <View>
      <Text>Job: {job.code}</Text>
      {hasCreatorInfo && (
        <Text>
          Created by: {job.created_by_first_name} {job.created_by_last_name}
        </Text>
      )}
    </View>
  );
};
```

---

## 🔐 Role-Based Behavior

### Role Matrix

| Role                | Can Create Jobs | Sees All Company Jobs | Calendar Label         |
| ------------------- | --------------- | --------------------- | ---------------------- |
| **patron** (Owner)  | ✅ Yes          | ✅ Yes                | "Jobs de l'entreprise" |
| **cadre** (Manager) | ✅ Yes          | ✅ Yes                | "Jobs de l'entreprise" |
| **employee**        | ❌ No           | ❌ No (only assigned) | "Mes jobs assignés"    |

### Automatic Backend Filtering

The backend automatically filters jobs based on the user's role:

- **patron/cadre**: GET `/swift-app/calendar-days` returns all company jobs
- **employee**: GET `/swift-app/calendar-days` returns only assigned jobs

No changes needed in the frontend API calls - the filtering is automatic.

---

## 📱 UI/UX Recommendations

### 1. Profile Header

```
👤 Romain Giovanni
🏢 Test Frontend (Patron)
```

### 2. Calendar Screen

- **Patron/Cadre:** Display "📅 Jobs de l'entreprise"
- **Employee:** Display "📅 Mes jobs"

### 3. Create Job Button

- **Patron/Cadre:** ✅ Visible and enabled
- **Employee:** ❌ Hidden or disabled with tooltip: "Seuls les managers peuvent créer des jobs"

### 4. Job Details

- Show "Created by" information when available
- Display: `Créé par ${first_name} ${last_name}`

---

## ⚠️ Migration Notes

### Breaking Changes

None - all new fields are optional for backward compatibility.

### Deprecated Fields

- `UserProfile.companyName` - Use `company.name` instead
- Fields remain for backward compatibility but should transition to new structure

---

## 🧪 Testing Checklist

- [ ] Login stores company data correctly
- [ ] UserProfile includes company fields after login
- [ ] Job creation blocked for employees (show error)
- [ ] Calendar shows correct jobs based on role
- [ ] Calendar label changes based on role
- [ ] Job details show creator information
- [ ] Profile displays company name and role
- [ ] Permissions helper functions work correctly

---

## 🔗 Related Files

### Modified Files

- `src/services/user.ts` - User model with company fields
- `src/hooks/useAuth.ts` - Auth hook with company fields
- `src/utils/auth.ts` - Login function storing company data
- `src/services/jobs.ts` - Job model with creator fields

### New Files

- `src/utils/permissions.ts` - Permission utility functions
- `src/hooks/useCompanyPermissions.ts` - Permission hook

---

## 📞 Support

For questions or issues related to this implementation, refer to the backend documentation:

- `docs/BACKEND_PRICING_CHANGES.md` (original specification)

---

## 🚀 Next Steps

### To Complete Full Integration:

1. **Update Navigation/Context**: Integrate company data into your auth context or state management
2. **Calendar Screen**: Apply `calendarLabel` and role-based filtering UI
3. **Job Creation Form**: Add permission checks before showing form
4. **Profile Screen**: Display company name and role
5. **Job Details Screen**: Show creator information
6. **Error Handling**: Implement 403 error handling for job creation attempts by employees

### Example Context Integration:

```typescript
// In your AuthContext or similar
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const result = await loginAPI(email, password);

    // Get stored company data
    const companyData = await getUserCompanyData();

    // Merge into user object
    setUser({
      ...result.user,
      ...companyData
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

**Last Updated:** January 24, 2026  
**Version:** 1.0.0
