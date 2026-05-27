# Bundle archive example

Use this when the MFE should be built as a portable archive, copied into the Host, attached to a release, or uploaded to your own storage without OTA publish.

Key points:

1. Build from the MFE project with `rnm bundle`.
2. Do not import the MFE source from the bundle loader.
3. The Host imports `rnm.bundle-archives.ts` and uses `createBundleArchiveLoader()` to read the copied archive asset, gunzip/untar it, and return the Metro entry module.

```bash
cd examples/mfe-feature
rnm bundle mfe-feature --platform ios --host ../bundle/host-app --yes
```

Add `--update-registry` when you want the CLI to write `bundleArchiveUrl` into the Host registry. Without `--yes`, the CLI asks before patching the Host entry import.
