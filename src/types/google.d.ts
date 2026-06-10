interface GoogleAccountsOAuth2TokenClient {
  requestAccessToken: () => void
}

interface GoogleAccountsOAuth2InitTokenClientConfig {
  client_id: string
  scope: string
  callback: (response: { access_token?: string; error?: string; error_description?: string }) => void
  error_callback?: (error: { type?: string; message?: string }) => void
}

interface GsiButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  type?: 'standard' | 'icon'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  logo_alignment?: 'left' | 'center'
  width?: number
}

interface IdConfiguration {
  client_id: string
  callback: (response: { credential: string }) => void
  cancel_on_tap_outside?: boolean
  prompt_parent?: string
}

interface GoogleAccountsId {
  initialize: (config: IdConfiguration) => void
  renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void
}

interface GoogleAccounts {
  oauth2: {
    initTokenClient: (config: GoogleAccountsOAuth2InitTokenClientConfig) => GoogleAccountsOAuth2TokenClient
  }
  id: GoogleAccountsId
}

interface Google {
  accounts: GoogleAccounts
}

declare var google: Google
