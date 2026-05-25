# Native Contract Policy

The native contract hash includes package native dependencies, Podfile.lock pods, Android Gradle includes/dependencies, Android permissions, Info.plist keys, React Native version, Hermes flag, and New Architecture flag.

OTA is blocked whenever the MFE native contract differs from the host binary contract.
