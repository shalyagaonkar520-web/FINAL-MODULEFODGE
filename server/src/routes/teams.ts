import { Router } from 'express';
import { prisma } from '../prisma';
import { emailService } from '../services/emailService';

export const teamsRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

const teamInclude = {
  members: { orderBy: { createdAt: 'asc' as const } },
  tasks: {
    orderBy: { createdAt: 'desc' as const },
    include: { assignees: true },
  },
};

function normEmail(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

function appUrl(req: any): string {
  return process.env.APP_URL || `${req.protocol}://${req.get('host')}`.replace(':5000', ':5173');
}

/** Parse a list of { email, name? } entries (or plain email strings), dropping invalid/duplicate emails. */
function parseMembers(input: unknown): { members: { email: string; name: string | null }[]; invalid: string[] } {
  const seen = new Set<string>();
  const members: { email: string; name: string | null }[] = [];
  const invalid: string[] = [];
  if (!Array.isArray(input)) return { members, invalid };
  for (const raw of input) {
    const email = normEmail(typeof raw === 'string' ? raw : raw?.email);
    if (!email) continue;
    if (!EMAIL_RE.test(email)) {
      invalid.push(email);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    const name = typeof raw === 'object' && typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : null;
    members.push({ email, name });
  }
  return { members, invalid };
}

// GET /api/teams?email=me@gmail.com — teams the user owns or belongs to
teamsRouter.get('/', async (req, res) => {
  try {
    const email = normEmail(req.query.email);
    if (!email) return res.status(400).json({ error: 'email query parameter is required' });

    const teams = await prisma.team.findMany({
      where: { OR: [{ ownerEmail: email }, { members: { some: { email } } }] },
      orderBy: { updatedAt: 'desc' },
      include: teamInclude,
    });
    res.json(teams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/tasks/mine?email=me@gmail.com — every task assigned to the user, across teams
teamsRouter.get('/tasks/mine', async (req, res) => {
  try {
    const email = normEmail(req.query.email);
    if (!email) return res.status(400).json({ error: 'email query parameter is required' });

    const tasks = await prisma.task.findMany({
      where: { assignees: { some: { email } } },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
      include: { assignees: true, team: { select: { id: true, name: true } } },
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams — create a team with its initial members
teamsRouter.post('/', async (req, res) => {
  try {
    const { name, description, ownerName } = req.body;
    const ownerEmail = normEmail(req.body.ownerEmail);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    if (!EMAIL_RE.test(ownerEmail)) {
      return res.status(400).json({ error: 'A valid owner email is required' });
    }

    const { members, invalid } = parseMembers(req.body.members);
    if (invalid.length) {
      return res.status(400).json({ error: `Invalid email address: ${invalid.join(', ')}` });
    }

    // The owner is always a member of their own team.
    const all = members.some((m) => m.email === ownerEmail)
      ? members
      : [{ email: ownerEmail, name: typeof ownerName === 'string' ? ownerName : null }, ...members];

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() || null : null,
        ownerEmail,
        ownerName: typeof ownerName === 'string' ? ownerName : null,
        members: { create: all },
      },
      include: teamInclude,
    });
    res.status(201).json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/:id
teamsRouter.get('/:id', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id }, include: teamInclude });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams/:id — owner only
teamsRouter.delete('/:id', async (req, res) => {
  try {
    const email = normEmail(req.query.email);
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.ownerEmail !== email) return res.status(403).json({ error: 'Only the team owner can delete the team' });

    await prisma.team.delete({ where: { id: team.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/:id/members — add one or more members by email
teamsRouter.post('/:id/members', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const { members, invalid } = parseMembers(req.body.members ?? [{ email: req.body.email, name: req.body.name }]);
    if (invalid.length) return res.status(400).json({ error: `Invalid email address: ${invalid.join(', ')}` });
    if (!members.length) return res.status(400).json({ error: 'At least one email is required' });

    await prisma.teamMember.createMany({
      data: members.map((m) => ({ ...m, teamId: team.id })),
      skipDuplicates: true,
    });
    await prisma.team.update({ where: { id: team.id }, data: { updatedAt: new Date() } });

    const updated = await prisma.team.findUnique({ where: { id: team.id }, include: teamInclude });
    res.status(201).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams/:id/members/:memberId
teamsRouter.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const member = await prisma.teamMember.findFirst({
      where: { id: req.params.memberId, teamId: req.params.id },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (team && member.email === team.ownerEmail) {
      return res.status(400).json({ error: 'The team owner cannot be removed' });
    }

    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { email: member.email, task: { teamId: req.params.id } } }),
      prisma.teamMember.delete({ where: { id: member.id } }),
    ]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/:id/tasks — create a task, assign it, and email the assignees
teamsRouter.post('/:id/tasks', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const { title, description, createdBy } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const priority = PRIORITIES.includes(req.body.priority) ? req.body.priority : 'medium';

    let deadline: Date | null = null;
    if (req.body.deadline) {
      deadline = new Date(req.body.deadline);
      if (isNaN(deadline.getTime())) return res.status(400).json({ error: 'Deadline is not a valid date' });
    }

    // Empty/missing assigneeEmails means "the whole team".
    const memberEmails = new Set(team.members.map((m) => m.email));
    const requested: string[] = Array.isArray(req.body.assigneeEmails)
      ? [...new Set<string>(req.body.assigneeEmails.map(normEmail).filter(Boolean))]
      : [];
    const outsiders = requested.filter((e) => !memberEmails.has(e));
    if (outsiders.length) {
      return res.status(400).json({ error: `Not team members: ${outsiders.join(', ')}` });
    }
    const assignees = requested.length ? requested : [...memberEmails];

    const task = await prisma.task.create({
      data: {
        teamId: team.id,
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() || null : null,
        priority,
        deadline,
        createdBy: typeof createdBy === 'string' ? createdBy : null,
        assignees: { create: assignees.map((email) => ({ email })) },
      },
      include: { assignees: true },
    });
    await prisma.team.update({ where: { id: team.id }, data: { updatedAt: new Date() } });

    // Notify everyone assigned (except the person who created the task).
    const creatorEmail = normEmail(req.body.createdByEmail);
    const recipients = assignees.filter((e) => e !== creatorEmail);
    let email: { delivered: boolean; previewUrl?: string; gmailComposeUrl?: string; error?: string } | null = null;
    if (recipients.length) {
      const result = await emailService.sendTaskAssignment({
        to: recipients,
        teamName: team.name,
        taskTitle: task.title,
        taskDescription: task.description,
        priority,
        deadline,
        assignedBy: typeof createdBy === 'string' && createdBy ? createdBy : team.ownerName || team.ownerEmail,
        appUrl: appUrl(req),
      });
      email = {
        delivered: result.delivered,
        previewUrl: result.previewUrl,
        gmailComposeUrl: result.gmailComposeUrl,
        error: result.error,
      };
    }

    res.status(201).json({ task, email });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/teams/tasks/:taskId — update status / details
teamsRouter.patch('/tasks/:taskId', async (req, res) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const data: any = {};
    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
      data.status = req.body.status;
      data.completedAt = req.body.status === 'done' ? new Date() : null;
    }
    if (req.body.priority !== undefined) {
      if (!PRIORITIES.includes(req.body.priority)) return res.status(400).json({ error: 'Invalid priority' });
      data.priority = req.body.priority;
    }
    if (typeof req.body.title === 'string' && req.body.title.trim()) data.title = req.body.title.trim();
    if (typeof req.body.description === 'string') data.description = req.body.description.trim() || null;
    if (req.body.deadline !== undefined) {
      if (req.body.deadline === null || req.body.deadline === '') {
        data.deadline = null;
      } else {
        const d = new Date(req.body.deadline);
        if (isNaN(d.getTime())) return res.status(400).json({ error: 'Deadline is not a valid date' });
        data.deadline = d;
      }
    }

    const task = await prisma.task.update({
      where: { id: existing.id },
      data,
      include: { assignees: true },
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/teams/tasks/:taskId
teamsRouter.delete('/tasks/:taskId', async (req, res) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    await prisma.task.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
