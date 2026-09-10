/** Wrap execute on the live registered ToolDefinition. Do not replace the object. */
export function wrapSkillExecute(tool, consume) {
 if (!tool || typeof tool !== 'object' || Array.isArray(tool) || typeof tool.execute !== 'function' || typeof consume !== 'function') throw Error('WISP_SKILL_WRAP');
 const original = tool.execute;
 const wrapped = function execute(args, exec) {
  consume(exec);
  return original.call(this, args, exec);
 };
 try { tool.execute = wrapped; } catch { throw Error('WISP_SKILL_WRAP'); }
 if (tool.execute !== wrapped) throw Error('WISP_SKILL_WRAP');
 return tool;
}
