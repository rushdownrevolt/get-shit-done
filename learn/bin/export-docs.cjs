#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { renderModule, renderReadme } = require('../lib/markdown-renderer.cjs');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'modules');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'docs', 'ai-curriculum');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Discover module directories (must contain module.json)
const moduleDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((entry) => {
    if (!entry.isDirectory()) return false;
    return fs.existsSync(path.join(CONTENT_DIR, entry.name, 'module.json'));
  })
  .map((entry) => entry.name);

// Load all modules, sort by order
const modules = [];

for (const dirName of moduleDirs) {
  const moduleDir = path.join(CONTENT_DIR, dirName);

  try {
    const mod = JSON.parse(fs.readFileSync(path.join(moduleDir, 'module.json'), 'utf-8'));

    // Read lessons
    const lessonsDir = path.join(moduleDir, 'lessons');
    let lessons = [];
    if (fs.existsSync(lessonsDir)) {
      const lessonFiles = fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));
      lessons = lessonFiles.map((f) =>
        JSON.parse(fs.readFileSync(path.join(lessonsDir, f), 'utf-8'))
      );
      lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
    } else {
      console.warn(`Warning: No lessons/ directory in ${dirName}, skipping.`);
      continue;
    }

    // Read project spec
    const specPath = path.join(moduleDir, 'project', 'spec.json');
    let spec = null;
    if (fs.existsSync(specPath)) {
      spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    } else {
      console.warn(`Warning: No project/spec.json in ${dirName}, skipping.`);
      continue;
    }

    // Read hints
    const hintsPath = path.join(moduleDir, 'project', 'hints.json');
    let hints = [];
    if (fs.existsSync(hintsPath)) {
      hints = JSON.parse(fs.readFileSync(hintsPath, 'utf-8'));
    }

    // Read concept map
    const conceptMapPath = path.join(moduleDir, 'concept-map.txt');
    let conceptMapText = '';
    if (fs.existsSync(conceptMapPath)) {
      conceptMapText = fs.readFileSync(conceptMapPath, 'utf-8');
    }

    modules.push({ mod, lessons, spec, hints, conceptMapText });
  } catch (err) {
    console.warn(`Warning: Error processing module ${dirName}: ${err.message}`);
  }
}

// Sort by module order
modules.sort((a, b) => (a.mod.order || 0) - (b.mod.order || 0));

// Render and write each module
for (const { mod, lessons, spec, hints, conceptMapText } of modules) {
  const markdown = renderModule(mod, lessons, spec, hints, conceptMapText);
  const outputPath = path.join(OUTPUT_DIR, `${mod.id}.md`);
  fs.writeFileSync(outputPath, markdown, 'utf-8');
}

// Generate master README
const readme = renderReadme(modules);
fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme, 'utf-8');

console.log(`Exported ${modules.length} modules + README.md to docs/ai-curriculum/`);
