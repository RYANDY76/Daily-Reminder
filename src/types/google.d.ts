interface IdConfiguration {
  client_id: string
  callback: (response: CredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: string
  state_cookie_domain?: string
  native_callback?: (response: CredentialResponse) => void
}

interface CredentialResponse {
  credential?: string
  select_by?:
    | 'auto'
    | 'user'
    | 'user_1tap'
    | 'user_2tap'
    | 'btn'
    | 'btn_confirm'
    | 'br'
    | 'secured'
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

interface TokenClientConfig {
  client_id: string
  scope: string
  callback: (response: TokenResponse) => void
  error_callback?: (error: TokenError) => void
  hint?: string
  state?: string
  enable_serial_consent?: boolean
}

interface TokenResponse {
  access_token?: string
  error?: string
  error_description?: string
  error_uri?: string
  expires_in?: number
  token_type?: string
  scope?: string
  state?: string
}

interface TokenError {
  type: string
  message?: string
}

interface TokenClient {
  requestAccessToken: () => void
}

interface GoogleAccountsId {
  initialize: (config: IdConfiguration) => void
  renderButton: (container: HTMLElement, options: GsiButtonConfiguration) => void
  disableAutoSelect: () => void
  storeCredential: (credential: string, callback: () => void) => void
  cancel: () => void
  revoke: (hint: string, callback: () => void) => void
  prompt: (momentListener: (moment: string) => void) => void
}

interface GoogleOAuth2 {
  initTokenClient: (config: TokenClientConfig) => TokenClient
}

interface GoogleAccounts {
  id: GoogleAccountsId
  oauth2: GoogleOAuth2
}

interface GoogleGIS {
  accounts: GoogleAccounts
}

declare var google: GoogleGIS

interface Window {
  google?: GoogleGIS
}
