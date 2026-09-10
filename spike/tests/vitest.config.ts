import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { standardDecoratorPlugin } from '../../vitest.shared.ts';
export default defineConfig({plugins:[tsconfigPaths({projects:['./tsconfig.base.json']}),standardDecoratorPlugin()],test:{include:['wisp-spike/tests/approval.spec.ts'],testTimeout:10000}});
