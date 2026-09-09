import {
  Image,
  StyleSheet,
} from 'react-native';

export default function BrandLogo({
  size = 66,
}) {
  return (
    <Image
      source={require('../../assets/brand-logo.png')}
      resizeMode="cover"
      style={[
        styles.image,
        {
          width: size,
          height: size,
          borderRadius:
            Math.round(
              size * .28,
            ),
        },
      ]}
    />
  );
}

const styles =
  StyleSheet.create({
    image: {
      backgroundColor:
        '#080d11',
    },
  });
