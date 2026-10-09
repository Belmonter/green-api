import { createCtx } from '@reatom/framework';
import { reatomContext } from '@reatom/npm-react';

import type { ReatomProviderProps } from './ReatomProvider.types';

/** Application Reatom context. The logger is off because the state holds the API token. */
const appCtx = createCtx();

/** Provides the application Reatom context. */
export const ReatomProvider = ({ children }: ReatomProviderProps) => {
  return <reatomContext.Provider value={appCtx}>{children}</reatomContext.Provider>;
};
