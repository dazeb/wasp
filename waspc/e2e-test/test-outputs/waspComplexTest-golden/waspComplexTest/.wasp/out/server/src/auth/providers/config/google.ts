import { Google  } from "arctic";

import type { ProviderConfig } from "wasp/auth/providers/types";
import { getRedirectUriForCallback } from "../oauth/redirect.js";
import { ensureEnvVarsForProvider } from "../oauth/env.js";
import { mergeDefaultAndUserConfig } from "../oauth/config.js";
import { createOAuthProviderRouter } from "../oauth/handler.js";

const _waspUserSignupFields = undefined
const _waspUserDefinedConfigFn = undefined

const _waspConfig: ProviderConfig = {
    id: "google",
    displayName: "Google",
    createRouter(provider) {
        const env = ensureEnvVarsForProvider(
            ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
            provider
        );

        const google = new Google(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            getRedirectUriForCallback(provider.id).toString(),
        );

        const config = mergeDefaultAndUserConfig({
            scopes: ['profile'],
        }, _waspUserDefinedConfigFn);

        async function getGoogleProfile(accessToken: string): Promise<{
            providerProfile: unknown;
            providerUserId: string;
        }> {
            const response = await fetch(
                "https://openidconnect.googleapis.com/v1/userinfo",
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            const providerProfile = (await response.json()) as {
                sub?: string;
            };
        
            if (!providerProfile.sub) {
                throw new Error("Invalid profile");
            }

            return { providerProfile, providerUserId: providerProfile.sub };
        }

        return createOAuthProviderRouter({
            provider,
            oAuthType: 'OAuth2WithPKCE',
            userSignupFields: _waspUserSignupFields,
            getAuthorizationUrl: ({ state, codeVerifier }) => google.createAuthorizationURL(state, codeVerifier, config),
            getProviderTokens: ({ code, codeVerifier }) => google.validateAuthorizationCode(code, codeVerifier),
            getProviderInfo: ({ accessToken }) => getGoogleProfile(accessToken),
        });
    },
}

export default _waspConfig;
