import { WebPlugin } from '@capacitor/core';
import { MsAuthPluginPlugin } from './definitions';

interface BaseOptions { clientId: string; tenant?: string; scopes?: string[], keyHash?: string, redirectUri?: string, }
interface LogoutOptions extends BaseOptions {
}
interface LoginOptions extends BaseOptions {
  scopes: string[];
}

export class MsAuthPluginWeb extends WebPlugin implements MsAuthPluginPlugin {
  constructor() {
    super({
      name: 'MsAuthPlugin',
      platforms: ['web'],
    });
  }

  async login(options: LoginOptions): Promise<{ accessToken: string }> {
    const context = this.createContext(options);

    try {
      const accessToken = await this.acquireTokenSilently(context, options.scopes)
        .catch(() => this.acquireTokenInteractively(context, options.scopes));

      return {accessToken};

    } catch (error) {
      console.error('MSAL: Error occurred while logging in', error);

      throw error;
    }
  }

  logout(options: LogoutOptions): Promise<void> {
    const context = this.createContext(options);

    if (!context.getAllAccounts()[0]) {
      return Promise.reject('Nothing to sign out from.');
    } else {
      return context.logout();
    }
  }

  private createContext(options: BaseOptions) {
    const config = {
      auth: {
        clientId: options.clientId,
        authority: `https://login.microsoftonline.com/${options.tenant ?? 'common'}`,
        redirectUri: options.redirectUri ?? this.getCurrentUrl()
      },
      cache: {
        cacheLocation: 'localStorage'
      }
    };

    return new PublicClientApplication(config);
  }

  private getCurrentUrl(): string {
    return window.location.href.split(/[?#]/)[0];
  }

  private async acquireTokenInteractively(context: PublicClientApplication, scopes: string[]): Promise<string> {
    const result = await context.acquireTokenPopup({
      scopes,
      prompt: 'select_account',
    });

    return result.accessToken;
  }

  private async acquireTokenSilently(context: PublicClientApplication, scopes: string[]): Promise<string> {
    const result = await context.acquireTokenSilent({
      scopes,
      account: context.getAllAccounts()[0],
    });

    return result.accessToken;
  }
}

const MsAuthPlugin = new MsAuthPluginWeb();

export { MsAuthPlugin };

import { registerWebPlugin } from '@capacitor/core';
import {PublicClientApplication} from "@azure/msal-browser";
registerWebPlugin(MsAuthPlugin);
