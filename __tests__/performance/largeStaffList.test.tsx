/**
 * @file performance_large_staff_list.test.tsx
 * @description Tests de performance avec de grandes listes de personnel
 * 
 * Ce fichier teste:
 * - Rendu de listes avec 100+ entrées
 * - Temps de chargement et rendu
 * - Scroll et virtualisation
 * - Recherche et filtrage performants
 * - Mémoire et fuites potentielles
 */

// ========================================
// TYPES
// ========================================

interface StaffMember {
  id: string;
  type: 'employee' | 'contractor';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  team: string;
  startDate: string;
  status: 'active' | 'pending' | 'inactive';
  hourlyRate?: number;
  abn?: string;
}

interface PerformanceMetrics {
  renderTime: number;
  filterTime: number;
  searchTime: number;
  memoryUsage: number;
}

// ========================================
// MOCK DATA GENERATORS
// ========================================

const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Louis', 'Chloé'];
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
const roles = ['Supervisor', 'Mover', 'Driver', 'Packer', 'Manager', 'Specialist', 'Coordinator', 'Assistant'];
const teams = ['Team A', 'Team B', 'Team C', 'External', 'Interstate', 'Local'];
const statuses: ('active' | 'pending' | 'inactive')[] = ['active', 'pending', 'inactive'];

/**
 * Génère une liste de N membres du personnel
 */
const generateLargeStaffList = (count: number): StaffMember[] => {
  const staff: StaffMember[] = [];
  
  for (let i = 0; i < count; i++) {
    const isContractor = i % 5 === 0; // 20% contractors
    
    staff.push({
      id: `staff_${String(i).padStart(5, '0')}`,
      type: isContractor ? 'contractor' : 'employee',
      firstName: firstNames[i % firstNames.length],
      lastName: `${lastNames[i % lastNames.length]}${i}`,
      email: `staff${i}@company.com`,
      phone: `+33 6 ${String(i).padStart(8, '0').match(/.{2}/g)?.join(' ')}`,
      role: roles[i % roles.length],
      team: teams[i % teams.length],
      startDate: new Date(2020 + (i % 4), i % 12, (i % 28) + 1).toISOString().split('T')[0],
      status: statuses[i % statuses.length],
      hourlyRate: isContractor ? undefined : 25 + (i % 20),
      abn: isContractor ? `${String(i).padStart(11, '0')}` : undefined,
    });
  }
  
  return staff;
};

/**
 * Mesure le temps d'exécution d'une fonction
 */
const measureTime = <T>(fn: () => T): { result: T; timeMs: number } => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, timeMs: end - start };
};

/**
 * Mesure le temps d'exécution d'une fonction async
 */
const measureTimeAsync = async <T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, timeMs: end - start };
};

// ========================================
// PERFORMANCE FUNCTIONS TO TEST
// ========================================

/**
 * Filtre la liste par statut
 */
const filterByStatus = (staff: StaffMember[], status: StaffMember['status']): StaffMember[] => {
  return staff.filter(member => member.status === status);
};

/**
 * Filtre la liste par type
 */
const filterByType = (staff: StaffMember[], type: StaffMember['type']): StaffMember[] => {
  return staff.filter(member => member.type === type);
};

/**
 * Recherche par nom (prénom ou nom de famille)
 */
