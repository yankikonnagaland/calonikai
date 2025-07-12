import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { restaurant, fitness, person, analytics } from 'ionicons/icons';

import TrackerPage from './pages/TrackerPage';
import ExercisePage from './pages/ExercisePage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './services/AuthService';

// Import Ionic CSS
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// Custom theme
import './theme/variables.css';

setupIonicReact();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => (
  <IonApp>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/tracker">
                <TrackerPage />
              </Route>
              <Route exact path="/exercise">
                <ExercisePage />
              </Route>
              <Route exact path="/profile">
                <ProfilePage />
              </Route>
              <Route exact path="/dashboard">
                <DashboardPage />
              </Route>
              <Route exact path="/">
                <Redirect to="/tracker" />
              </Route>
            </IonRouterOutlet>
            
            <IonTabBar slot="bottom">
              <IonTabButton tab="tracker" href="/tracker">
                <IonIcon aria-hidden="true" icon={restaurant} />
                <IonLabel>Tracker</IonLabel>
              </IonTabButton>
              
              <IonTabButton tab="exercise" href="/exercise">
                <IonIcon aria-hidden="true" icon={fitness} />
                <IonLabel>Exercise</IonLabel>
              </IonTabButton>
              
              <IonTabButton tab="profile" href="/profile">
                <IonIcon aria-hidden="true" icon={person} />
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
              
              <IonTabButton tab="dashboard" href="/dashboard">
                <IonIcon aria-hidden="true" icon={analytics} />
                <IonLabel>Dashboard</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </AuthProvider>
    </QueryClientProvider>
  </IonApp>
);

export default App;