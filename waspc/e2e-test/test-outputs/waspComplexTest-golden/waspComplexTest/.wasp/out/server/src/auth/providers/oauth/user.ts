import { Request as ExpressRequest } from 'express'
import {
  type ProviderId,
  createUser,
  sanitizeAndSerializeProviderData,
  validateAndGetUserFields,
  createProviderId,
} from 'wasp/auth/utils'
import { type Auth } from 'wasp/entities'
import { prisma } from 'wasp/server'
import { type UserSignupFields, type ProviderConfig } from 'wasp/auth/providers/types'
import { getRedirectUriForOneTimeCode } from './redirect'
import { tokenStore } from './oneTimeCode'
import { onBeforeSignupHook, onAfterSignupHook } from '../../hooks.js';

export async function finishOAuthFlowAndGetRedirectUri({
  provider,
  providerProfile,
  providerUserId,
  userSignupFields,
  req,
  accessToken,
  oAuthState,
}: {
  provider: ProviderConfig;
  providerProfile: unknown;
  providerUserId: string;
  userSignupFields: UserSignupFields | undefined;
  req: ExpressRequest;
  accessToken: string;
  oAuthState: { state: string };
}): Promise<URL> {
  const providerId = createProviderId(provider.id, providerUserId);

  const authId = await getAuthIdFromProviderDetails({
    providerId,
    providerProfile,
    userSignupFields,
    req,
    accessToken,
    oAuthState,
  });

  const oneTimeCode = await tokenStore.createToken(authId);

  return getRedirectUriForOneTimeCode(oneTimeCode);
}

// We need a user id to create the auth token, so we either find an existing user
// or create a new one if none exists for this provider.
async function getAuthIdFromProviderDetails({
  providerId,
  providerProfile,
  userSignupFields,
  req,
  accessToken,
  oAuthState,
}: {
  providerId: ProviderId;
  providerProfile: any;
  userSignupFields: UserSignupFields | undefined;
  req: ExpressRequest;
  accessToken: string;
  oAuthState: { state: string };
}): Promise<Auth['id']> {
  const existingAuthIdentity = await prisma.authIdentity.findUnique({
    where: {
      providerName_providerUserId: providerId,
    },
    include: {
      auth: {
        include: {
          user: true
        }
      }
    }
  })

  if (existingAuthIdentity) {
    return existingAuthIdentity.auth.id
  } else {
    const userFields = await validateAndGetUserFields(
      { profile: providerProfile },
      userSignupFields,
    );

    // For now, we don't have any extra data for the oauth providers, so we just pass an empty object.
    const providerData = await sanitizeAndSerializeProviderData({})
  
    await onBeforeSignupHook({ req, providerId })
    const user = await createUser(
      providerId,
      providerData,
      // Using any here because we want to avoid TypeScript errors and
      // rely on Prisma to validate the data.
      userFields as any,
    )
    await onAfterSignupHook({
      req,
      providerId,
      user,
      oauth: {
        accessToken,
        uniqueRequestId: oAuthState.state,
      },
    })

    return user.auth.id
  }
}
