import { getSetting, putSetting } from './storage/indexedDb';

// Keep the original partition key so existing pilot data remains available.
export const WORKSPACE_ID = 'dealership-ddrive-01';
export interface WorkspacePreferences {
  name: string;
  aiGuidance: boolean;
}
export const DEFAULT_WORKSPACE: WorkspacePreferences = {
  name: 'My photo studio',
  aiGuidance: false,
};
export async function loadWorkspace(): Promise<WorkspacePreferences> {
  const value = await getSetting<Partial<WorkspacePreferences>>('workspace:preferences');
  return {
    name:
      typeof value?.name === 'string' && value.name.trim()
        ? value.name.trim().slice(0, 60)
        : DEFAULT_WORKSPACE.name,
    aiGuidance: value?.aiGuidance === true,
  };
}
export async function saveWorkspace(value: WorkspacePreferences) {
  const name = value.name.trim();
  if (!name || name.length > 60) throw new Error('Enter a studio name of 1–60 characters.');
  await putSetting('workspace:preferences', { name, aiGuidance: value.aiGuidance === true });
}
