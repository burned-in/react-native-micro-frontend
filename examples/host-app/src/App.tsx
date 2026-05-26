import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import {
  createMicroFrontendLoader,
  MicroFrontendComponent,
  type MicroFrontendModule,
  MicroFrontendProvider,
} from '@bunin/react-native-micro-frontend/runtime';
import { Text, View } from 'react-native';
import registryJson from '../rnm.registry.json';
import { loadBundleArchive } from './bundleArchiveLoader.example';

type MfeFeatureProps = {
  readonly title?: string;
};

type MfeFeatureModule = MicroFrontendModule<MfeFeatureProps>;

const loadMfeModule = createMicroFrontendLoader<MfeFeatureModule>({
  // In production, replace this callback with your Hot Updater SDK loader.
  // The example uses a local dynamic import so the component can run in a
  // monorepo/dev fixture without extra OTA infrastructure.
  hotUpdater: async () => import('../../mfe-feature/src/index'),
  custom: loadBundleArchive,
});

function Loading(props: { readonly reason?: string }) {
  return (
    <View>
      <Text>{props.reason ?? 'Loading MFE...'}</Text>
    </View>
  );
}

export default function App() {
  return (
    <MicroFrontendProvider registry={registryJson as MfeRegistry}>
      <MicroFrontendComponent<MfeFeatureProps>
        name="mfe-feature"
        load={loadMfeModule}
        componentProps={{ title: 'MFE Feature loaded by host example' }}
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
