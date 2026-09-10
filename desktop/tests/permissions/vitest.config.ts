import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { standardDecoratorPlugin } from '../../../vitest.shared.ts';
export default defineConfig({plugins:[tsconfigPaths({projects:['./tsconfig.base.json']}),standardDecoratorPlugin()],test:{include:['wisp-product/tests/permissions/*.spec.ts'],testTimeout:15000}});
