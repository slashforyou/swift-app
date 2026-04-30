"""
Inject onboarding milestones routes into server/index.js AND
add first_job_created trigger into endPoints/v1/createJob.js.

Routes added:
  GET   /swift-app/v1/users/me/onboarding-milestones
  POST  /swift-app/v1/users/me/onboarding-milestones
  PATCH /swift-app/v1/users/me/onboarding-milestones/:name/shown

Trigger added in createJob.js:
  After successful job INSERT → unlockMilestone(userId, companyId, 'first_job_created')
"""
import shutil
import datetime

INDEX_PATH = '/srv/www/htdocs/swiftapp/server/index.js'
CREATE_JOB_PATH = '/srv/www/htdocs/swiftapp/server/endPoints/v1/createJob.js'
ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')

# ─── 1. Backup & patch index.js ───────────────────────────────────────────────

shutil.copy2(INDEX_PATH, INDEX_PATH + '.bak_' + ts)

with open(INDEX_PATH, 'r') as f:
    content = f.read()

if 'getOnboardingMilestones' in content:
    print('Milestones routes already present in index.js, skipping')
else:
    route_anchor = '// 404 HANDLER'
    new_routes = """// 🏆 Onboarding Milestones
const { getOnboardingMilestones, unlockOnboardingMilestone, markOnboardingMilestoneShown } = require('./endPoints/v1/users/milestones');

app.get('/swift-app/v1/users/me/onboarding-milestones', require('./middleware/authenticateToken').authenticateToken, getOnboardingMilestones);

app.post('/swift-app/v1/users/me/onboarding-milestones', require('./middleware/authenticateToken').authenticateToken, unlockOnboardingMilestone);

app.patch('/swift-app/v1/users/me/onboarding-milestones/:name/shown', require('./middleware/authenticateToken').authenticateToken, markOnboardingMilestoneShown);

"""
    if route_anchor not in content:
        print('ERROR: Could not find 404 handler anchor in index.js')
        exit(1)

    content = content.replace(route_anchor, new_routes + route_anchor, 1)

    with open(INDEX_PATH, 'w') as f:
        f.write(content)

    print('OK - Milestones routes injected into index.js')
    print('Backup: ' + INDEX_PATH + '.bak_' + ts)

# ─── 2. Backup & patch createJob.js ───────────────────────────────────────────

shutil.copy2(CREATE_JOB_PATH, CREATE_JOB_PATH + '.bak_' + ts)

with open(CREATE_JOB_PATH, 'r') as f:
    cj = f.read()

if 'unlockMilestone' in cj:
    print('first_job_created trigger already present in createJob.js, skipping')
else:
    # Anchor: logJobAction call just before the final res.status(201)
    anchor = "logJobAction({ jobId, actionType: 'job_created',"
    trigger = """// 🏆 Onboarding milestone — premier job créé
    try {
      const { unlockMilestone } = require('./users/milestones');
      await unlockMilestone(req.user && req.user.id, req.user && req.user.company_id, 'first_job_created');
    } catch (e) {
      console.error('[milestone] first_job_created trigger failed:', e.message);
    }

    """

    if anchor not in cj:
        print('ERROR: Could not find logJobAction anchor in createJob.js')
        exit(1)

    cj = cj.replace(anchor, trigger + anchor, 1)

    with open(CREATE_JOB_PATH, 'w') as f:
        f.write(cj)

    print('OK - first_job_created trigger injected into createJob.js')
    print('Backup: ' + CREATE_JOB_PATH + '.bak_' + ts)

print('Done.')
