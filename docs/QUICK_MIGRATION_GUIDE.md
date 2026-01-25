# 🚀 Quick Migration Guide - Company/User Permissions

**Time to Implement:** 2-4 hours  
**Difficulty:** Medium  
**API Version:** 1.1.0

---

## ✅ What's Already Done

The core implementation is complete:

- ✅ Type definitions updated (`UserProfile`, `User`, `JobAPI`)
- ✅ Login function stores company data
- ✅ Permission utility functions created
- ✅ React hook for permissions (`useCompanyPermissions`)
- ✅ Job model updated with creator fields

---

## 🎯 What You Need to Do

### Priority 1: Essential (Must Do Today)

#### 1. Integrate Company Data into Auth Context (30 min)

**Current State:** User data is stored in SecureStore after login  
**Goal:** Make it accessible throughout the app

**Option A: Quick Integration (Recommended)**

Modify your existing auth flow to load company data:

```typescript
// In your login screen after successful login
import { getUserCompanyData } from "@/hooks/useCompanyPermissions";

const handleLogin = async () => {
  await login(email, password);

  // Load company data
  const companyData = await getUserCompanyData();

  // Store in your state management (Redux, Context, etc.)
  // OR use it directly in components via getUserCompanyData()

  navigation.navigate("Home");
};
```

**Option B: Full Context Integration**

Update your AuthContext/Provider to include company data:

```typescript
// src/context/AuthContext.tsx
import { getUserCompanyData } from "@/hooks/useCompanyPermissions";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const result = await loginAPI(email, password);

    // Get company data from storage
    const companyData = await getUserCompanyData();

    // Merge into user object
    setUser({
      ...result.user,
      ...companyData,
    });
  };

  // ... rest of context
};
```

#### 2. Update Calendar Screen Title (10 min)

```typescript
// In your Calendar screen component
import { getCompanyPermissions } from '@/hooks';
import { getUserCompanyData } from '@/hooks';

const CalendarScreen = () => {
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    getUserCompanyData().then(setCompanyData);
  }, []);

  const { calendarLabel } = getCompanyPermissions(
    companyData?.companyRole,
    companyData?.company
  );

  return (
    <View>
      <Text style={styles.title}>{calendarLabel}</Text>
      {/* Rest of calendar */}
    </View>
  );
};
```

#### 3. Hide/Disable Job Creation for Employees (15 min)

**Find your "Create Job" button and wrap it:**

```typescript
import { useCompanyPermissions } from '@/hooks';

// In your component where the Create Job button is
const { canCreateJob, getJobCreationError } = useCompanyPermissions();

// Option 1: Hide completely
{canCreateJob && (
  <Button onPress={handleCreateJob}>Create Job</Button>
)}

// Option 2: Show disabled with tooltip
<Button
  onPress={handleCreateJob}
  disabled={!canCreateJob}
  tooltip={!canCreateJob ? getJobCreationError() : undefined}
>
  Create Job
</Button>
```

---

### Priority 2: Important (This Week)

#### 4. Add Company Info to Profile Screen (20 min)

```typescript
import { getUserCompanyData } from '@/hooks';

const ProfileScreen = () => {
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    getUserCompanyData().then(setCompanyData);
  }, []);

  return (
    <View>
      {/* Existing profile fields */}

      {companyData?.company && (
        <View style={styles.companySection}>
          <Text style={styles.label}>Company</Text>
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

function getRoleBadge(role?: string) {
  const badges = {
    patron: '👑 Owner',
    cadre: '👔 Manager',
    employee: '👷 Employee'
  };
  return badges[role as keyof typeof badges] || 'User';
}
```

#### 5. Handle 403 Errors on Job Creation (15 min)

```typescript
const createJob = async (jobData: any) => {
  try {
    const response = await fetch("/swift-app/v1/job", {
      method: "POST",
      body: JSON.stringify(jobData),
    });

    if (response.status === 403) {
      const error = await response.json();
      Alert.alert("Permission Denied", error.error || "Cannot create job");
      return;
    }

    // ... handle success
  } catch (error) {
    // ... handle errors
  }
};
```

#### 6. Display Job Creator in Job Details (10 min)

```typescript
// In your Job Details screen
const JobDetailsScreen = ({ job }: { job: JobAPI }) => {
  return (
    <View>
      {/* Existing job details */}

      {job.created_by_first_name && (
        <View style={styles.creatorSection}>
          <Text style={styles.label}>Created by</Text>
          <Text style={styles.value}>
            {job.created_by_first_name} {job.created_by_last_name}
          </Text>
          {job.created_by_email && (
            <Text style={styles.email}>{job.created_by_email}</Text>
          )}
        </View>
      )}
    </View>
  );
};
```

