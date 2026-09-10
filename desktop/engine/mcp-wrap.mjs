/** Wrap execute on the live registered ToolDefinition. Do not replace the object. */
export function wrapMcpExecute(tool, consume) {
 if (!tool || typeof tool !== 'object' || Array.isArray(tool) || typeof tool.execute !== 'function' || typeof consume !== 'function') throw Error('WISP_MCP_WRAP');
 const original = tool.execute;
 const wrapped = function execute(args, exec) {
  consume(exec);
  return original.call(this, args, exec);
 };
 try { tool.execute = wrapped; } catch { throw Error('WISP_MCP_WRAP'); }
 if (tool.execute !== wrapped) throw Error('WISP_MCP_WRAP');
 return tool;
}

/** Same-object admission check used by seal() and Linux-supplemental analogues. */
export function mcpInventoryValid({registered, admitted}) {
 if (!Array.isArray(registered) || !Array.isArray(admitted)) throw Error('WISP_INVENTORY');
 const names = registered.map(t => t && t.name).sort().join();
 const admittedNames = admitted.map(a => a && a.tool && a.tool.name).sort().join();
 if (names !== admittedNames) throw Error('WISP_INVENTORY');
 for (const entry of admitted) {
  const live = registered.find(t => t.name === entry.tool.name);
  if (live !== entry.tool) throw Error('WISP_INVENTORY');
 }
 return true;
}

export function sealMcpInventory(state) {
 if (state.invalid) throw Error('WISP_INVENTORY');
 mcpInventoryValid(state);
 return true;
}
