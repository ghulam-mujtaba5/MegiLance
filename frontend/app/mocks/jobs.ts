// @AI-HINT: Mock Jobs API used to simulate backend behavior for posting jobs.
import { readJSON, writeJSON, remove } from './storage';
import type { CreateJobInput, CreateJobResult, JobDraft } from './types';

const STORAGE_KEY = 'client:post-job:draft';

function nowISO() {
  return new Date().toISOString();
}

function genId(prefix = 'job_') {
  return `${prefix}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function loadDraft(): JobDraft | null {
  return readJSON<JobDraft | null>(STORAGE_KEY, null);
}

export function saveDraft(partial: Partial<JobDraft>): JobDraft {
  const existing = loadDraft();
  const next: JobDraft = {
    id: existing?.id ?? genId(),
    title: existing?.title ?? '',
    category: existing?.category ?? '',
    budgetType: existing?.budgetType ?? 'Fixed',
    budget: existing?.budget ?? null,
    description: existing?.description ?? '',
    skills: existing?.skills ?? [],
    timeline: existing?.timeline ?? '',
    createdAt: existing?.createdAt ?? nowISO(),
    updatedAt: nowISO(),
    status: existing?.status ?? 'draft',
    ...partial,
  };
  writeJSON(STORAGE_KEY, next);
  return next;
}

export function clearDraft() {
  remove(STORAGE_KEY);
}

export async function submitJob(input: CreateJobInput): Promise<CreateJobResult> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 600));
  const id = genId('job_');
  // In a real app, we'd persist server-side. For now, mark draft submitted and clear.
  saveDraft({ status: 'submitted', updatedAt: nowISO() });
  clearDraft();
  return { id, message: 'Job submitted successfully (mock).' };
}