---

### Priority 3: Nice to Have (When You Have Time)

#### 7. Add Role Badges Throughout the App

```typescript
// Create a reusable component
const RoleBadge: React.FC<{ role?: CompanyRole }> = ({ role }) => {
  if (!role) return null;

  const config = {
    patron: { label: 'Owner', color: '#FFD700', icon: '👑' },
    cadre: { label: 'Manager', color: '#4A90E2', icon: '👔' },
    employee: { label: 'Employee', color: '#50C878', icon: '👷' },
  };

  const badge = config[role];

  return (
    <View style={[styles.badge, { backgroundColor: badge.color }]}>
      <Text>{badge.icon} {badge.label}</Text>
    </View>
  );
};
```

#### 8. Conditional Navigation Items

```typescript
const NavigationMenu = () => {
  const { canCreateJob, isManager } = useCompanyPermissions();

  const items = [
    { name: 'Home', visible: true },
    { name: 'Calendar', visible: true },
    { name: 'Create Job', visible: canCreateJob },
    { name: 'Reports', visible: isManager },
    // ...
  ].filter(item => item.visible);

  return (
    <View>
      {items.map(item => (
        <MenuItem key={item.name} {...item} />
      ))}
    </View>
  );
};
```

---

## 🧪 Testing Checklist

After implementation, test these scenarios:

### As a Patron/Cadre

- [ ] Can see "Jobs de l'entreprise" in calendar
- [ ] Can see Create Job button
- [ ] Can successfully create a job
- [ ] Can see all company jobs in calendar
- [ ] Profile shows company name and role

### As an Employee

- [ ] Can see "Mes jobs assignés" in calendar
- [ ] Cannot see or click Create Job button
- [ ] If trying to create via API, gets 403 error
- [ ] Only sees assigned jobs in calendar
- [ ] Profile shows company name and role

### Job Details

- [ ] Shows "Created by" information
- [ ] Displays creator name and email

---

## 🐛 Troubleshooting

### Issue: Company data not showing

**Check:**

1. Login response includes `user` object with `company_id`, `company_role`, `company`
2. Data is being stored in SecureStore (check with React Native Debugger)
3. `getUserCompanyData()` returns the data correctly

**Fix:**

```typescript
// Test in a useEffect
useEffect(() => {
  getUserCompanyData().then((data) => {
    console.log("Company Data:", data);
  });
}, []);
```

### Issue: Permissions not working

**Check:**

1. `companyRole` value is correct (`'patron'`, `'cadre'`, or `'employee'`)
2. Case sensitivity - must be lowercase
3. Hook is being called in a React component

**Fix:**

```typescript
// Add debug logging
const permissions = useCompanyPermissions();
console.log("Permissions:", permissions);
```

### Issue: Calendar still shows all jobs for employees

**Note:** The backend automatically filters jobs by role. No frontend changes needed for the API calls. If you're seeing all jobs, check if you're using mock data instead of the API.

---

## 📞 Quick Reference

### Key Functions

```typescript
// Permission checks
import {
  canCreateJob,
  canSeeAllCompanyJobs,
  isManager,
} from "@/utils/permissions";

// React hook
import { useCompanyPermissions } from "@/hooks";

// Get stored data
import { getUserCompanyData } from "@/hooks";

// Get permissions for specific role
import { getCompanyPermissions } from "@/hooks";
```

### Key Types

```typescript
import type { CompanyRole, Company, CompanyPermissions } from "@/hooks";
import type { JobAPI } from "@/services/jobs";
```

---

## 📚 Full Documentation

For complete details, see:

- `docs/FRONTEND_COMPANY_USER_IMPLEMENTATION.md` - Full implementation guide
- `docs/COMPANY_PERMISSIONS_EXAMPLES.tsx` - Code examples
- `docs/BACKEND_PRICING_CHANGES.md` - Backend specification

---

## ✅ Done

Once you've completed Priority 1 and 2 items, your app will be fully compatible with the new API v1.1.0 company/user system.

**Estimated Total Time:**

- Priority 1: 1 hour
- Priority 2: 1 hour
- Testing: 30 minutes

**Total: ~2.5 hours**

---

**Need Help?** Check the example files or contact the backend team.

**Last Updated:** January 24, 2026
