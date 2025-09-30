import type { UserConfig } from 'tsdown'
import * as fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import fg from 'fast-glob'
import JSZip from 'jszip'
import { build } from 'tsdown'

const __dirname = import.meta.dirname

// Edit this array to list the device directory names you want to build.
// If empty, the script will build all devices found under src/devices.
export const TARGETS: string[] = [
  'PEW',
  'NETRIS2',
  'NETRIS1',
  'TRW',
]

// Minimal base config exported as default. This config intentionally has no entries
// because builds should be performed per-file (standalone) by using
// `makeBuildConfigFor` together with an external orchestrator script.
const baseConfig: UserConfig = {
  name: 'Parsers',

  outDir: 'dist',

  outExtensions: () => ({
    js: '.js',
  }),
  target: 'es2015',
  minify: true,

  format: ['esm'],
  dts: false,
  noExternal: [/(.*)/],

  treeshake: true,
}

// --- Helpers for external orchestration ---

// Clean the dist folder. Call this before the first build when doing
// multiple standalone builds.
export function cleanDist(outDir = 'dist') {
  const full = path.join(__dirname, outDir)
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true })
  }
}

// Return a list of source entry files for device parsers.
export async function globEntryFiles(dirNames: string[]) {
  // When this script lives in `src/scripts`, the device sources are in
  // ../devices relative to this file. Use the parent `src` as the cwd so
  // glob returns device paths like 'devices/NETRIS2/index.ts'. Return
  // absolute paths to make downstream usage simpler.
  const srcRoot = path.join(__dirname, '../src')

  if (dirNames.length === 0) {
    return []
  }

  const globPattern = dirNames.length > 1 ? `(${dirNames.join('|')})` : dirNames[0]

  consola.log('Globbing in', srcRoot)
  const srcFiles = await fg(`./devices/${globPattern}/index.ts`, { cwd: srcRoot, absolute: true })
  return srcFiles
}

// Create a tsdown config (single-entry) for the provided source file.
// The caller should run tsdown with the returned config (programmatically or
// by writing a temp config file). Each config builds a single entry so builds
// are standalone and do not share polyfills.
export function makeBuildConfigFor(srcFile: string) {
  const dir = path.dirname(srcFile)
  const dirName = path.basename(dir)

  const entryKey = `${dirName}/index`

  const cfg: UserConfig = {
    ...baseConfig,
    entry: {
      [entryKey]: srcFile,
    },
    // do not attach onSuccess here; the post-build zip must be created
    // after all standalone builds completed successfully.
  }

  return cfg
}

// Reusable function that creates the parsers.zip. This was previously in
// the tsdown `onSuccess` hook; it has been moved out so callers can invoke
// it after they have built all files (for example after Promise.all of
// separate builds).
export async function createParsersZip(selectedDirs?: string[]) {
  consola.info('Creating zip')

  const zip = new JSZip()
  const srcRoot = path.join(__dirname, '..')

  // which directories to include
  let dirsToProcess: string[] = []
  if (selectedDirs && selectedDirs.length > 0) {
    dirsToProcess = selectedDirs.map(d => d)
  }
  else {
    const srcFiles = await fg('src/devices/**/index.(ts|js)', { cwd: srcRoot, absolute: true })
    for (const rel of srcFiles) {
      const file = path.join(srcRoot, rel)
      const dir = path.dirname(file)
      dirsToProcess.push(path.basename(dir))
    }
    // dedupe
    dirsToProcess = Array.from(new Set(dirsToProcess))
  }

  for (const dirName of dirsToProcess) {
    const dir = path.join(srcRoot, 'src/devices', dirName)

    const relatedFiles = [
      'index.js',
      'examples.json',
      'metadata.json',
      'README.md',
      'uplink.json',
      'downlink.json',
      'uplink.schema.json',
      'downlink.schema.json',
      'driver.yaml',
    ]

    for (const relatedFile of relatedFiles) {
      const filePath = path.join(dir, relatedFile)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath)
        zip.folder(`${dirName}`)?.file(relatedFile, content)
      }
      else if (relatedFile === 'index.js') {
        const distFilePath = path.join(__dirname, '..', 'dist', dirName, 'index.js')
        if (fs.existsSync(distFilePath)) {
          const content = fs.readFileSync(distFilePath)
          zip.folder(`${dirName}`)?.file('index.js', content)
        }
      }
    }
  }

  const zipContent = await zip.generateAsync({ type: 'nodebuffer' })
  // write zip next to repository root (same as previous behavior)
  fs.writeFileSync(path.join(__dirname, '../../..', 'parsers.zip'), zipContent)

  consola.success('Zip created')
}