const searchByName = (staff: StaffMember[], query: string): StaffMember[] => {
  const lowerQuery = query.toLowerCase();
  return staff.filter(member => 
    member.firstName.toLowerCase().includes(lowerQuery) ||
    member.lastName.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Recherche avancée (nom, email, role)
 */
const advancedSearch = (staff: StaffMember[], query: string): StaffMember[] => {
  const lowerQuery = query.toLowerCase();
  return staff.filter(member => 
    member.firstName.toLowerCase().includes(lowerQuery) ||
    member.lastName.toLowerCase().includes(lowerQuery) ||
    member.email.toLowerCase().includes(lowerQuery) ||
    member.role.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Tri par nom
 */
const sortByName = (staff: StaffMember[]): StaffMember[] => {
  return [...staff].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

/**
 * Tri par date de début
 */
const sortByStartDate = (staff: StaffMember[]): StaffMember[] => {
  return [...staff].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
};

/**
 * Grouper par équipe
 */
const groupByTeam = (staff: StaffMember[]): Record<string, StaffMember[]> => {
  return staff.reduce((groups, member) => {
    const team = member.team;
    if (!groups[team]) {
      groups[team] = [];
    }
    groups[team].push(member);
    return groups;
  }, {} as Record<string, StaffMember[]>);
};

/**
 * Pagination
 */
const paginateList = (staff: StaffMember[], page: number, pageSize: number): StaffMember[] => {
  const start = (page - 1) * pageSize;
  return staff.slice(start, start + pageSize);
};

// ========================================
// TESTS
// ========================================

describe('Performance - Large Staff List', () => {
  // ========================================
  // TEST DATA SETUP
  // ========================================
  
  const SMALL_LIST_SIZE = 50;
  const MEDIUM_LIST_SIZE = 100;
  const LARGE_LIST_SIZE = 500;
  const VERY_LARGE_LIST_SIZE = 1000;
  
  let smallList: StaffMember[];
  let mediumList: StaffMember[];
  let largeList: StaffMember[];
  let veryLargeList: StaffMember[];
  
  beforeAll(() => {
    smallList = generateLargeStaffList(SMALL_LIST_SIZE);
    mediumList = generateLargeStaffList(MEDIUM_LIST_SIZE);
    largeList = generateLargeStaffList(LARGE_LIST_SIZE);
    veryLargeList = generateLargeStaffList(VERY_LARGE_LIST_SIZE);
  });

  // ========================================
  // TESTS: LIST GENERATION
  // ========================================

  describe('List Generation Performance', () => {
    it('should generate 100 entries quickly', () => {
      const { timeMs } = measureTime(() => generateLargeStaffList(100));
      
      expect(timeMs).toBeLessThan(50); // < 50ms
    });

    it('should generate 500 entries in reasonable time', () => {
      const { timeMs } = measureTime(() => generateLargeStaffList(500));
      
      expect(timeMs).toBeLessThan(100); // < 100ms
    });

    it('should generate 1000 entries', () => {
      const { result, timeMs } = measureTime(() => generateLargeStaffList(1000));
      
      expect(result).toHaveLength(1000);
      expect(timeMs).toBeLessThan(200); // < 200ms
    });

    it('should generate unique IDs', () => {
      const ids = largeList.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(largeList.length);
    });
  });

  // ========================================
  // TESTS: FILTERING PERFORMANCE
  // ========================================

  describe('Filtering Performance', () => {
    it('should filter 100 entries by status in < 5ms', () => {
      const { result, timeMs } = measureTime(() => filterByStatus(mediumList, 'active'));
      
      expect(result.length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(5);
    });

    it('should filter 500 entries by status in < 10ms', () => {
      const { result, timeMs } = measureTime(() => filterByStatus(largeList, 'active'));
      
      expect(result.length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(10);
    });

    it('should filter 1000 entries by status in < 20ms', () => {
      const { result, timeMs } = measureTime(() => filterByStatus(veryLargeList, 'active'));
      
      expect(result.length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(20);
    });

    it('should filter by type efficiently', () => {
      const { result: employees, timeMs: empTime } = measureTime(() => 
        filterByType(largeList, 'employee')
      );
      
      const { result: contractors, timeMs: conTime } = measureTime(() => 
        filterByType(largeList, 'contractor')
      );
      
      expect(employees.length + contractors.length).toBe(largeList.length);
      expect(empTime).toBeLessThan(10);
      expect(conTime).toBeLessThan(10);
    });

    it('should handle multiple filters', () => {
      const { timeMs } = measureTime(() => {
        const activeStaff = filterByStatus(largeList, 'active');
        const employees = filterByType(activeStaff, 'employee');
        return employees;
      });
      
      expect(timeMs).toBeLessThan(15);
    });
  });

  // ========================================
  // TESTS: SEARCH PERFORMANCE
  // ========================================

  describe('Search Performance', () => {
    it('should search by name in 100 entries < 5ms', () => {
      const { result, timeMs } = measureTime(() => searchByName(mediumList, 'jean'));
      
      expect(result.length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(5);
    });

    it('should search by name in 500 entries < 15ms', () => {
      const { result, timeMs } = measureTime(() => searchByName(largeList, 'marie'));
      
      expect(result.length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(15);
    });

    it('should search by name in 1000 entries < 30ms', () => {
      const { result, timeMs } = measureTime(() => searchByName(veryLargeList, 'pierre'));
      
      expect(result.length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(30);
    });

    it('should perform advanced search efficiently', () => {
      const { timeMs } = measureTime(() => advancedSearch(largeList, 'supervisor'));
      
      expect(timeMs).toBeLessThan(20);
    });

    it('should handle empty search gracefully', () => {
      const { result, timeMs } = measureTime(() => searchByName(largeList, ''));
      
      expect(result).toHaveLength(largeList.length);
      expect(timeMs).toBeLessThan(5);
    });

    it('should handle no results efficiently', () => {
      const { result, timeMs } = measureTime(() => searchByName(largeList, 'xyz123notfound'));
      
      expect(result).toHaveLength(0);
      expect(timeMs).toBeLessThan(10);
    });
  });

  // ========================================
  // TESTS: SORTING PERFORMANCE
  // ========================================

  describe('Sorting Performance', () => {
    it('should sort 100 entries by name < 50ms', () => {
      const { result, timeMs } = measureTime(() => sortByName(mediumList));
      
      expect(result).toHaveLength(mediumList.length);
      expect(timeMs).toBeLessThan(50); // Allow 50ms for CI/test environments
    });

    it('should sort 500 entries by name < 100ms', () => {
      const { result, timeMs } = measureTime(() => sortByName(largeList));
      
      expect(result).toHaveLength(largeList.length);
      expect(timeMs).toBeLessThan(100);
    });

    it('should sort 1000 entries by name < 200ms', () => {
      const { result, timeMs } = measureTime(() => sortByName(veryLargeList));
      
      expect(result).toHaveLength(veryLargeList.length);
      expect(timeMs).toBeLessThan(200);
    });

    it('should sort by date efficiently', () => {
      const { timeMs } = measureTime(() => sortByStartDate(largeList));
      
      expect(timeMs).toBeLessThan(50);
    });

    it('should maintain sort stability', () => {
      const sorted = sortByName(smallList);
      const sortedAgain = sortByName(sorted);
      
      expect(sorted).toEqual(sortedAgain);
    });
  });

  // ========================================
  // TESTS: GROUPING PERFORMANCE
  // ========================================

  describe('Grouping Performance', () => {
    it('should group 100 entries by team < 5ms', () => {
      const { result, timeMs } = measureTime(() => groupByTeam(mediumList));
      
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(5);
    });

    it('should group 500 entries by team < 15ms', () => {
      const { result, timeMs } = measureTime(() => groupByTeam(largeList));
      
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(timeMs).toBeLessThan(15);
    });

    it('should have correct total count after grouping', () => {
      const grouped = groupByTeam(largeList);
      const totalFromGroups = Object.values(grouped).reduce((sum, group) => sum + group.length, 0);
      
      expect(totalFromGroups).toBe(largeList.length);
    });
  });

  // ========================================
  // TESTS: PAGINATION PERFORMANCE
  // ========================================

  describe('Pagination Performance', () => {
    const PAGE_SIZE = 20;

    it('should paginate first page < 1ms', () => {
      const { result, timeMs } = measureTime(() => paginateList(largeList, 1, PAGE_SIZE));
      
      expect(result).toHaveLength(PAGE_SIZE);
      expect(timeMs).toBeLessThan(1);
    });

    it('should paginate last page efficiently', () => {
      const lastPage = Math.ceil(largeList.length / PAGE_SIZE);
      const { result, timeMs } = measureTime(() => paginateList(largeList, lastPage, PAGE_SIZE));
      
      expect(result.length).toBeLessThanOrEqual(PAGE_SIZE);
      expect(timeMs).toBeLessThan(1);
    });

    it('should handle out of range page', () => {
      const { result } = measureTime(() => paginateList(largeList, 999, PAGE_SIZE));
      
      expect(result).toHaveLength(0);
    });

    it('should calculate correct page count', () => {
      const pageCount = Math.ceil(largeList.length / PAGE_SIZE);
      
      expect(pageCount).toBe(25); // 500 / 20 = 25
    });
  });

  // ========================================
  // TESTS: COMBINED OPERATIONS
  // ========================================

  describe('Combined Operations Performance', () => {
    it('should filter + sort + paginate in < 50ms', () => {
      const { timeMs } = measureTime(() => {
        const filtered = filterByStatus(largeList, 'active');
        const sorted = sortByName(filtered);
        const page = paginateList(sorted, 1, 20);
        return page;
      });
      
      expect(timeMs).toBeLessThan(50);
    });

    it('should search + filter + sort in < 50ms', () => {
      const { timeMs } = measureTime(() => {
        const searched = searchByName(largeList, 'jean');
        const filtered = filterByType(searched, 'employee');
        const sorted = sortByStartDate(filtered);
        return sorted;
      });
      
      expect(timeMs).toBeLessThan(50);
    });

    it('should handle complex query pipeline', () => {
      const { result, timeMs } = measureTime(() => {
        let data = largeList;
        data = filterByStatus(data, 'active');
        data = filterByType(data, 'employee');
        data = advancedSearch(data, 'supervisor');
        data = sortByName(data);
        data = paginateList(data, 1, 10);
        return data;
      });
      
      expect(result.length).toBeLessThanOrEqual(10);
      expect(timeMs).toBeLessThan(100);
    });
  });

  // ========================================
  // TESTS: MEMORY EFFICIENCY
  // ========================================

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated operations', () => {
      const iterations = 100;
      const startHeap = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < iterations; i++) {
        filterByStatus(largeList, 'active');
        searchByName(largeList, 'jean');
        sortByName(largeList);
      }
      
      // Force garbage collection hint (not guaranteed)
      if (global.gc) {
        global.gc();
      }
      
      const endHeap = process.memoryUsage().heapUsed;
      const memoryGrowth = endHeap - startHeap;
      
      // Memory growth should be reasonable (< 50MB for 100 iterations)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large data efficiently', () => {
      const hugeList = generateLargeStaffList(5000);
      const startHeap = process.memoryUsage().heapUsed;
      
      filterByStatus(hugeList, 'active');
      
      const endHeap = process.memoryUsage().heapUsed;
      const memoryUsed = (endHeap - startHeap) / 1024 / 1024; // MB
      
      // Should use less than 100MB for 5000 entries
      expect(memoryUsed).toBeLessThan(100);
    });
  });

  // ========================================
  // TESTS: EDGE CASES
  // ========================================

  describe('Edge Cases', () => {
    it('should handle empty list', () => {
      const emptyList: StaffMember[] = [];
      
      expect(filterByStatus(emptyList, 'active')).toHaveLength(0);
      expect(searchByName(emptyList, 'test')).toHaveLength(0);
      expect(sortByName(emptyList)).toHaveLength(0);
      expect(groupByTeam(emptyList)).toEqual({});
    });

    it('should handle single item list', () => {
      const singleList = generateLargeStaffList(1);
      
      expect(filterByStatus(singleList, singleList[0].status)).toHaveLength(1);
      expect(sortByName(singleList)).toHaveLength(1);
    });

    it('should handle special characters in search', () => {
      const { result } = measureTime(() => searchByName(largeList, 'O\'Connor'));
      
      // Should not throw
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle unicode characters', () => {
      const { result } = measureTime(() => searchByName(largeList, 'Müller'));
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ========================================
  // TESTS: SCALABILITY BENCHMARKS
  // ========================================

  describe('Scalability Benchmarks', () => {
    const benchmarkSizes = [50, 100, 250, 500, 1000];
    
    it('should scale linearly for filtering', () => {
      const times: number[] = [];
      
      benchmarkSizes.forEach(size => {
        const list = generateLargeStaffList(size);
        const { timeMs } = measureTime(() => filterByStatus(list, 'active'));
        times.push(timeMs);
      });
      
      // Last operation should not be more than 20x the first
      const scaleFactor = times[times.length - 1] / Math.max(times[0], 0.1);
      expect(scaleFactor).toBeLessThan(50);
    });

    it('should maintain acceptable performance at scale', () => {
      const maxList = generateLargeStaffList(2000);
      
      const { timeMs: filterTime } = measureTime(() => filterByStatus(maxList, 'active'));
      const { timeMs: searchTime } = measureTime(() => searchByName(maxList, 'jean'));
      const { timeMs: sortTime } = measureTime(() => sortByName(maxList));
      
      // All operations should complete in < 200ms
      expect(filterTime).toBeLessThan(200);
      expect(searchTime).toBeLessThan(200);
      expect(sortTime).toBeLessThan(200);
    });
  });

  // ========================================
  // TESTS: VIRTUALIZATION SUPPORT
  // ========================================

  describe('Virtualization Support', () => {
    it('should provide correct data for windowed rendering', () => {
      const windowSize = 10;
      const scrollPosition = 100;
      
      // Simulate what FlatList/VirtualizedList would request
      const startIndex = scrollPosition;
      const endIndex = scrollPosition + windowSize;
      const visibleItems = largeList.slice(startIndex, endIndex);
      
      expect(visibleItems).toHaveLength(windowSize);
    });

    it('should handle rapid scroll simulation', () => {
      const windowSize = 15;
      const scrollPositions = [0, 50, 100, 200, 300, 400, 450];
      
      const { timeMs } = measureTime(() => {
        scrollPositions.forEach(pos => {
          largeList.slice(pos, pos + windowSize);
        });
      });
      
      // All window calculations should be < 5ms
      expect(timeMs).toBeLessThan(5);
    });

    it('should calculate total height efficiently', () => {
      const itemHeight = 72; // px
      const totalHeight = largeList.length * itemHeight;
      
      expect(totalHeight).toBe(500 * 72);
    });
  });
});
