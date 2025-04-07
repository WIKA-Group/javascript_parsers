import * as fs from 'node:fs'
import path from 'node:path'
import consola, {} from 'consola'
import fg from 'fast-glob'
import JSZip from 'jszip'
import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'raw parsers',

  entryPoints: {
    'NETRIS2/index': 'src/NETRIS2/index.ts',
  },

  outDir: 'dist',

  outExtension: () => ({
    js: '.js',
  }),
  target: 'es5',
  minify: 'terser',
  clean: true,

  format: ['esm'],
  dts: false,
  noExternal: [/(.*)/],
  splitting: false,
  treeshake: true,
  // keep the top level functions exported
  terserOptions: {
    mangle: {
      toplevel: false,
      reserved: ['decodeUplink', 'encodeDownlink', 'adjustRoundingDecimals'],
    },
  },
  onSuccess: async () => {
    const files = await fg.glob('./dist/**/index.js', {
      cwd: __dirname,
      absolute: true,
    })

    // as magicast currently does not see exported functions
    // exports need to be striped from the files
    // if the file is minified it is the last part until exports
    // if it is not minified it is the the last line

    // so anyway we need to delete everything from the bottom up to "export"
    // and then delete the export line

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      // go from the back and search until export
      const index = content.lastIndexOf('export')
      const newContent = content.slice(0, index)
      fs.writeFileSync(file, newContent)
    }

    // go through the src folder and glob all index.js files
    // relative to that there should be some of the following files:
    // - index.js
    // - examples.json
    // - metadata.json
    // - README.md
    // - uplink.json
    // - downlink.json
    // - uplink.schema.json
    // - downlink.schema.json
    // - if index.js is not present get it from ./dist/<folder>/index.js

    // add all the files to a seperate folder in the zip where the name is the directory name
    // use jszip, fast-glob as fg and fs to write the zip under parsers.zip

    consola.info('Creating zip')

    const zip = new JSZip()

    const srcFiles = await fg('src/**/index.(ts|js)')

    for (const file of srcFiles) {
      const dir = path.dirname(file)
      const dirName = path.basename(dir)

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
          const distFilePath = path.join('dist', dirName, 'index.js')
          if (fs.existsSync(distFilePath)) {
            const content = fs.readFileSync(distFilePath)
            zip.folder(`${dirName}`)?.file('index.js', content)
          }
        }
      }
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' })
    fs.writeFileSync('../../parsers.zip', zipContent)

    consola.success('Zip created')

    // now for the release of the raw parsers we need to copy the package.parsers.json to the dist folder

    const distDir = path.join(__dirname, 'dist')

    const filesToCopy: `${string}.parsers.${string}`[] = [
      'package.parsers.json',
      'README.parsers.md',
    ]

    for (const file of filesToCopy) {
      const src = path.join(__dirname, file)
      if (fs.existsSync(src)) {
        // take the name of the file but remove the ".parsers" part
        const dest = path.join(distDir, file.replace('.parsers.', '.'))
        fs.copyFileSync(src, dest)
      }
    }

    // const distDir = path.join(__dirname, 'dist')
    // fs.rmSync(distDir, { recursive: true, force: true })
  },

})
