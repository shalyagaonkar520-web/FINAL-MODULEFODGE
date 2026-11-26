import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  X,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTeamStore } from '../store/useTeamStore';
import { Task, TaskEmailResult, TaskPriority, TaskStatus, Team } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Split pasted text ("a@x.com, b@y.com\nc@z.com") into unique lowercase emails. */
function parseEmails(text: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of text.split(/[\s,;]+/).map((t) => t.trim().toLowerCase()).filter(Boolean)) {
    if (EMAIL_RE.test(token)) {
      if (!valid.includes(token)) valid.push(token);
    } else if (!invalid.includes(token)) {
      invalid.push(token);
    }
  }
  return { valid, invalid };
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  high: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

function deadlineInfo(task: Task): { label: string; tone: 'none' | 'ok' | 'soon' | 'overdue' | 'done' } {
  if (!task.deadline) return { label: 'No deadline', tone: 'none' };
  const when = new Date(task.deadline);
  const text = when.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  if (task.status === 'done') return { label: text, tone: 'done' };
  const ms = when.getTime() - Date.now();
  if (ms < 0) return { label: `Overdue · ${text}`, tone: 'overdue' };
  if (ms < 24 * 3600 * 1000) return { label: `Due soon · ${text}`, tone: 'soon' };
  return { label: text, tone: 'ok' };
}

const TONE_STYLE = {
  none: 'text-neutral-500',
  ok: 'text-neutral-300',
  soon: 'text-amber-300',
  overdue: 'text-rose-400',
  done: 'text-emerald-400',
};

const inputCls =
  'w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/60';
const btnPrimary =
  'px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50';
const btnGhost =
  'px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold border border-neutral-800 transition';

