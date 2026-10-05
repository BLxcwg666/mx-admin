import { createAuthClient } from 'better-auth/client'

import { API_URL } from '~/constants/env'

import { getToken } from '../auth'

export const authClient = createAuthClient({
  baseURL: `${API_URL}/auth`,
  fetchOptions: {
    credentials: 'include',
    // Send the admin token as well: when the panel and the API are on different hosts the API
    // cannot read the panel's cookie, and binding an OAuth account needs to know who is logged in.
    onRequest(context) {
      const token = getToken()
      if (token && !context.headers.has('Authorization')) {
        context.headers.set('Authorization', token)
      }
      return context
    },
  },
})

export type AuthSocialProviders =
  | 'apple'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'google'
  | 'microsoft'
  | 'spotify'
  | 'twitch'
  | 'twitter'
  | 'dropbox'
  | 'linkedin'
  | 'gitlab'
