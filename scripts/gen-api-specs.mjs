/**
 * Splits static/openapi.json into per-endpoint spec files in static/api-specs/.
 * Outputs a JSON array of plugin configs to stdout for use in docusaurus.config.ts.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const spec = JSON.parse(readFileSync(resolve(root, 'static/openapi.json'), 'utf-8'));

const outDir = resolve(root, 'static/api-specs');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Collect all $ref'd schemas from an object
function collectRefs(obj, refs = new Set()) {
  if (!obj || typeof obj !== 'object') return refs;
  if (obj.$ref && typeof obj.$ref === 'string') {
    const match = obj.$ref.match(/^#\/components\/schemas\/(.+)$/);
    if (match) refs.add(match[1]);
  }
  for (const val of Object.values(obj)) {
    collectRefs(val, refs);
  }
  return refs;
}

// Recursively resolve all schema refs (schemas can reference other schemas)
function resolveAllRefs(schemaNames, allSchemas) {
  const resolved = new Set(schemaNames);
  let added = true;
  while (added) {
    added = false;
    for (const name of [...resolved]) {
      const schema = allSchemas[name];
      if (!schema) continue;
      for (const ref of collectRefs(schema)) {
        if (!resolved.has(ref)) {
          resolved.add(ref);
          added = true;
        }
      }
    }
  }
  return resolved;
}

function toSlug(operationId) {
  // InvoiceBusinessController_create -> create-invoice
  return operationId
    .replace(/Controller_/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/Business/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const endpoints = [];

for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    if (!operation || typeof operation !== 'object' || !operation.operationId) continue;

    const opId = operation.operationId;
    const slug = toSlug(opId);
    const tag = (operation.tags || ['Other'])[0];
    const summary = operation.summary || opId;

    // Build mini spec with just this endpoint (no intro section, no tag grouping)
    const strippedOp = { ...operation };
    delete strippedOp.tags;

    const miniSpec = {
      openapi: spec.openapi,
      info: { title: summary, version: '' },
      servers: spec.servers,
      security: spec.security,
      paths: {
        [path]: {
          [method]: strippedOp,
        },
      },
      components: {
        securitySchemes: spec.components?.securitySchemes || {},
        schemas: {},
      },
    };

    // Include only referenced schemas
    const refs = collectRefs(operation);
    const allRefs = resolveAllRefs(refs, spec.components?.schemas || {});
    for (const name of allRefs) {
      if (spec.components?.schemas?.[name]) {
        miniSpec.components.schemas[name] = spec.components.schemas[name];
      }
    }

    const filename = `${slug}.json`;
    writeFileSync(resolve(outDir, filename), JSON.stringify(miniSpec, null, 2));

    endpoints.push({ slug, tag, summary, method: method.toUpperCase(), path, filename });
  }
}

// Write manifest for docusaurus.config.ts to consume
writeFileSync(
  resolve(outDir, '_manifest.json'),
  JSON.stringify(endpoints, null, 2)
);

console.log(`Generated ${endpoints.length} endpoint specs in static/api-specs/`);
for (const ep of endpoints) {
  console.log(`  ${ep.method.padEnd(6)} ${ep.path.padEnd(45)} -> /api/${ep.slug}`);
}
