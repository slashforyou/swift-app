# E2E Testing with Maestro

## Prerequisites

### 1 — Install Maestro CLI

```bash
# macOS / Linux
curl -Ls "https://get.maestro.mobile.dev" | bash

# Windows (PowerShell)
iex "& { $(irm get.maestro.mobile.dev) }"
```

### 2 — Create your credentials file

```bash
cp e2e/config/credentials.yaml.example e2e/config/credentials.yaml
# Edit credentials.yaml and fill in your test account email/password
```

> `e2e/config/credentials.yaml` is gitignored — never commit it.

---

## Running tests on a physical device (Samsung via USB)

1. Enable **Developer Options** on your Samsung device  
   _(Settings → About phone → tap Build number 7 times)_

2. Enable **USB Debugging**  
   _(Settings → Developer options → USB debugging → ON)_

3. Connect the phone via USB cable and accept the debugging prompt

4. Confirm the device is detected:

   ```bash
   adb devices
   ```

5. Open the app in Expo Go:

   ```bash
   npx expo start
   # Press 'a' to open on Android
   ```

6. Run a Maestro flow:

   ```bash
   maestro test e2e/flows/001-launch-login-calendar.yaml \
     --env EMAIL="your@email.com" \
     --env PASSWORD="YourPassword"
   ```

   Or with the credentials file:

   ```bash
   maestro test e2e/flows/001-launch-login-calendar.yaml \
     --env-file e2e/config/credentials.yaml
   ```

---

## Available flows

| File                                   | Description                                           | Status |
| -------------------------------------- | ----------------------------------------------------- | ------ |
| `001-launch-login-calendar.yaml`       | Launch → Login if needed → Navigate to Calendar       | ✅     |
| `010-registration-subscribe.yaml`      | Full Business Owner registration wizard               | 🔄     |
| `011-unsubscribe.yaml`                 | Post-registration verification (login + logout check) | 🔄     |
| `030-create-vehicle.yaml`              | Create a vehicle in the fleet, verify, delete         | ✅     |
| `040-invite-employee.yaml`             | Invite a staff member via the Business Hub            | ✅     |
| `050-job-workflow-single-company.yaml` | Full job lifecycle within a single company            | 🔄     |
| `051-job-workflow-two-companies.yaml`  | B2B job transfer between two companies                | 🔄     |
| `052-job-workflow-full-crew.yaml`      | Job lifecycle with truck + driver assignment          | 🔄     |
| `060-navigation-smoke.yaml`            | Smoke test: visit every main screen                   | ✅     |
| `080-profile-edit.yaml`                | Edit and restore profile phone number                 | ✅     |
| `080-profile-edit.yaml`                | Edit and restore profile phone number                 | ✅     |

> **Required test data in backend** — flows 050/051/052 rely on a pre-existing client:
> `E2E Client` (email: `e2e.client@test-swift.com`). Ensure it exists before running those tests.

### Sub-flows (called by main flows)

| File                                 | Description                                  |
| ------------------------------------ | -------------------------------------------- |
| `sub-flows/_go-to-home.yaml`         | State recovery → land on home-screen         |
| `sub-flows/_logout.yaml`             | Tap logout → assert connection-screen        |
| `sub-flows/_login-as-admin.yaml`     | Short alias for `_go-to-home` as admin       |
| `sub-flows/_switch-to-admin.yaml`    | Full account switch → admin                  |
| `sub-flows/_switch-to-driver.yaml`   | Full account switch → driver                 |
| `sub-flows/_switch-to-employee.yaml` | Full account switch → employee               |
| `sub-flows/_switch-to-romain.yaml`   | Full account switch → Romain (Test Frontend) |

> **Note:** `002-login-flow.yaml` is called internally by `001` and `_go-to-home` — not meant to be run standalone.

---

## Folder structure

```
e2e/
├── maestro.config.yaml          # App ID and global config
├── README.md                    # This file
├── config/
│   ├── credentials.yaml.example # Template (safe to commit)
│   └── credentials.yaml         # Your local credentials (gitignored)
└── flows/
    ├── 001-launch-login-calendar.yaml
    ├── 002-login-flow.yaml          # called by _go-to-home (not standalone)
    ├── 010-registration-subscribe.yaml
    ├── 011-unsubscribe.yaml
    ├── 030-create-vehicle.yaml
    ├── 040-invite-employee.yaml
    ├── 050-job-workflow-single-company.yaml
    ├── 051-job-workflow-two-companies.yaml
    ├── 052-job-workflow-full-crew.yaml
    ├── 060-navigation-smoke.yaml
    ├── 080-profile-edit.yaml
    └── sub-flows/
        ├── _go-to-home.yaml
        ├── _logout.yaml
        ├── _login-as-admin.yaml
        ├── _switch-to-admin.yaml
        ├── _switch-to-driver.yaml
        ├── _switch-to-employee.yaml
        └── _switch-to-romain.yaml
```

---

## GitHub Actions CI

The workflow `.github/workflows/e2e.yml` runs automatically on push to `main` / `develop`
and on every pull request targeting `main`.

**Required GitHub Secrets** (set in repo Settings → Secrets → Actions):

| Secret              | Description                |
| ------------------- | -------------------------- |
| `E2E_TEST_EMAIL`    | Test account email address |
| `E2E_TEST_PASSWORD` | Test account password      |

To trigger manually with a specific flow:  
Go to **Actions → E2E Tests (Maestro) → Run workflow** and enter the flow filename.

---

## testID naming convention

All interactive and key structural elements follow this pattern:

```
[screen]-[section?]-[element]-[type]
```

Examples:

- `login-email-input`
- `calendar-month-screen`
- `job-card-${job.id}` (dynamic)
- `home-calendar-btn`

See `docs/E2E_TESTING_PLAN.md` for the full inventory.
