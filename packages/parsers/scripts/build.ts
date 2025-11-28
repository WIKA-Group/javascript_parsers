import type { UserConfig } from 'tsdown'
import * as fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import fg from 'fast-glob'
import JSZip from 'jszip'
import { build } from 'tsdown'

const __dirname = import.meta.dirname

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
// Discovers all devices by globbing for devices/*/index.ts files.
export async function globEntryFiles() {
  const srcRoot = path.join(__dirname, '../src')

  consola.log('Globbing in', srcRoot)
  const srcFiles = await fg(`./devices/*/index.ts`, { cwd: srcRoot, absolute: true })
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
export async function createParsersZip() {
  consola.info('Creating zip')

  const zip = new JSZip()
  const srcRoot = path.join(__dirname, '..')

  // Discover all device directories by globbing for their index.ts files
  const srcFiles = await fg('src/devices/*/index.ts', { cwd: srcRoot, absolute: true })
  const dirsToProcess: string[] = []
  for (const file of srcFiles) {
    const dir = path.dirname(file)
    dirsToProcess.push(path.basename(dir))
  }
  // dedupe
  const uniqueDirs = Array.from(new Set(dirsToProcess))

  for (const dirName of uniqueDirs) {
    const dir = path.join(srcRoot, 'src/devices', dirName)

    const requiredFiles = [
      'examples.json',
      'metadata.json',
      'README.md',
      'uplink.schema.json',
      'driver.yaml',
    ]

    const optionalFiles = [
      'downlink.schema.json',
    ]

    // Add built index.js from dist
    const distFilePath = path.join(__dirname, '..', 'dist', dirName, 'index.js')
    if (fs.existsSync(distFilePath)) {
      const content = fs.readFileSync(distFilePath)
      zip.folder(`${dirName}`)?.file('index.js', content)
      consola.success(`Added ${dirName}/index.js to zip`)
    }
    else {
      consola.error(`Missing built file: ${dirName}/index.js`)
      throw new Error(`Required built file not found: ${distFilePath}`)
    }

    for (const relatedFile of requiredFiles) {
      const filePath = path.join(dir, relatedFile)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath)
        zip.folder(`${dirName}`)?.file(relatedFile, content)
        consola.success(`Added ${dirName}/${relatedFile} to zip`)
      }
      else {
        consola.error(`Missing required file: ${dirName}/${relatedFile}`)
        throw new Error(`Required file not found: ${filePath}`)
      }
    }

    for (const optionalFile of optionalFiles) {
      const filePath = path.join(dir, optionalFile)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath)
        zip.folder(`${dirName}`)?.file(optionalFile, content)
        consola.success(`Added ${dirName}/${optionalFile} to zip`)
      }
      else {
        consola.info(`Optional file not present: ${dirName}/${optionalFile}`)
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
        consola.warn(`No JSDOC.md for ${deviceDir}, skipping doc append`)
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
  // 0. clear dist
  cleanDist('dist')

  // 1. glob all entry files
  const entries = await globEntryFiles()
  if (entries.length === 0) {
    consola.warn('No entry files found; nothing to build')
    return
  }

  consola.log(`Found ${entries.length} device(s) to build`)

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

main()
