import { create } from 'zustand';
import { Team, Task, TaskStatus, TaskPriority, TaskEmailResult } from '../types';

const API = '/api/teams';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string; // ISO string
  assigneeEmails: string[]; // empty = whole team
  createdBy: string;
  createdByEmail: string;
}

interface TeamState {
  teams: Team[];
  myTasks: Task[];
  isLoading: boolean;
  error: string | null;

  fetchTeams: (email: string) => Promise<void>;
  fetchMyTasks: (email: string) => Promise<void>;
  createTeam: (input: {
    name: string;
    description?: string;
    ownerEmail: string;
    ownerName?: string;
    members: { email: string; name?: string }[];
  }) => Promise<Team>;
  deleteTeam: (teamId: string, email: string) => Promise<void>;
  addMembers: (teamId: string, members: { email: string; name?: string }[]) => Promise<void>;
  removeMember: (teamId: string, memberId: string) => Promise<void>;
  createTask: (teamId: string, input: NewTaskInput) => Promise<TaskEmailResult | null>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => {
  const replaceTeam = (team: Team) =>
    set((s) => ({ teams: s.teams.some((t) => t.id === team.id) ? s.teams.map((t) => (t.id === team.id ? team : t)) : [team, ...s.teams] }));

  const refreshTeam = async (teamId: string) => replaceTeam(await request<Team>(`${API}/${teamId}`));

  return {
    teams: [],
    myTasks: [],
    isLoading: false,
    error: null,

    fetchTeams: async (email) => {
      set({ isLoading: true, error: null });
      try {
        const teams = await request<Team[]>(`${API}?email=${encodeURIComponent(email)}`);
        set({ teams, isLoading: false });
      } catch (e: any) {
        set({ error: e.message, isLoading: false });
      }
    },

    fetchMyTasks: async (email) => {
      try {
        const myTasks = await request<Task[]>(`${API}/tasks/mine?email=${encodeURIComponent(email)}`);
        set({ myTasks });
      } catch (e: any) {
        set({ error: e.message });
      }
    },

    createTeam: async (input) => {
      const team = await request<Team>(API, { method: 'POST', body: JSON.stringify(input) });
      replaceTeam(team);
      return team;
    },

    deleteTeam: async (teamId, email) => {
      await request(`${API}/${teamId}?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      set((s) => ({ teams: s.teams.filter((t) => t.id !== teamId) }));
    },

    addMembers: async (teamId, members) => {
      const team = await request<Team>(`${API}/${teamId}/members`, { method: 'POST', body: JSON.stringify({ members }) });
      replaceTeam(team);
    },

    removeMember: async (teamId, memberId) => {
      await request(`${API}/${teamId}/members/${memberId}`, { method: 'DELETE' });
      await refreshTeam(teamId);
    },

    createTask: async (teamId, input) => {
      const res = await request<{ task: Task; email: TaskEmailResult | null }>(`${API}/${teamId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await refreshTeam(teamId);
      return res.email;
    },

    updateTaskStatus: async (taskId, status) => {
      // optimistic update, rolled back by refetch if the call fails
      const prevTeams = get().teams;
      const prevMine = get().myTasks;
      const apply = (t: Task): Task => (t.id === taskId ? { ...t, status } : t);
      set((s) => ({
        teams: s.teams.map((tm) => ({ ...tm, tasks: tm.tasks.map(apply) })),
        myTasks: s.myTasks.map(apply),
      }));
      try {
        await request(`${API}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      } catch (e: any) {
        set({ teams: prevTeams, myTasks: prevMine, error: e.message });
      }
    },

    deleteTask: async (taskId) => {
      await request(`${API}/tasks/${taskId}`, { method: 'DELETE' });
      set((s) => ({
        teams: s.teams.map((tm) => ({ ...tm, tasks: tm.tasks.filter((t) => t.id !== taskId) })),
        myTasks: s.myTasks.filter((t) => t.id !== taskId),
      }));
    },
  };
});
