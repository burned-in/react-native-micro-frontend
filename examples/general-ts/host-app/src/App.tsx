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

const localModules = {
  'mfe-feature': () => import('../../../mfe-feature/src/index'),
} satisfies Record<string, () => Promise<MfeFeatureModule>>;

const loadMfeModule = createMicroFrontendLoader<MfeFeatureModule>({
  fallback: async (manifest) => {
    const load = localModules[manifest.name];

    if (!load) {
      throw new Error(`Local MFE source is not mapped: ${manifest.name}.`);
    }

    return await load();
  },
});

function Loading(props: { readonly reason?: string }) {
  return (
    <View>
      <Text>{props.reason ?? 'Loading local TS MFE...'}</Text>
    </View>
  );
}

export default function App() {
  return (
    <MicroFrontendProvider registry={registryJson as MfeRegistry}>
      <MicroFrontendComponent<MfeFeatureProps>
        name="mfe-feature"
        load={loadMfeModule}
        componentProps={{ title: 'General TS MFE loaded by Metro' }}
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
