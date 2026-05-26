# Bundle archive example

Use this when the MFE should be built as a portable archive, copied into the Host, attached to a release, or uploaded to your own storage without OTA publish.

Key points:

1. Build from the MFE project with `rnm bundle`.
2. Do not import the MFE source from the bundle loader.
3. The Host custom loader must download/read, verify, unpack, and evaluate the archive with your own runtime engine.

```bash
cd examples/mfe-feature
rnm bundle mfe-feature --platform ios --host ../bundle/host-app
```

Add `--update-registry` only if you intentionally want the CLI to write `bundleArchiveUrl` into the Host registry.
