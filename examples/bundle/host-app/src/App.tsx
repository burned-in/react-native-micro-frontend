import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import {
  createMicroFrontendLoader,
  MicroFrontendComponent,
  type MicroFrontendModule,
  MicroFrontendProvider,
} from '@bunin/react-native-micro-frontend/runtime';
import { Text, View } from 'react-native';
import registryJson from '../rnm.registry.json';
import { loadBundleArchive } from './loadBundleArchive';

type MfeFeatureProps = {
  readonly title?: string;
};

type MfeFeatureModule = MicroFrontendModule<MfeFeatureProps>;

const loadMfeModule = createMicroFrontendLoader<MfeFeatureModule>({
  custom: loadBundleArchive,
});

function Loading(props: { readonly reason?: string }) {
  return (
    <View>
      <Text>{props.reason ?? 'Loading bundle archive MFE...'}</Text>
    </View>
  );
}

export default function App() {
  return (
    <MicroFrontendProvider registry={registryJson as MfeRegistry}>
      <MicroFrontendComponent<MfeFeatureProps>
        name="mfe-feature"
        load={loadMfeModule}
        componentProps={{ title: 'Bundle archive MFE loaded by Host runtime' }}
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
