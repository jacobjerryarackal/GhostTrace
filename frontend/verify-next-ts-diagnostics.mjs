import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { createTSPlugin } = require('next/dist/server/typescript');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

console.log('=== VERIFYING NEXT.JS TYPESCRIPT LANGUAGE SERVICE DIAGNOSTICS ===');

// Parse tsconfig.json
const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  projectRoot
);

const files = parsedConfig.fileNames;

// Create Language Service Host
const serviceHost = {
  getScriptFileNames: () => files,
  getScriptVersion: () => '1',
  getScriptSnapshot: (fileName) => {
    if (!fs.existsSync(fileName)) return undefined;
    return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf8'));
  },
  getCurrentDirectory: () => projectRoot,
  getCompilationSettings: () => parsedConfig.options,
  getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};

// Create raw Language Service
const rawLanguageService = ts.createLanguageService(serviceHost, ts.createDocumentRegistry());

// Initialize Next.js TypeScript plugin proxy
const pluginCreateInfo = {
  languageService: rawLanguageService,
  languageServiceHost: serviceHost,
  project: {
    projectService: {
      logger: { info: () => {} },
    },
    getCurrentDirectory: () => projectRoot,
  },
  serverHost: ts.sys,
  config: {},
};

const nextPlugin = createTSPlugin({ typescript: ts });
const proxiedLanguageService = nextPlugin.create(pluginCreateInfo);

// Files to specifically audit
const targetComponents = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/components/DecisionComparisonPanel.tsx',
  'app/components/DependencyGraph.tsx',
  'app/components/GuidedDemoBar.tsx',
  'app/components/Header.tsx',
  'app/components/TimelineView.tsx',
  'app/components/AuditTrail.tsx',
  'app/components/BenchmarkModal.tsx',
  'app/components/RevokeModal.tsx',
  'app/components/IngestModal.tsx',
];

let totalDiagnosticsCount = 0;
let ts71007Count = 0;

for (const relPath of targetComponents) {
  const fullPath = path.resolve(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${relPath}`);
    continue;
  }

  const diagnostics = proxiedLanguageService.getSemanticDiagnostics(fullPath);
  const nextErrors = diagnostics.filter((d) => d.code >= 71001 && d.code <= 71011);
  const ts71007Errors = diagnostics.filter((d) => d.code === 71007);

  console.log(`\nAuditing: ${relPath}`);
  console.log(`  Total semantic diagnostics: ${diagnostics.length}`);
  console.log(`  Next.js plugin diagnostics: ${nextErrors.length}`);
  console.log(`  TS71007 (INVALID_CLIENT_ENTRY_PROP): ${ts71007Errors.length}`);

  if (diagnostics.length > 0) {
    for (const d of diagnostics) {
      const msg = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
      console.log(`   [TS${d.code}] ${msg}`);
    }
  }

  totalDiagnosticsCount += diagnostics.length;
  ts71007Count += ts71007Errors.length;
}

console.log('\n======================================================');
console.log(`DIAGNOSTIC SUMMARY ACROSS ALL TARGET COMPONENTS:`);
console.log(`Total Diagnostics: ${totalDiagnosticsCount}`);
console.log(`TS71007 Warnings: ${ts71007Count}`);
console.log('======================================================');

if (ts71007Count > 0) {
  console.error('\nFAILED: TS71007 warnings still present!');
  process.exit(1);
} else {
  console.log('\nSUCCESS: Zero TS71007 warnings detected across all components.');
  process.exit(0);
}
