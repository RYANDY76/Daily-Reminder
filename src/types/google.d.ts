export {}

declare global {
  const google: typeof import('google.accounts') & {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string
          callback: (response: { credential?: string }) => void
          cancel_on_tap_outside?: boolean
          auto_select?: boolean
          context?: string
          native_callback?: (response: unknown) => void
          itp_support?: boolean
          login_uri?: string
          nonce?: string
          prompt_parent_id?: string
          state_cookie_domain?: string
          ux_mode?: 'popup' | 'redirect'
          allowed_parent_origin?: string | string[]
          intermediate_iframe_close_callback?: () => void
        }) => void
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
            type?: 'standard' | 'icon'
            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
            logo_alignment?: 'left' | 'center'
            width?: number
            locale?: string
          }
        ) => void
        disableAutoSelect: () => void
        storeCredential: (credential: string, callback?: () => void) => void
        cancel: () => void
        onGoogleLibraryLoad: () => void
        revoke: (hint: string, callback: (response: { error?: string }) => void) => void
        prompt: (momentListener?: (notification: { isNotDisplayed: () => string, isSkippedMoment: () => string, getNotDisplayedReason: () => string, getSkippedReason: () => string, getDismissedReason: () => string, getMomentType: () => string }) => void) => void
      }
      oauth2: {
        initTokenClient: (config: {
          client_id: string
          scope: string
          callback: (response: { access_token?: string; error?: string; error_description?: string }) => void
          error_callback?: (error: { type: string; message?: string }) => void
          state?: string
          include_granted_scopes?: boolean
          enable_serial_consent?: boolean
          hint?: string
          hosted_domain?: string
          login_hint?: string
          prompt?: string
        }) => {
          requestAccessToken: (overrideConfig?: { login_hint?: string }) => void
        }
      }
    }
  }
}
