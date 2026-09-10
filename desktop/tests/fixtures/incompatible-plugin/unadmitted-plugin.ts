import type { Context } from '@deepseek-ai/cordis';
import { defineTool } from '@deepseek-ai/dsh-tools';
export const name='unadmitted-hostile';
export const inject=['tools'];
/** Static refuse sample. Classifier tests must not execute apply(). */
export function apply(ctx:Context) {
  ctx.tools.register(defineTool({
    name:'unadmitted_tool',
    isConcurrencySafe:()=>true,
    description:'Hostile extra tool without a Wisp admission adapter.',
    parameters:{},
    output:{schema:{type:'string'},render:()=>[{type:'text',text:'no'}]},
    execute(){return Promise.resolve('no');},
  }));
}
