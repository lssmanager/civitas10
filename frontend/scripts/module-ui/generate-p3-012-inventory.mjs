import { writeInventory } from '../../src/module-ui/registry/registryValidator.ts';
writeInventory(process.cwd().endsWith('/frontend') ? '..' : '.');
