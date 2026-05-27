import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import {
  createMicroFrontendLoader,
  MicroFrontendComponent,
  type MicroFrontendModule,
  MicroFrontendProvider,
} from '@bunin/react-native-micro-frontend/runtime';
import { Text, View } from 'react-native';
import registryJson from '../rnm.registry.json';

type ExpoMfeFeatureModule = MicroFrontendModule<Record<string, never>>;

const loadMfeModule = createMicroFrontendLoader<ExpoMfeFeatureModule>({
  // Expo Updates delivers the Host binary/update. The RNM runtime still needs
  // an explicit `expo` callback so the Host decides how the registered MFE
  // module is resolved after native-safety checks pass.
  expo: async () => import('../../mfe-feature/src/index'),
});

function Loading(props: { readonly reason?: string }) {
  return (
    <View>
      <Text>{props.reason ?? 'Loading Expo MFE...'}</Text>
    </View>
  );
}

export default function App() {
  return (
    <MicroFrontendProvider registry={registryJson as MfeRegistry}>
      <MicroFrontendComponent
        name="expo-mfe-feature"
        load={loadMfeModule}
        fallback={(state) => <Loading reason={state.reason} />}
        errorFallback={(error) => (
          <Loading
            reason={error instanceof Error ? error.message : 'MFE load failed.'}
          />
        )}
      />
    </MicroFrontendProvider>
  );
}
