/**
 * Tests unitaires pour les types staff
 */
import { Contractor, Employee, InviteEmployeeData, StaffMember } from '../../src/types/staff';

describe('Staff Types', () => {
  describe('Employee Type', () => {
    it('should create a valid employee object', () => {
      const employee: Employee = {
        id: 'emp_1',
        type: 'employee',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+61 400 000 000',
        role: 'Moving Supervisor',
        team: 'Team A',
        startDate: '2023-01-01',
        status: 'active',
        tfn: '123-456-789',
        hourlyRate: 35,
        invitationStatus: 'completed',
        accountLinked: true,
      };

      expect(employee.type).toBe('employee');
      expect(employee.tfn).toBeDefined();
      expect(employee.invitationStatus).toBeDefined();
      expect(employee.accountLinked).toBeDefined();
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
        invitationStatus: 'pending',
        accountLinked: false,
      };

      expect(employeeWithoutTFN.tfn).toBeUndefined();
      expect(employeeWithoutTFN.invitationStatus).toBe('pending');
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
        abn: '12 345 678 901',
        rate: 50,
        rateType: 'hourly',
        contractStatus: 'preferred',
        isVerified: true,
        startDate: '2023-03-01',
        status: 'active',
      };

      expect(contractor.type).toBe('contractor');
      expect(contractor.abn).toBeDefined();
      expect(contractor.contractStatus).toBeDefined();
      expect(contractor.isVerified).toBeDefined();
      expect(contractor.rate).toBeGreaterThan(0);
      expect(contractor.rateType).toBeDefined();
    });

    it('should validate contractor contract statuses', () => {
      const validStatuses: Contractor['contractStatus'][] = [
        'standard',
        'preferred',
        'exclusive',
        'non-exclusive'
      ];

      validStatuses.forEach(status => {
        const contractor: Partial<Contractor> = {
          contractStatus: status
        };
        expect(contractor.contractStatus).toBe(status);
      });
    });

    it('should validate contractor rate types', () => {
      const validRateTypes: Contractor['rateType'][] = [
        'hourly',
        'project'
      ];

      validRateTypes.forEach(rateType => {
        const contractor: Partial<Contractor> = {
          rateType: rateType
        };
        expect(contractor.rateType).toBe(rateType);
      });
    });

    it('should create contractor with project rate type', () => {
      const projectContractor: Contractor = {
        id: 'con_2',
        type: 'contractor',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@contractor.com',
        phone: '+61 400 000 003',
        role: 'Packing Specialist',
        abn: '98 765 432 109',
        rate: 500,
        rateType: 'project',
        contractStatus: 'exclusive',
        isVerified: false,
        startDate: '2023-04-01',
        status: 'active',
      };

      expect(projectContractor.rateType).toBe('project');
      expect(projectContractor.contractStatus).toBe('exclusive');
      expect(projectContractor.isVerified).toBe(false);
    });
  });

  describe('InviteEmployeeData Type', () => {
    it('should create valid invitation data', () => {
      const invitationData: InviteEmployeeData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+61 400 000 000',
        role: 'Mover',
        team: 'Team A',
        hourlyRate: 30,
      };

      expect(invitationData.firstName).toBeDefined();
      expect(invitationData.lastName).toBeDefined();
      expect(invitationData.email).toContain('@');
      expect(invitationData.phone).toMatch(/^\+61/);
      expect(invitationData.hourlyRate).toBeGreaterThan(0);
    });

    it('should validate required fields', () => {
      const requiredFields: (keyof InviteEmployeeData)[] = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'team',
        'hourlyRate'
      ];

      const invitationData: InviteEmployeeData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+61 400 000 000',
        role: 'Mover',
        team: 'Team A',
        hourlyRate: 25,
      };

      requiredFields.forEach(field => {
        expect(invitationData[field]).toBeDefined();
        expect(invitationData[field]).not.toBe('');
      });
    });
  });

  describe('StaffMember Union Type', () => {
    it('should accept both employees and contractors', () => {
      const employee: Employee = {
        id: 'emp_1',
        type: 'employee',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+61 400 000 000',
        role: 'Supervisor',
        team: 'Team A',
        startDate: '2023-01-01',
        status: 'active',
        tfn: '123-456-789',
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
        role: 'Specialist',
        abn: '12 345 678 901',
        rate: 50,
        rateType: 'hourly',
        contractStatus: 'preferred',
        isVerified: true,
        startDate: '2023-03-01',
        status: 'active',
      };

      const staff: StaffMember[] = [employee, contractor];

      expect(staff).toHaveLength(2);
      expect(staff[0].type).toBe('employee');
      expect(staff[1].type).toBe('contractor');
    });

    it('should allow type discrimination', () => {
      const employee: Employee = {
        id: 'emp_1',
        type: 'employee',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+61 400 000 000',
        role: 'Supervisor',
        team: 'Team A',
        startDate: '2023-01-01',
        status: 'active',
        tfn: '123-456-789',
        hourlyRate: 35,
        invitationStatus: 'completed',
        accountLinked: true,
      };

      const staffMember: StaffMember = employee;

      if (staffMember.type === 'employee') {
        // TypeScript should recognize this as Employee
        expect(staffMember.tfn).toBeDefined();
        expect(staffMember.invitationStatus).toBeDefined();
        expect(staffMember.accountLinked).toBeDefined();
      }
    });
  });

  describe('Data Validation Scenarios', () => {
    it('should handle edge cases for employee data', () => {
      // Test avec des données limites
      const minimalEmployee: Employee = {
        id: 'emp_min',
        type: 'employee',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.co',
        phone: '+61400000000', // Numéro minimal
        role: 'Staff',
        team: 'A',
        startDate: '2023-01-01',
        status: 'active',
        tfn: undefined, // TFN optionnel
        hourlyRate: 1, // Taux minimal
        invitationStatus: 'pending',
        accountLinked: false,
      };

      expect(minimalEmployee.firstName).toHaveLength(1);
      expect(minimalEmployee.email).toContain('@');
      expect(minimalEmployee.hourlyRate).toBe(1);
    });

    it('should handle edge cases for contractor data', () => {
      const minimalContractor: Contractor = {
        id: 'con_min',
        type: 'contractor',
        firstName: 'X',
        lastName: 'Y',
        email: 'x@y.co',
        phone: '+61400000001',
        role: 'Helper',
        abn: '11111111111', // ABN minimal
        rate: 1,
        rateType: 'hourly',
        contractStatus: 'standard',
        isVerified: false,
        startDate: '2023-01-01',
        status: 'active',
      };

      expect(minimalContractor.abn).toHaveLength(11);
      expect(minimalContractor.rate).toBe(1);
      expect(minimalContractor.isVerified).toBe(false);
    });

    it('should validate Australian phone number format', () => {
      const validPhoneNumbers = [
        '+61 400 000 000',
        '+61400000000',
        '+61 412 345 678',
        '+61 423 456 789'
      ];

      validPhoneNumbers.forEach(phone => {
        const employee: Partial<Employee> = { phone };
        expect(employee.phone).toMatch(/^\+61/);
      });
    });

    it('should validate Australian ABN format', () => {
      const validABNs = [
        '12 345 678 901',
        '98 765 432 109',
        '11111111111',
        '99 999 999 999'
      ];

      validABNs.forEach(abn => {
        const contractor: Partial<Contractor> = { abn };
        expect(contractor.abn).toMatch(/^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$|^\d{11}$/);
      });
    });

    it('should validate TFN format', () => {
      const validTFNs = [
        '123-456-789',
        '987-654-321',
        '111-111-111',
        '999-999-999'
      ];

      validTFNs.forEach(tfn => {
        const employee: Partial<Employee> = { tfn };
        expect(employee.tfn).toMatch(/^\d{3}-\d{3}-\d{3}$/);
      });
    });
  });
});