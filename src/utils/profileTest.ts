// Test script for profile system
import { getMockProfile } from '../services/userMockData';
import { UserType } from '../services/user';


// Test Employee Profile
const employeeProfile = getMockProfile('employee');

// Test Worker Profile
const workerProfile = getMockProfile('worker');

// Test Access Control
const canEmployeeSeeCompany = employeeProfile.userType === 'worker';
const canWorkerSeeCompany = workerProfile.userType === 'worker';

// Test Gamification
function calculateXPPercentage(current: number, target: number): number {
  return Math.round((current / target) * 100);
}


