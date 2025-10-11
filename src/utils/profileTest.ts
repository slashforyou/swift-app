// Test script for profile system
import { getMockProfile } from '../services/userMockData';
import { UserType } from '../services/user';

console.log('=== Profile System Test ===\n');

// Test Employee Profile
console.log('📋 Testing Employee Profile (TFN):');
const employeeProfile = getMockProfile('employee');
console.log(`Name: ${employeeProfile.firstName} ${employeeProfile.lastName}`);
console.log(`Type: ${employeeProfile.userType}`);
console.log(`Level: ${employeeProfile.level}`);
console.log(`XP: ${employeeProfile.experience}/${employeeProfile.experienceToNextLevel}`);
console.log(`Title: ${employeeProfile.title}`);
console.log(`Company Access: ${employeeProfile.userType === 'worker' ? '✅ Yes' : '❌ No'}`);
console.log(`Company Name: ${employeeProfile.companyName || 'N/A'}\n`);

// Test Worker Profile
console.log('🏢 Testing Worker Profile (ABN):');
const workerProfile = getMockProfile('worker');
console.log(`Name: ${workerProfile.firstName} ${workerProfile.lastName}`);
console.log(`Type: ${workerProfile.userType}`);
console.log(`Level: ${workerProfile.level}`);
console.log(`XP: ${workerProfile.experience}/${workerProfile.experienceToNextLevel}`);
console.log(`Title: ${workerProfile.title}`);
console.log(`Company Access: ${workerProfile.userType === 'worker' ? '✅ Yes' : '❌ No'}`);
console.log(`Company Name: ${workerProfile.companyName || 'N/A'}`);
console.log(`SIRET: ${workerProfile.siret}`);
console.log(`VAT: ${workerProfile.tva}\n`);

// Test Access Control
console.log('🔒 Access Control Test:');
const canEmployeeSeeCompany = employeeProfile.userType === 'worker';
const canWorkerSeeCompany = workerProfile.userType === 'worker';
console.log(`Employee can see company section: ${canEmployeeSeeCompany ? '✅' : '❌'}`);
console.log(`Worker can see company section: ${canWorkerSeeCompany ? '✅' : '❌'}\n`);

// Test Gamification
console.log('🎮 Gamification Test:');
function calculateXPPercentage(current: number, target: number): number {
  return Math.round((current / target) * 100);
}

console.log(`Employee Progress: ${calculateXPPercentage(employeeProfile.experience || 0, employeeProfile.experienceToNextLevel || 1)}%`);
console.log(`Worker Progress: ${calculateXPPercentage(workerProfile.experience || 0, workerProfile.experienceToNextLevel || 1)}%`);

console.log('\n✅ Profile system test completed successfully!');