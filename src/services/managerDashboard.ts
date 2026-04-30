/**
 * Manager Dashboard Service
 * Vue superviseur : jobs de l'équipe, statuts, KPIs
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

export interface ManagerTeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  active_jobs: number;
  completed_this_month: number;
  total_hours_this_month: number | null;
}

export interface ManagerJobEntry {
  id: number;
  code: string;
  title: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to_name: string | null;
  start_time: string | null;
  end_time: string | null;
  address: string | null;
  client_name: string | null;
}

export interface ManagerKPIs {
  total_jobs_today: number;
  completed_today: number;
  in_progress_today: number;
  pending_today: number;
  total_jobs_this_week: number;
  completed_this_week: number;
  team_size: number;
  active_members_today: number;
}

export interface ManagerDashboardData {
  kpis: ManagerKPIs;
  recentJobs: ManagerJobEntry[];
  team: ManagerTeamMember[];
}

export async function fetchManagerDashboard(): Promise<ManagerDashboardData> {
  // Parallel fetches : KPIs + jobs (recent) + team overview
  const [jobsRes, teamRes] = await Promise.all([
    authenticatedFetch(`${API}v1/jobs?limit=20&sort=start_time&order=desc`),
    authenticatedFetch(`${API}v1/company/members`),
  ]);

  let rawJobs: any[] = [];
  let rawTeam: any[] = [];

  if (jobsRes.ok) {
    const data = await jobsRes.json();
    rawJobs = data?.jobs ?? data?.data ?? [];
  }

  if (teamRes.ok) {
    const data = await teamRes.json();
    rawTeam = data?.members ?? data?.data ?? [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayJobs = rawJobs.filter((j: any) => (j.start_time ?? '').startsWith(today));

  const kpis: ManagerKPIs = {
    total_jobs_today: todayJobs.length,
    completed_today: todayJobs.filter((j: any) => j.status === 'completed').length,
    in_progress_today: todayJobs.filter((j: any) => j.status === 'in_progress').length,
    pending_today: todayJobs.filter((j: any) => j.status === 'pending' || j.status === 'assigned').length,
    total_jobs_this_week: rawJobs.length,
    completed_this_week: rawJobs.filter((j: any) => j.status === 'completed').length,
    team_size: rawTeam.length,
    active_members_today: rawTeam.filter((m: any) => m.active_jobs > 0).length,
  };

  const recentJobs: ManagerJobEntry[] = rawJobs.slice(0, 20).map((j: any) => ({
    id: j.id,
    code: j.code ?? `#${j.id}`,
    title: j.title ?? j.description ?? 'Job',
    status: j.status,
    assigned_to_name: j.assigned_to_name ?? j.employee_name ?? null,
    start_time: j.start_time ?? null,
    end_time: j.end_time ?? null,
    address: j.address ?? null,
    client_name: j.client_name ?? null,
  }));

  const team: ManagerTeamMember[] = rawTeam.map((m: any) => ({
    id: m.id,
    first_name: m.first_name ?? '',
    last_name: m.last_name ?? '',
    email: m.email ?? '',
    role: m.role ?? 'employee',
    active_jobs: m.active_jobs ?? 0,
    completed_this_month: m.completed_this_month ?? 0,
    total_hours_this_month: m.total_hours_this_month ?? null,
  }));

  return { kpis, recentJobs, team };
}
