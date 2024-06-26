---
title: Auth Hooks
---

import { EmailPill, UsernameAndPasswordPill, GithubPill, GooglePill, KeycloakPill, DiscordPill } from "./Pills";
import ImgWithCaption from '@site/blog/components/ImgWithCaption'

Auth hooks allow you to "hook into" the auth process at various stages and run your custom code. For example, if you want to forbid certain emails from signing up, or if you wish to send a welcome email to the user after they sign up, auth hooks are the way to go.

## Supported hooks

The following auth hooks are available in Wasp:
- [`onBeforeSignup`](#executing-code-before-the-user-signs-up)
- [`onAfterSignup`](#executing-code-after-the-user-signs-up)
- [`onBeforeOAuthRedirect`](#executing-code-before-the-oauth-redirect)

We'll go through each of these hooks in detail. But first, let's see how the hooks fit into the signup flow:

<ImgWithCaption
  source="/img/auth-hooks/signup_flow_with_hooks.png"
  alt="Signup Flow with Hooks"
  caption="Signup Flow with Hooks"
/>

If you are using OAuth, the flow includes extra steps before the signup flow:

<ImgWithCaption
  source="/img/auth-hooks/oauth_flow_with_hooks.png"
  alt="OAuth Flow with Hooks"
  caption="OAuth Flow with Hooks"
/>

## Using hooks

To use auth hooks, you must first declare them in the Wasp file:

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```wasp
app myApp {
  wasp: {
    version: "^0.13.0"
  },
  auth: {
    userEntity: User,
    methods: {
      ...
    },
    onBeforeSignup: import { onBeforeSignup } from "@src/auth/hooks",
    onAfterSignup: import { onAfterSignup } from "@src/auth/hooks",
    onBeforeOAuthRedirect: import { onBeforeOAuthRedirect } from "@src/auth/hooks",
  },
}
```
</TabItem>
<TabItem value="ts" label="TypeScript">

```wasp
app myApp {
  wasp: {
    version: "^0.13.0"
  },
  auth: {
    userEntity: User,
    methods: {
      ...
    },
    onBeforeSignup: import { onBeforeSignup } from "@src/auth/hooks",
    onAfterSignup: import { onAfterSignup } from "@src/auth/hooks",
    onBeforeOAuthRedirect: import { onBeforeOAuthRedirect } from "@src/auth/hooks",
  },
}
```
</TabItem>
</Tabs>

If the hooks are defined as async functions, Wasp _awaits_ them. This means the auth process waits for the hooks to finish before continuing.

Wasp ignores the hooks' return values. The only exception is the `onBeforeOAuthRedirect` hook, whose return value affects the OAuth redirect URL.

We'll now go through each of the available hooks.

### Executing code before the user signs up

Wasp calls the `onBeforeSignup` hook before the user is created.

The `onBeforeSignup` hook can be useful if you want to reject a user based on some criteria before they sign up.

Works with <EmailPill /> <UsernameAndPasswordPill /> <DiscordPill /> <GithubPill /> <GooglePill /> <KeycloakPill />

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```wasp title="main.wasp"
app myApp {
  ...
  auth: {
    ...
    onBeforeSignup: import { onBeforeSignup } from "@src/auth/hooks",
  },
}
```

```js title="src/auth/hooks.js"
import { HttpError } from 'wasp/server'

export const onBeforeSignup = async ({
  providerId,
  prisma,
  req,
}) => {
  const count = await prisma.user.count()
  console.log('number of users before', count)
  console.log('provider name', providerId.providerName)
  console.log('provider user ID', providerId.providerUserId)

  if (count > 100) {
    throw new HttpError(403, 'Too many users')
  }

  if (providerId.providerName === 'email' && providerId.providerUserId === 'some@email.com') {
    throw new HttpError(403, 'This email is not allowed')
  }
}
```

</TabItem>
<TabItem value="ts" label="TypeScript">

```wasp title="main.wasp"
app myApp {
  ...
  auth: {
    ...
    onBeforeSignup: import { onBeforeSignup } from "@src/auth/hooks",
  },
}
```

```ts title="src/auth/hooks.ts"
import { HttpError } from 'wasp/server'
import type { OnBeforeSignupHook } from 'wasp/server/auth'

export const onBeforeSignup: OnBeforeSignupHook = async ({
  providerId,
  prisma,
  req,
}) => {
  const count = await prisma.user.count()
  console.log('number of users before', count)
  console.log('provider name', providerId.providerName)
  console.log('provider user ID', providerId.providerUserId)

  if (count > 100) {
    throw new HttpError(403, 'Too many users')
  }

  if (providerId.providerName === 'email' && providerId.providerUserId === 'some@email.com') {
    throw new HttpError(403, 'This email is not allowed')
  }
}
```

</TabItem>
</Tabs>

Read more about the data the `onBeforeSignup` hook receives in the [API Reference](#the-onbeforesignup-hook).

### Executing code after the user signs up

Wasp calls the `onAfterSignup` hook after the user is created.

The `onAfterSignup` hook can be useful if you want to send the user a welcome email or perform some other action after the user signs up like syncing the user with a third-party service.

Since the `onAfterSignup` hook receives the OAuth access token, it can also be used to store the OAuth access token for the user in your database.

Works with <EmailPill /> <UsernameAndPasswordPill /> <DiscordPill /> <GithubPill /> <GooglePill /> <KeycloakPill />

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```wasp title="main.wasp"
app myApp {
  ...
  auth: {
    ...
    onAfterSignup: import { onAfterSignup } from "@src/auth/hooks",
  },
}
```

```js title="src/auth/hooks.js"
export const onAfterSignup = async ({
  providerId,
  user,
  oauth,
  prisma,
  req,
}) => {
  const count = await prisma.user.count()
  console.log('number of users after', count)
  console.log('user object', user)

  // If this is an OAuth signup, we have the access token and uniqueRequestId
  if (oauth) {
    console.log('accessToken', oauth.accessToken)
    console.log('uniqueRequestId', oauth.uniqueRequestId)

    const id = oauth.uniqueRequestId
    const data = someKindOfStore.get(id)
    if (data) {
      console.log('saved data for the ID', data)
    }
    someKindOfStore.delete(id)
  }
}
```

</TabItem>
<TabItem value="ts" label="TypeScript">

```wasp title="main.wasp"
app myApp {
  ...
  auth: {
    ...
    onAfterSignup: import { onAfterSignup } from "@src/auth/hooks",
  },
}
```

```ts title="src/auth/hooks.ts"
import type { OnAfterSignupHook } from 'wasp/server/auth'

export const onAfterSignup: OnAfterSignupHook = async ({
  providerId,
  user,
  oauth,
  prisma,
  req,
}) => {
  const count = await prisma.user.count()
  console.log('number of users after', count)
  console.log('user object', user)

  // If this is an OAuth signup, we have the access token and uniqueRequestId
  if (oauth) {
    console.log('accessToken', oauth.accessToken)
    console.log('uniqueRequestId', oauth.uniqueRequestId)

    const id = oauth.uniqueRequestId
    const data = someKindOfStore.get(id)
    if (data) {
      console.log('saved data for the ID', data)
    }
    someKindOfStore.delete(id)
  }
}
```

</TabItem>
</Tabs>

Read more about the data the `onAfterSignup` hook receives in the [API Reference](#the-onaftersignup-hook).

### Executing code before the OAuth redirect

Wasp calls the `onBeforeOAuthRedirect` hook after the OAuth redirect URL is generated but before redirecting the user. This hook can access the request object sent from the client at the start of the OAuth process.

The `onBeforeOAuthRedirect` hook can be useful if you want to save some data (e.g. request query parameters) that can be used later in the OAuth flow. You can use the `uniqueRequestId` parameter to reference this data later in the `onAfterSignup` hook.

Works with <DiscordPill /> <GithubPill /> <GooglePill /> <KeycloakPill />

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```wasp title="main.wasp"
app myApp {
  ...
  auth: {
    ...
    onBeforeOAuthRedirect: import { onBeforeOAuthRedirect } from "@src/auth/hooks",
  },
}
```

```js title="src/auth/hooks.js"
export const onBeforeOAuthRedirect = async ({
  url,
  uniqueRequestId,
  prisma,
  req,
}) => {
  console.log('query params before oAuth redirect', req.query)

  // Saving query params for later use in the onAfterSignup hook
  const id = uniqueRequestId
  someKindOfStore.set(id, req.query)

  return { url }
}
```

</TabItem>
<TabItem value="ts" label="TypeScript">

```wasp title="main.wasp"
app myApp {
  ...
  auth: {
    ...
    onBeforeOAuthRedirect: import { onBeforeOAuthRedirect } from "@src/auth/hooks",
  },
}
```

```ts title="src/auth/hooks.ts"
import type { OnBeforeOAuthRedirectHook } from 'wasp/server/auth'

export const onBeforeOAuthRedirect: OnBeforeOAuthRedirectHook = async ({
  url,
  uniqueRequestId,
  prisma,
  req,
}) => {
  console.log('query params before oAuth redirect', req.query)

  // Saving query params for later use in the onAfterSignup hook
  const id = uniqueRequestId
  someKindOfStore.set(id, req.query)

  return { url }
}
```

</TabItem>
</Tabs>

This hook's return value must be an object that looks like this: `{ url: URL }`. Wasp uses the URL to redirect the user to the OAuth provider.

Read more about the data the `onBeforeOAuthRedirect` hook receives in the [API Reference](#the-onbeforeoauthredirect-hook).

## API Reference

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```wasp
app myApp {
  wasp: {
    version: "^0.13.0"
  },
  auth: {
    userEntity: User,
    methods: {
      ...
    },
    onBeforeSignup: import { onBeforeSignup } from "@src/auth/hooks",
    onAfterSignup: import { onAfterSignup } from "@src/auth/hooks",
    onBeforeOAuthRedirect: import { onBeforeOAuthRedirect } from "@src/auth/hooks",
  },
}
```
</TabItem>
<TabItem value="ts" label="TypeScript">

```wasp
app myApp {
  wasp: {
    version: "^0.13.0"
  },
  auth: {
    userEntity: User,
    methods: {
      ...
    },
    onBeforeSignup: import { onBeforeSignup } from "@src/auth/hooks",
    onAfterSignup: import { onAfterSignup } from "@src/auth/hooks",
    onBeforeOAuthRedirect: import { onBeforeOAuthRedirect } from "@src/auth/hooks",
  },
}
```
</TabItem>
</Tabs>

### The `onBeforeSignup` hook

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="src/auth/hooks.js"
import { HttpError } from 'wasp/server'

export const onBeforeSignup = async ({
  providerId,
  prisma,
  req,
}) => {
  // Hook code here
}
```

</TabItem>
<TabItem value="ts" label="TypeScript">

```ts title="src/auth/hooks.ts"
import { HttpError } from 'wasp/server'
import type { OnBeforeSignupHook } from 'wasp/server/auth'

export const onBeforeSignup: OnBeforeSignupHook = async ({
  providerId,
  prisma,
  req,
}) => {
  // Hook code here
}
```

</TabItem>
</Tabs>

The hook receives an object as **input** with the following properties:

- `providerId: ProviderId`

  The user's provider ID is an object with two properties:
  - `providerName: string`

    The provider's name (e.g. `'email'`, `'google'`, `'github'`)
  - `providerUserId: string`
    
    The user's unique ID in the provider's system (e.g. email, Google ID, GitHub ID)
- `prisma: PrismaClient`

  The Prisma client instance which you can use to query your database.
- `req: Request`

  The [Express request object](https://expressjs.com/en/api.html#req) from which you can access the request headers, cookies, etc.

Wasp ignores this hook's **return value**.

### The `onAfterSignup` hook

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="src/auth/hooks.js"
export const onAfterSignup = async ({
  providerId,
  user,
  oauth,
  prisma,
  req,
}) => {
  // Hook code here
}
```

</TabItem>
<TabItem value="ts" label="TypeScript">

```ts title="src/auth/hooks.ts"
import type { OnAfterSignupHook } from 'wasp/server/auth'

export const onAfterSignup: OnAfterSignupHook = async ({
  providerId,
  user,
  oauth,
  prisma,
  req,
}) => {
  // Hook code here
}
```

</TabItem>
</Tabs>

The hook receives an object as **input** with the following properties:
- `providerId: ProviderId`

  The user's provider ID is an object with two properties:
  - `providerName: string`
  
    The provider's name (e.g. `'email'`, `'google'`, `'github'`)
  - `providerUserId: string`
  
  The user's unique ID in the provider's system (e.g. email, Google ID, GitHub ID)
- `user: User`
  
  The user object that was created.
- `oauth?: OAuthFields`

  This object is present only when the user is created using [Social Auth](./social-auth/overview.md).
  It contains the following fields:
  - `accessToken: string`

    You can use the OAuth access token to use the provider's API on user's behalf.
  - `uniqueRequestId: string`
  
      The unique request ID for the OAuth flow (you might know it as the `state` parameter in OAuth.)
      
      You can use the unique request ID to get the data saved in the `onBeforeOAuthRedirect` hook.
- `prisma: PrismaClient`

  The Prisma client instance which you can use to query your database.
- `req: Request`
  
  The [Express request object](https://expressjs.com/en/api.html#req) from which you can access the request headers, cookies, etc.

Wasp ignores this hook's **return value**.

### The `onBeforeOAuthRedirect` hook

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="src/auth/hooks.js"
export const onBeforeOAuthRedirect = async ({
  url,
  uniqueRequestId,
  prisma,
  req,
}) => {
  // Hook code here

  return { url }
}
```

</TabItem>
<TabItem value="ts" label="TypeScript">

```ts title="src/auth/hooks.ts"
import type { OnBeforeOAuthRedirectHook } from 'wasp/server/auth'

export const onBeforeOAuthRedirect: OnBeforeOAuthRedirectHook = async ({
  url,
  uniqueRequestId,
  prisma,
  req,
}) => {
  // Hook code here

  return { url }
}
```

</TabItem>
</Tabs>

The hook receives an object as **input** with the following properties:
- `url: URL`

    Wasp uses the URL for the OAuth redirect.
- `uniqueRequestId: string`

    The unique request ID for the OAuth flow (you might know it as the `state` parameter in OAuth.)

    You can use the unique request ID to save data (e.g. request query params) that you can later use in the `onAfterSignup` hook.
- `prisma: PrismaClient`
    
    The Prisma client instance which you can use to query your database.
- `req: Request`

  The [Express request object](https://expressjs.com/en/api.html#req) from which you can access the request headers, cookies, etc.

This hook's return value must be an object that looks like this: `{ url: URL }`. Wasp uses the URL to redirect the user to the OAuth provider.
