import { defineMfeConfig } from '@bunin/react-native-micro-frontend';

export default defineMfeConfig({
  name: 'expo-mfe-feature',
  version: '1.0.0',
  entry: './src/index.tsx',
  ota: { enabled: true, mode: 'manual', provider: 'expo' },
  nativeChangePolicy: 'ask',
});