// ── Task card ────────────────────────────────────────────────────────────────
const TaskCard: React.FC<{
  task: Task;
  onStatus: (s: TaskStatus) => void;
  onDelete?: () => void;
  showTeam?: boolean;
}> = ({ task, onStatus, onDelete, showTeam }) => {
  const dl = deadlineInfo(task);
  return (
    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-neutral-500' : 'text-white'}`}>{task.title}</h4>
        <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${PRIORITY_STYLE[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {showTeam && task.team && <div className="text-[11px] font-mono text-amber-400/80">{task.team.name}</div>}
      {task.description && <p className="text-xs text-neutral-400 whitespace-pre-wrap line-clamp-3">{task.description}</p>}

      <div className={`flex items-center gap-1.5 text-[11px] font-mono ${TONE_STYLE[dl.tone]}`}>
        {dl.tone === 'overdue' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        <span>{dl.label}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {task.assignees.map((a) => (
          <span key={a.id} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
            {a.email}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <select
          value={task.status}
          onChange={(e) => onStatus(e.target.value as TaskStatus)}
          className="bg-black border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-amber-500/60"
        >
          {COLUMNS.map((c) => (
            <option key={c.status} value={c.status}>
              {c.label}
            </option>
          ))}
        </select>
        {onDelete && (
          <button onClick={onDelete} className="p-1.5 text-neutral-500 hover:text-rose-400 transition" title="Delete task">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Modal shell ──────────────────────────────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-neutral-950 border border-amber-500/25 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────
export const TeamsPage: React.FC = () => {
  const { user } = useAuthStore();
  const myEmail = (user?.email || '').toLowerCase();
  const myName = user?.name || myEmail.split('@')[0];

  const { teams, myTasks, isLoading, error, fetchTeams, fetchMyTasks, createTeam, deleteTeam, addMembers, removeMember, createTask, updateTaskStatus, deleteTask } =
    useTeamStore();

  const [tab, setTab] = useState<'teams' | 'mine'>('teams');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // create-team modal
  const [teamModal, setTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamEmails, setTeamEmails] = useState('');

  // add-members box
  const [addEmails, setAddEmails] = useState('');

  // task modal
  const [taskModal, setTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [wholeTeam, setWholeTeam] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailResult, setEmailResult] = useState<{ result: TaskEmailResult; title: string } | null>(null);

  useEffect(() => {
    if (!myEmail) return;
    fetchTeams(myEmail);
    fetchMyTasks(myEmail);
  }, [myEmail, fetchTeams, fetchMyTasks]);

  const selected: Team | undefined = useMemo(
    () => teams.find((t) => t.id === selectedId) ?? teams[0],
    [teams, selectedId]
  );
  const isOwner = !!selected && selected.ownerEmail === myEmail;
  const parsedTeamEmails = useMemo(() => parseEmails(teamEmails), [teamEmails]);
  const parsedAddEmails = useMemo(() => parseEmails(addEmails), [addEmails]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setFormError(null);
    try {
      await fn();
    } catch (e: any) {
      setFormError(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTeamEmails.invalid.length) return setFormError(`Fix invalid email(s): ${parsedTeamEmails.invalid.join(', ')}`);
    run(async () => {
      const team = await createTeam({
        name: teamName,
        description: teamDesc,
        ownerEmail: myEmail,
        ownerName: myName,
        members: parsedTeamEmails.valid.map((email) => ({ email })),
      });
      setSelectedId(team.id);
      setTab('teams');
      setTeamModal(false);
      setTeamName('');
      setTeamDesc('');
      setTeamEmails('');
    });
  };

  const handleAddMembers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !parsedAddEmails.valid.length) return;
    if (parsedAddEmails.invalid.length) return setFormError(`Fix invalid email(s): ${parsedAddEmails.invalid.join(', ')}`);
    run(async () => {
      await addMembers(selected.id, parsedAddEmails.valid.map((email) => ({ email })));
      setAddEmails('');
    });
  };

  const openTaskModal = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskDeadline('');
    setWholeTeam(true);
    setPicked([]);
    setFormError(null);
    setTaskModal(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!wholeTeam && picked.length === 0) return setFormError('Pick at least one member, or choose "Whole team".');
    run(async () => {
      const result = await createTask(selected.id, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        deadline: taskDeadline ? new Date(taskDeadline).toISOString() : undefined,
        assigneeEmails: wholeTeam ? [] : picked,
        createdBy: myName,
        createdByEmail: myEmail,
      });
      fetchMyTasks(myEmail);
      setTaskModal(false);
      if (result) setEmailResult({ result, title: taskTitle });
    });
  };

  const togglePicked = (email: string) =>
    setPicked((p) => (p.includes(email) ? p.filter((x) => x !== email) : [...p, email]));

  const tabBtn = (id: 'teams' | 'mine', label: string, count?: number) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
        tab === id ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'text-neutral-400 border-transparent hover:text-amber-200 hover:bg-neutral-900'
      }`}
    >
      {label}
      {count !== undefined && <span className="ml-2 text-[11px] font-mono text-neutral-500">{count}</span>}
    </button>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Teams &amp; Tasks</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Create a group, add members by Gmail, and assign work with a deadline.</p>
        </div>
        <button
          className={btnPrimary}
          onClick={() => {
            setFormError(null);
            setTeamModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Team</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {tabBtn('teams', 'Teams', teams.length)}
        {tabBtn('mine', 'My Tasks', myTasks.filter((t) => t.status !== 'done').length)}
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">{error}</div>}

      {/* ── MY TASKS ─────────────────────────────────────────────────────── */}
      {tab === 'mine' &&
        (myTasks.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-neutral-800 text-center text-neutral-500 text-sm">
            <ClipboardList className="w-8 h-8 mx-auto mb-3 text-neutral-600" />
            No tasks are assigned to you yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.status} className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400/70">
                  {col.label} · {myTasks.filter((t) => t.status === col.status).length}
                </div>
                {myTasks
                  .filter((t) => t.status === col.status)
                  .map((t) => (
                    <TaskCard key={t.id} task={t} showTeam onStatus={(s) => updateTaskStatus(t.id, s)} />
                  ))}
              </div>
            ))}
          </div>
        ))}

      {/* ── TEAMS ────────────────────────────────────────────────────────── */}
      {tab === 'teams' &&
        (isLoading && teams.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-neutral-800 text-center space-y-3">
            <Users className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-neutral-400 text-sm">You are not in any team yet.</p>
            <button className={`${btnPrimary} mx-auto`} onClick={() => setTeamModal(true)}>
              <Plus className="w-4 h-4" />
              <span>Create your first team</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
            {/* team list */}
            <div className="space-y-2">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    selected?.id === t.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-sm font-bold text-white truncate">{t.name}</div>
                  <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                    {t.members.length} members · {t.tasks.filter((x) => x.status !== 'done').length} open tasks
                  </div>
                </button>
              ))}
            </div>

            {/* team detail */}
            {selected && (
              <div className="space-y-5 min-w-0">
                <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/20 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-white">{selected.name}</h2>
                      {selected.description && <p className="text-sm text-neutral-400 mt-1">{selected.description}</p>}
                      <p className="text-[11px] font-mono text-neutral-500 mt-1">Owner: {selected.ownerName || selected.ownerEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className={btnPrimary} onClick={openTaskModal}>
                        <Plus className="w-4 h-4" />
                        <span>Assign Task</span>
                      </button>
                      {isOwner && (
                        <button
                          className="p-2.5 rounded-xl bg-neutral-900 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition"
                          title="Delete team"
                          onClick={() => {
                            if (confirm(`Delete team "${selected.name}" and all of its tasks?`)) {
                              run(async () => {
                                await deleteTeam(selected.id, myEmail);
                                setSelectedId(null);
                                fetchMyTasks(myEmail);
                              });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* members */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400/70">Members ({selected.members.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {selected.members.map((m) => (
                        <span key={m.id} className="group px-3 py-1.5 rounded-xl bg-black border border-neutral-800 flex items-center gap-2 text-xs text-neutral-200">
                          <span className="w-5 h-5 rounded-full bg-amber-600 text-black font-bold flex items-center justify-center text-[10px]">
                            {m.email.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-mono">{m.email}</span>
                          {m.email === selected.ownerEmail ? (
                            <span className="text-[9px] font-mono font-bold text-amber-300">OWNER</span>
                          ) : (
                            isOwner && (
                              <button
                                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 transition"
                                title="Remove member"
                                onClick={() => run(() => removeMember(selected.id, m.id))}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </span>
                      ))}
                    </div>

                    <form onSubmit={handleAddMembers} className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        value={addEmails}
                        onChange={(e) => setAddEmails(e.target.value)}
                        placeholder="Add members: paste Gmail addresses (comma or space separated)"
                        className={inputCls}
                      />
                      <button type="submit" disabled={busy || !parsedAddEmails.valid.length} className={`${btnGhost} shrink-0 flex items-center gap-2 disabled:opacity-50`}>
                        <UserPlus className="w-4 h-4" />
                        <span>Add {parsedAddEmails.valid.length || ''}</span>
                      </button>
                    </form>
                    {formError && !teamModal && !taskModal && <div className="text-xs text-rose-400 font-mono">{formError}</div>}
                  </div>
                </div>

                {/* kanban */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {COLUMNS.map((col) => {
                    const items = selected.tasks.filter((t) => t.status === col.status);
                    return (
                      <div key={col.status} className="space-y-3">
                        <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400/70">
                          {col.label} · {items.length}
                        </div>
                        {items.length === 0 && <div className="p-4 rounded-xl border border-dashed border-neutral-800 text-center text-[11px] text-neutral-600">Nothing here</div>}
                        {items.map((t) => (
                          <TaskCard
                            key={t.id}
                            task={t}
                            onStatus={(s) => updateTaskStatus(t.id, s).then(() => fetchMyTasks(myEmail))}
                            onDelete={() => confirm(`Delete task "${t.title}"?`) && deleteTask(t.id)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

      {/* ── Create team modal ─────────────────────────────────────────────── */}
      {teamModal && (
        <Modal title="Create a Team" onClose={() => setTeamModal(false)}>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Team name</label>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputCls} placeholder="e.g. Frontend Squad" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Description (optional)</label>
              <input value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} className={inputCls} placeholder="What is this team working on?" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Member Gmail addresses</label>
              <textarea
                value={teamEmails}
                onChange={(e) => setTeamEmails(e.target.value)}
                rows={5}
                className={`${inputCls} font-mono text-xs`}
                placeholder={'alice@gmail.com\nbob@gmail.com, carol@gmail.com'}
              />
              <p className="text-[11px] text-neutral-500">
                Add as many as you need — one per line, or separated by commas/spaces. You are added automatically.
              </p>
              {(parsedTeamEmails.valid.length > 0 || parsedTeamEmails.invalid.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedTeamEmails.valid.map((e) => (
                    <span key={e} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                      {e}
                    </span>
                  ))}
                  {parsedTeamEmails.invalid.map((e) => (
                    <span key={e} className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono" title="Not a valid email">
                      {e} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>
            {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">{formError}</div>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className={btnGhost} onClick={() => setTeamModal(false)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                <span>Create Team ({parsedTeamEmails.valid.length + 1})</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Assign task modal ─────────────────────────────────────────────── */}
      {taskModal && selected && (
        <Modal title={`Assign Task · ${selected.name}`} onClose={() => setTaskModal(false)}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Task</label>
              <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className={inputCls} placeholder="What needs to be done?" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Details (optional)</label>
              <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Deadline
                </label>
                <input type="datetime-local" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Priority</label>
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as TaskPriority)} className={inputCls}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Assign to</label>
              <label className="flex items-center gap-2 text-sm text-neutral-200 cursor-pointer">
                <input type="checkbox" checked={wholeTeam} onChange={(e) => setWholeTeam(e.target.checked)} className="accent-amber-500" />
                <span>Whole team ({selected.members.length})</span>
              </label>
              {!wholeTeam && (
                <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-xl bg-black border border-neutral-800">
                  {selected.members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-neutral-300 font-mono cursor-pointer py-0.5">
                      <input type="checkbox" checked={picked.includes(m.email)} onChange={() => togglePicked(m.email)} className="accent-amber-500" />
                      <span>{m.email}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Assignees are notified by email.
              </p>
            </div>

            {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">{formError}</div>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className={btnGhost} onClick={() => setTaskModal(false)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Assign Task</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Email result ──────────────────────────────────────────────────── */}
      {emailResult && (
        <Modal title="Task assigned" onClose={() => setEmailResult(null)}>
          <div className="space-y-3 text-sm text-neutral-300">
            <p>
              <strong className="text-white">"{emailResult.title}"</strong> was created and saved for the assignees.
            </p>
            {emailResult.result.delivered ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">✓ Email notification sent to the assignees.</div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <p>
                  {emailResult.result.error
                    ? `Email could not be sent (${emailResult.result.error}).`
                    : 'The server has no Gmail/SMTP credentials, so no real email was sent.'}{' '}
                  The assignees will still see the task under <strong>My Tasks</strong> when they sign in with that email.
                </p>
                {emailResult.result.gmailComposeUrl && (
                  <a href={emailResult.result.gmailComposeUrl} target="_blank" rel="noreferrer" className={`${btnPrimary} w-fit`}>
                    <Mail className="w-4 h-4" />
                    <span>Send it myself from Gmail</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <button className={btnGhost} onClick={() => setEmailResult(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
