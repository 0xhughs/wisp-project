import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-skill';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSkillMarkdown, SKILL_INVOCATION, SKILL_NAME } from './skill-config.mjs';

export const name = 'wisp-skill-register';
export const inject = ['skills'];

export function apply(ctx: Context) {
  const path = join(dirname(fileURLToPath(import.meta.url)), 'skills/wisp-local-time-briefing/SKILL.md');
  const parsed = parseSkillMarkdown(readFileSync(path, 'utf8'));
  if (parsed.name !== SKILL_NAME) throw Error('WISP_SKILL_REGISTER');
  ctx.skills.register({
    name: parsed.name,
    description: parsed.description,
    content: parsed.content,
    source: 'bundled',
    invocation: { modelInvocable: SKILL_INVOCATION.modelInvocable, userInvocable: SKILL_INVOCATION.userInvocable },
  });
}
