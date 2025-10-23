/**
 * Tests pour les types Staff
 */

import { Contractor, Employee, StaffFilters, StaffMember } from '../../src/types/staff';

describe('Staff Types', () => {
  describe('Employee Type', () => {
    it('should create a valid employee object', () => {
      const employee: Employee = {
        id: 'emp_1',
        type: 'employee',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+61 400 000 000',
        role: 'Team Lead',
        team: 'Team A',
        startDate: '2023-01-01',
        status: 'active',
        tfn: '123456789',
        hourlyRate: 35,
        invitationStatus: 'completed',
        accountLinked: true,
      };

      expect(employee.type).toBe('employee');
      expect(employee.firstName).toBe('John');
      expect(employee.tfn).toBe('123456789');
      expect(employee.hourlyRate).toBeGreaterThan(0);
    });

    it('should validate employee invitation statuses', () => {
      const validStatuses: Employee['invitationStatus'][] = [
        'sent',
        'accepted',
        'completed'
      ];

      validStatuses.forEach(status => {
        const employee: Partial<Employee> = {
          invitationStatus: status
        };
        expect(employee.invitationStatus).toBe(status);
      });
    });

    it('should validate employee with optional TFN', () => {
      const employeeWithoutTFN: Employee = {
        id: 'emp_2',
        type: 'employee',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+61 400 000 001',
        role: 'Mover',
        team: 'Team B',
        startDate: '2023-02-01',
        status: 'active',
        tfn: undefined,
        hourlyRate: 30,
        invitationStatus: 'sent',
        accountLinked: false,
      };

      expect(employeeWithoutTFN.tfn).toBeUndefined();
      expect(employeeWithoutTFN.invitationStatus).toBe('sent');
      expect(employeeWithoutTFN.accountLinked).toBe(false);
    });
  });

  describe('Contractor Type', () => {
    it('should create a valid contractor object', () => {
      const contractor: Contractor = {
        id: 'con_1',
        type: 'contractor',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@contractor.com',
        phone: '+61 400 000 002',
        role: 'Specialized Mover',
        team: 'Operations',
        abn: '12 345 678 901',
        rate: 50,
        rateType: 'hourly',
        contractStatus: 'preferred',
        isVerified: true,
        startDate: '2024-01-01',
        status: 'active',
      };

      expect(contractor.type).toBe('contractor');
      expect(contractor.abn).toBe('12 345 678 901');
      expect(contractor.rate).toBeGreaterThan(0);
      expect(contractor.rateType).toBe('hourly');
      expect(contractor.contractStatus).toBe('preferred');
      expect(contractor.isVerified).toBe(true);
    });

    it('should validate contractor with project rate type', () => {
      const projectContractor: Contractor = {
        id: 'con_2',
        type: 'contractor',
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah@contractor.com',
        phone: '+61 400 000 003',
        role: 'Project Manager',
        team: 'Management',
        abn: '98 765 432 109',
        rate: 2500,
        rateType: 'project',
        contractStatus: 'exclusive',
        isVerified: false,
        startDate: '2023-03-01',
        status: 'active',
      };

      expect(projectContractor.rateType).toBe('project');
      expect(projectContractor.contractStatus).toBe('exclusive');
      expect(projectContractor.isVerified).toBe(false);
    });

    it('should validate all contract statuses', () => {
      const validStatuses: Contractor['contractStatus'][] = [
        'exclusive',
        'non-exclusive',
        'preferred',
        'standard'
      ];

      validStatuses.forEach(status => {
        const contractor: Partial<Contractor> = {
          contractStatus: status
        };
        expect(contractor.contractStatus).toBe(status);
      });
    });

    it('should validate all rate types', () => {
      const validRateTypes: Contractor['rateType'][] = [
        'hourly',
        'fixed',
        'project'
      ];

      validRateTypes.forEach(rateType => {
        const contractor: Partial<Contractor> = {
          rateType: rateType
        };
        expect(contractor.rateType).toBe(rateType);
      });
    });
  });

  describe('StaffMember Union Type', () => {
    it('should accept both employees and contractors', () => {
      const employee: StaffMember = {
        id: 'emp_1',
        type: 'employee',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+61 400 000 000',
        role: 'Team Lead',
        team: 'Team A',
        startDate: '2023-01-01',
        status: 'active',
        tfn: '123456789',
        hourlyRate: 35,
        invitationStatus: 'completed',
        accountLinked: true,
      };

      const contractor: StaffMember = {
        id: 'con_1',
        type: 'contractor',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@contractor.com',
        phone: '+61 400 000 002',
        role: 'Specialized Mover',
        team: 'Operations',
        abn: '12 345 678 901',
        rate: 50,
        rateType: 'hourly',
        contractStatus: 'preferred',
        isVerified: true,
        startDate: '2024-01-01',
        status: 'active',
      };

      expect(employee.type).toBe('employee');
      expect(contractor.type).toBe('contractor');
    });
  });

  describe('StaffFilters Type', () => {
    it('should create valid filter objects', () => {
      const filters: StaffFilters = {
        type: 'all',
        team: 'Team A',
        status: 'active'
      };

      expect(filters.type).toBe('all');
      expect(filters.team).toBe('Team A');
      expect(filters.status).toBe('active');
    });

    it('should validate filter type options', () => {
      const validTypes: StaffFilters['type'][] = ['all', 'employee', 'contractor'];
      const validStatuses: StaffFilters['status'][] = ['all', 'active', 'inactive', 'pending'];

      validTypes.forEach(type => {
        const filter: Partial<StaffFilters> = { type };
        expect(filter.type).toBe(type);
      });

      validStatuses.forEach(status => {
        const filter: Partial<StaffFilters> = { status };
        expect(filter.status).toBe(status);
      });
    });
  });

  describe('Type Guards & Discrimination', () => {
    it('should distinguish between employee and contractor', () => {
      const employee: Employee = {
        id: 'emp_1',
        type: 'employee',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+61 400 000 000',
        role: 'Team Lead',
        team: 'Team A',
        startDate: '2023-01-01',
        status: 'active',
        tfn: '123456789',
        hourlyRate: 35,
        invitationStatus: 'completed',
        accountLinked: true,
      };

      const contractor: Contractor = {
        id: 'con_1',
        type: 'contractor',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@contractor.com',
        phone: '+61 400 000 002',
        role: 'Specialized Mover',
        team: 'Operations',
        abn: '12 345 678 901',
        rate: 50,
        rateType: 'hourly',
        contractStatus: 'preferred',
        isVerified: true,
        startDate: '2024-01-01',
        status: 'active',
      };

      // Test type discrimination
      const staffMembers: StaffMember[] = [employee, contractor];

      const employees = staffMembers.filter((member): member is Employee => member.type === 'employee');
      const contractors = staffMembers.filter((member): member is Contractor => member.type === 'contractor');

      expect(employees).toHaveLength(1);
      expect(contractors).toHaveLength(1);
      expect(employees[0]).toEqual(employee);
      expect(contractors[0]).toEqual(contractor);
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should handle empty strings and edge values', () => {
      // Test with minimum viable contractor
      const minimalContractor: Contractor = {
        id: 'con_minimal',
        type: 'contractor',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.co',
        phone: '0400000000',
        role: 'Worker',
        team: 'General',
        abn: '11111111111',
        rate: 1,
        rateType: 'hourly',
        contractStatus: 'standard',
        isVerified: false,
        startDate: '2024-01-01',
        status: 'active',
      };

      expect(minimalContractor.firstName).toBe('A');
      expect(minimalContractor.rate).toBe(1);
      expect(minimalContractor.isVerified).toBe(false);
    });

    it('should handle all status combinations', () => {
      const statuses: Array<Employee['status'] | Contractor['status']> = ['active', 'inactive', 'pending'];

      statuses.forEach(status => {
        const employee: Employee = {
          id: 'emp_test',
          type: 'employee',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '0400000000',
          role: 'Tester',
          team: 'QA',
          startDate: '2024-01-01',
          status: status,
          tfn: '123456789',
          hourlyRate: 25,
          invitationStatus: 'sent',
          accountLinked: false,
        };

        expect(employee.status).toBe(status);
      });
    });

    it('should validate complex team hierarchies', () => {
      const teamStructures = [
        'Operations',
        'Operations/Residential',
        'Operations/Commercial',
        'Operations/Storage',
        'Admin',
        'Admin/HR',
        'Admin/Finance',
        'Management'
      ];

      teamStructures.forEach(team => {
        const employee: Employee = {
          id: 'emp_team_test',
          type: 'employee',
          firstName: 'Team',
          lastName: 'Test',
          email: 'team@test.com',
          phone: '0400000000',
          role: 'Member',
          team: team,
          startDate: '2024-01-01',
          status: 'active',
          tfn: '123456789',
          hourlyRate: 30,
          invitationStatus: 'completed',
          accountLinked: true,
        };

        expect(employee.team).toBe(team);
      });
    });
  });
});