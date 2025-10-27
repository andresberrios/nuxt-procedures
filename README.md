# Nuxt Procedures

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module to define and easily consume your backend API in a validated and
type-safe way using procedures and Zod schemas.

- [🏀 Online playground](https://stackblitz.com/github/andresberrios/nuxt-procedures?file=playground%2Fapp.vue)

## Features

- **Type-Safe API Layer:** End-to-end type safety for your API calls.
- **Zod Validation:** Use Zod schemas to validate inputs and outputs.
- **Automatic API Client:** An `apiClient` is automatically generated based on your procedures.
- **`useFetch` Integration:** Seamlessly integrates with Nuxt's `useFetch` for easy data fetching in your components.
- **`superjson` Support:** Automatically handles serialization of complex data types.

## Installation

### Quick Install (Recommended)

Install and configure the module with a single command:

```bash
npx nuxi module add nuxt-procedures
```

This will add `nuxt-procedures` to your `package.json` and `nuxt.config.ts`.

You also need to install its peer dependency, `zod`:

```bash
npm install zod
```

### Manual Install

1. Install the packages:

```bash
npm install nuxt-procedures zod
```

2. Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ["nuxt-procedures"],
});
```

## Usage

### 1. Define Procedures

Create `.ts` files in your `server/api` directory. The module will automatically create a corresponding client for each file.

#### Simple Example

For a simple input and output, you can use Zod schemas directly.

`server/api/hello.ts`:

```typescript
import { z } from "zod";

export default defineProcedure({
  input: z.string(),
  output: z.string(),
  handler: async ({ input }) => {
    return `Hello, ${input}!`;
  },
});
```

#### Complex Example

For more complex scenarios, `z.object` is the way to go. This is useful for things like form submissions or creating database entries.

`server/api/users/create.ts`:

```typescript
import { z } from "zod";

export default defineProcedure({
  input: z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["admin", "user"]).default("user"),
  }),
  output: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  handler: async ({ input, event }) => {
    // The event param gives you access to the request context and Nuxt utilities
    // For example, you can access request headers
    const headers = getRequestHeaders(event);
    console.log(headers);

    // In a real app, you would create a user in your database
    // The following is just an example of how you could get a db client
    const db = await useDB(event);
    const newUser = await db.user.create({
      data: input,
    });

    return newUser;
  },
});
```

### 2. Use the `apiClient`

The module automatically generates an `apiClient` that you can use in your components or pages. The structure of the `apiClient` mirrors your `server/api` directory.

#### `useCall`

The `useCall` method is a wrapper around Nuxt's `useFetch` and is the recommended way to call procedures from your Vue components.

Calling the simple `hello` procedure:

```vue
<script setup lang="ts">
const { data: greeting, pending } = await apiClient.hello.useCall("World");
</script>

<template>
  <p v-if="pending">Loading...</p>
  <p v-else>{{ greeting }}</p>
</template>
```

#### `call`

The `call` method makes a direct API call, without storing the result in the Nuxt payload as `useFetch` would.
You would normally call procedures this way when you don't need to load data for the initial render of the component, but instead when triggering them in response to a form submission or some other event, same as when you would use `$fetch`.

```typescript
// Calling the simple procedure
const greeting = await apiClient.hello.call("World");
// greeting is "Hello, World!"

// Calling the complex procedure
const newUser = await apiClient.users.create.call({
  name: "Andres",
  email: "andres@example.com",
});
// newUser is { id: '...', name: 'Andres', email: 'andres@example.com' }
```

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-procedures/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-procedures
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-procedures.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-procedures
[license-src]: https://img.shields.io/npm/l/nuxt-procedures.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-procedures
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
