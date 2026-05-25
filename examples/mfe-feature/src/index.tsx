import { Text, View } from 'react-native';

export type MfeFeatureProps = {
  readonly title?: string;
};

export default function MfeFeature(props: MfeFeatureProps) {
  return (
    <View>
      <Text>{props.title ?? 'MFE Feature'}</Text>
    </View>
  );
}
