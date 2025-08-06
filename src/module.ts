import { join, sep, parse } from 'node:path'
import {
  defineNuxtModule,
  createResolver,
  resolveFiles,
  addTemplate,
  updateTemplates,
  addServerImports,
  addImports,
} from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { camelCase } from 'scule'

const toCode = Symbol('toCode')
const toList = Symbol('toList')

class Procedure {
  id = 'proc' + Math.random().toString(36).slice(2)
  constructor(public file: string, public url: string) {}
  [toCode]() {
    return `createCaller<typeof ${this.id}>("${this.url}")`
  }

  [toList]() {
    return [this]
  }
}

class Router {
  [key: string]: Procedure | Router;
  [toCode](): string {
    return `{
    ${Object.entries(this)
      .map(([key, value]) => `"${camelCase(key)}": ${value[toCode]()}`)
      .join(',\n')}
    }`
  }

  [toList](): Procedure[] {
    return Object.values(this).flatMap(v => v[toList]())
  }
}

// Module options TypeScript interface definition
export interface ModuleOptions {
  enabled: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-procedures',
    configKey: 'procedures',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    enabled: true,
  },
  async setup(options, nuxt) {
    if (!options.enabled) {
      return
    }

    const { resolve } = createResolver(import.meta.url)

    addServerImports([
      {
        from: resolve('./runtime/define-procedure.ts'),
        name: 'defineProcedure',
      },
    ])

    const createCallerPath = resolve('./runtime/create-caller.ts')

    // Generate API client file
    const generatedClient = addTemplate({
      filename: 'nuxt-procedures/api-client.ts',
      getContents: () => generateClientCode(nuxt, createCallerPath),
      write: true,
    })

    // Recreate files when the defined procedures change
    nuxt.hook('builder:watch', async (event, path) => {
      if (path.includes('api')) {
        updateTemplates({
          filter: t => t.filename === generatedClient.filename,
        })
      }
    })

    const imports = [{ from: generatedClient.dst, name: 'apiClient' }]
    // addServerImports(imports); // Should we include it in the server?
    addImports(imports)
  },
})

async function buildRouterStructure(nuxt: Nuxt) {
  const procedureDirs = nuxt.options._layers.map(l =>
    // join(l.config.serverDir ?? "server", "procedures")
    join(l.config.serverDir ?? 'server', 'api'),
  )

  const router = new Router()

  for (const procDir of procedureDirs) {
    const files = await resolveFiles(procDir, '**/*.ts')
    for (const file of files) {
      const { name, dir } = parse(file)
      const namespace = dir.slice(procDir.length + 1)
      const url = namespace === '' ? `/${name}` : `/${namespace}/${name}`

      if (namespace === '') {
        router[name] = new Procedure(file, url)
      }
      else {
        const parts = namespace.split(sep)
        let subRouter = router
        for (const part of parts) {
          if (!subRouter[part] || subRouter[part] instanceof Procedure) {
            subRouter[part] = new Router()
          }
          subRouter = subRouter[part]
        }
        subRouter[name] = new Procedure(file, url)
      }
    }
  }

  return router
}

function withoutExtension(file: string) {
  return file.slice(0, -parse(file).ext.length)
}

async function generateClientCode(nuxt: Nuxt, createCallerPath: string) {
  const router = await buildRouterStructure(nuxt)
  const procedures = router[toList]()

  return `
    import { createCaller } from "${withoutExtension(createCallerPath)}";
    
    ${procedures
      .map(p => `import type ${p.id} from "${withoutExtension(p.file)}";`)
      .join('\n')}
    
    export const apiClient = ${router[toCode]()};
  `
}
