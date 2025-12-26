// Test script for profile system
import { getMockProfile } from '../services/userMockData';
import { UserType } from '../services/user';

// TEMP_DISABLED: console.log('=== Profile System Test ===\n');

// Test Employee Profile
// TEMP_DISABLED: console.log('📋 Testing Employee Profile (TFN):');
const employeeProfile = getMockProfile('employee');
// TEMP_DISABLED: console.log(`Name: ${employeeProfile.firstName} ${employeeProfile.lastName}`);
// TEMP_DISABLED: console.log(`Type: ${employeeProfile.userType}`);
// TEMP_DISABLED: console.log(`Level: ${employeeProfile.level}`);
// TEMP_DISABLED: console.log(`XP: ${employeeProfile.experience}/${employeeProfile.experienceToNextLevel}`);
// TEMP_DISABLED: console.log(`Title: ${employeeProfile.title}`);
// TEMP_DISABLED: console.log(`Company Access: ${employeeProfile.userType === 'worker' ? '✅ Yes' : '❌ No'}`);
// TEMP_DISABLED: console.log(`Company Name: ${employeeProfile.companyName || 'N/A'}\n`);

// Test Worker Profile
// TEMP_DISABLED: console.log('🏢 Testing Worker Profile (ABN):');
const workerProfile = getMockProfile('worker');
// TEMP_DISABLED: console.log(`Name: ${workerProfile.firstName} ${workerProfile.lastName}`);
// TEMP_DISABLED: console.log(`Type: ${workerProfile.userType}`);
// TEMP_DISABLED: console.log(`Level: ${workerProfile.level}`);
// TEMP_DISABLED: console.log(`XP: ${workerProfile.experience}/${workerProfile.experienceToNextLevel}`);
// TEMP_DISABLED: console.log(`Title: ${workerProfile.title}`);
// TEMP_DISABLED: console.log(`Company Access: ${workerProfile.userType === 'worker' ? '✅ Yes' : '❌ No'}`);
// TEMP_DISABLED: console.log(`Company Name: ${workerProfile.companyName || 'N/A'}`);
// TEMP_DISABLED: console.log(`SIRET: ${workerProfile.siret}`);
// TEMP_DISABLED: console.log(`VAT: ${workerProfile.tva}\n`);

// Test Access Control
// TEMP_DISABLED: console.log('🔒 Access Control Test:');
const canEmployeeSeeCompany = employeeProfile.userType === 'worker';
const canWorkerSeeCompany = workerProfile.userType === 'worker';
// TEMP_DISABLED: console.log(`Employee can see company section: ${canEmployeeSeeCompany ? '✅' : '❌'}`);
// TEMP_DISABLED: console.log(`Worker can see company section: ${canWorkerSeeCompany ? '✅' : '❌'}\n`);

// Test Gamification
// TEMP_DISABLED: console.log('🎮 Gamification Test:');
function calculateXPPercentage(current: number, target: number): number {
  return Math.round((current / target) * 100);
}

// TEMP_DISABLED: console.log(`Employee Progress: ${calculateXPPercentage(employeeProfile.experience || 0, employeeProfile.experienceToNextLevel || 1)}%`);
// TEMP_DISABLED: console.log(`Worker Progress: ${calculateXPPercentage(workerProfile.experience || 0, workerProfile.experienceToNextLevel || 1)}%`);

// TEMP_DISABLED: console.log('\n✅ Profile system test completed successfully!');