// --- Post-processing helpers -------------------------------------------------

/**
 * Convert markdown lines (already split) into a single JSDoc comment block.
 * Empty lines in markdown are preserved as a lone * line.
 */
function markdownLinesToJsDoc(mdRaw: string): string {
  const jsdoc = `/**
 * ------------------------------------------------------------
 * Device Documentation (from JSDOC.md)
 * ------------------------------------------------------------
 * 
${mdRaw.split(/\r?\n/).map(line => ` * ${line}`).join('\n')}
*/
`

  return jsdoc
}

/**
 * Remove trailing export statements ("export{") from built JS and append
 * a JSDoc comment generated from an adjacent `src/devices/<DEVICE>/JSDOC.md`.
 *
 * Process is idempotent: if the JSDoc sentinel line already exists, the file
 * will be skipped for doc appending (still removing export statements again
 * if any new ones were produced by a rebuild).
 */
function postProcessBuiltFiles() {
  const distDir = path.join(__dirname, '..', 'dist')
  const srcDevicesRoot = path.join(__dirname, '..', 'src', 'devices')

  if (!fs.existsSync(distDir)) {
    consola.warn('Dist directory does not exist, skipping post-processing')
    return
  }

  const subDirs = fs.readdirSync(distDir).filter(name => fs.statSync(path.join(distDir, name)).isDirectory())
  for (const deviceDir of subDirs) {
    const builtFile = path.join(distDir, deviceDir, 'index.js')
    if (!fs.existsSync(builtFile))
      continue

    try {
      let content = fs.readFileSync(builtFile, 'utf8')

      // 1. Remove export block if present
      const exportIndex = content.indexOf('export{')
      if (exportIndex !== -1) {
        content = content.substring(0, exportIndex)
        consola.info(`Removed export statements from ${deviceDir}/index.js`)
      }

      // 2. Skip adding docs if already appended (look for sentinel line)
      if (/Device Documentation \(from JSDOC.md\)/.test(content)) {
        fs.writeFileSync(builtFile, content, 'utf8')
        continue
      }

      // 3. Read JSDOC.md (if exists)
      const jsdocPath = path.join(srcDevicesRoot, deviceDir, 'JSDOC.md')
      if (!fs.existsSync(jsdocPath)) {
        fs.writeFileSync(builtFile, content, 'utf8')
        consola.info(`No JSDOC.md for ${deviceDir}, skipping doc append`)
        continue
      }

      const mdRaw = fs.readFileSync(jsdocPath, 'utf8')
      const jsdocBlock = markdownLinesToJsDoc(mdRaw)

      // 4. Ensure file ends with exactly two newlines before appending
      const trimmed = content.replace(/\s*$/, '')
      const appendable = `${trimmed}\n\n${jsdocBlock}`

      fs.writeFileSync(builtFile, appendable, 'utf8')
      consola.success(`Appended JSDoc to ${deviceDir}/index.js`)
    }
    catch (err) {
      consola.error(`Failed post-processing for ${deviceDir}:`, err)
    }
  }
}

// --- Orchestration: glob -> build each standalone -> Promise.all -> zip ---
export async function main() {
  try {
    // 0. clear dist
    cleanDist('dist')

    // 1. glob all entry files
    const entries = await globEntryFiles(TARGETS)
    if (entries.length === 0) {
      consola.warn('No entry files found; nothing to build')
      return
    }

    // 2. build each file standalone (map -> Promise.all)
    const builds = entries.map((src) => {
      const cfg = makeBuildConfigFor(src)
      // tsdown's `build` returns a Promise
      return build(cfg)
    })

    await Promise.all(builds)

    // Remove export statements and append device JSDoc (if present)
    postProcessBuiltFiles()

    // 3. after all succeeded, create zip
    await createParsersZip()

    consola.success('All builds completed and zip created')
  }
  catch (err) {
    consola.error('Build process failed:', err)
    throw err
  }
}

main()
