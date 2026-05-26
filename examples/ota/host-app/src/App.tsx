import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import {
  createMicroFrontendLoader,
  MicroFrontendComponent,
  type MicroFrontendModule,
  MicroFrontendProvider,
} from '@bunin/react-native-micro-frontend/runtime';
import { Text, View } from 'react-native';
import type { MfeFeatureProps } from '../../../mfe-feature/src/index';
import registryJson from '../rnm.registry.json';

type MfeFeatureModule = MicroFrontendModule<MfeFeatureProps>;

async function loadWithHotUpdater(): Promise<MfeFeatureModule> {
  // Replace this development stub with your Hot Updater SDK call.
  // Example shape: return await hotUpdater.loadModule<MfeFeatureModule>('mfe-feature');
  return await import('../../../mfe-feature/src/index');
}

const loadMfeModule = createMicroFrontendLoader<MfeFeatureModule>({
  hotUpdater: loadWithHotUpdater,
});

function Loading(props: { readonly reason?: string }) {
  return (
    <View>
      <Text>{props.reason ?? 'Loading OTA MFE...'}</Text>
    </View>
  );
}

export default function App() {
  return (
    <MicroFrontendProvider registry={registryJson as MfeRegistry}>
      <MicroFrontendComponent<MfeFeatureProps>
        name="mfe-feature"
        load={loadMfeModule}
        componentProps={{ title: 'OTA MFE loaded by Hot Updater' }}
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
