# 3.3.0 (2019-12-06)

- Updated certificate management for SKY UX. [#52](https://github.com/blackbaud/skyux-sdk-cli/pull/52)
  - Introduced the ability to dynamically create and trust a SKY UX certificate authority.
  - Updated the Windows technique to display a single UAC prompt.
  - Added a catch for when users accidentally type `skyux install certs` instead of `skyux certs install`.
  - Fixed the logging for `skyux certs install`.


# 3.2.2 (2019-11-04)

- Fixed a bug to correctly handle Windows paths that include spaces when running `skyux certs install`.  [#45](https://github.com/blackbaud/skyux-sdk-cli/pull/45)

# 3.2.1 (2019-10-31)

- Changed the self-signed certificate's extension to work correctly in Linux. [#41](https://github.com/blackbaud/skyux-sdk-cli/pull/41)

# 3.2.0 (2019-10-28)

- Introduced the `skyux certs` command for certificate generation and management. [#36](https://github.com/blackbaud/skyux-sdk-cli/pull/36)

# 3.1.0 (2019-05-08)

- Added the ability to display `npm` warning messages when running `skyux new` and `skyux install`. [#25](https://github.com/blackbaud/skyux-sdk-cli/pull/25)
- Expanded messages for when modules are not found for commands or when the node_modules folder is not found. [#24](https://github.com/blackbaud/skyux-sdk-cli/pull/24)

# 3.0.2 (2019-04-11)

- Fixed `skyux new` to respect semantic versioning when upgrading template dependencies. [#20](https://github.com/blackbaud/skyux-sdk-cli/pull/20)

# 3.0.1 (2019-04-09)

- Fixed a bug to correctly update dependencies and set the name and description when running `skyux new`. [#17](https://github.com/blackbaud/skyux-sdk-cli/pull/17)

# 3.0.0 (2019-03-13)

- Published SKY UX CLI under `@skyux-sdk/cli`. Migrated from [@blackbaud/skyux-cli](https://github.com/blackbaud/skyux-cli).
