import { MessengerPage } from '@pages/MessengerPage';

import { ReatomProvider } from './providers/ReatomProvider';

import './styles/global.scss';

/** Application root. */
export const App = () => {
  return (
    <ReatomProvider>
      <MessengerPage />
    </ReatomProvider>
  );
};
