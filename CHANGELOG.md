# 4.0.0 (2020-06-10)

### New features

- Added the `skyux migrate` command, which aids in migrating SKY UX SPAs and libraries to SKY UX 4. [#74](https://github.com/blackbaud/skyux-sdk-cli/pull/74)

# 4.0.0-rc.9 (2020-06-08)

- Fixed the `skyux upgrade` command to set the correct version of `@skyux-sdk/builder` before the upgrade utility is executed. [#88](https://github.com/blackbaud/skyux-sdk-cli/pull/88)

# 4.0.0-rc.8 (2020-06-08)

- Fixed the `skyux new` command to clone the template that is compatible with `@skyux-sdk/builder@^4.0.0-rc.15`. [#87](https://github.com/blackbaud/skyux-sdk-cli/pull/87)

# 4.0.0-rc.7 (2020-06-05)

- Fixed the `skyux upgrade` command to work with both `@skyux-sdk/builder@^3` and `@skyux-sdk/builder@^4`. [#85](https://github.com/blackbaud/skyux-sdk-cli/pull/85)

# 4.0.0-rc.6 (2020-05-26)

- Updated the `skyux upgrade` command to install the major releases of all `@blackbaud/skyux-lib-*` packages. [#83](https://github.com/blackbaud/skyux-sdk-cli/pull/83)

# 4.0.0-rc.5 (2020-05-18)

- Updated the `skyux migrate` command to remove unused or deprecated properties from `package.json` and `skyuxconfig.json` files. [#82](https://github.com/blackbaud/skyux-sdk-cli/pull/82)

# 4.0.0-rc.4 (2020-05-13)

- Fixed the `skyux upgrade` command to skip packages that list invalid version ranges. [#81](https://github.com/blackbaud/skyux-sdk-cli/pull/81)

# 3.4.3 (2020-05-13)

- Fixed the `skyux upgrade` command to install specific version ranges of Angular, SKY UX, and TypeScript packages. [#79](https://github.com/blackbaud/skyux-sdk-cli/pull/79)

# 4.0.0-rc.3 (2020-05-05)

### Bug fixes

- Fixed the `skyux upgrade` command to list newly-added peer dependencies in alphabetical order. [#78](https://github.com/blackbaud/skyux-sdk-cli/pull/78)

# 4.0.0-rc.2 (2020-05-05)

### New features

- Added the `skyux migrate` command, which aids in migrating SKY UX SPAs and libraries to SKY UX 4. [#74](https://github.com/blackbaud/skyux-sdk-cli/pull/74)

# 4.0.0-rc.1 (2020-05-01)

### Bug fixes

- Fixed the `skyux upgrade` command to install specific version ranges for Angular, SKY UX, and TypeScript packages. [#77](https://github.com/blackbaud/skyux-sdk-cli/pull/77)

# 4.0.0-rc.0 (2020-04-01)

### Bug fixes

- Fixed the `skyux upgrade` command to run `npm install` after updating `package.json` instead of deleting the `node_modules` directory and `package-lock.json` file. [#70](https://github.com/blackbaud/skyux-sdk-cli/pull/70)

### Breaking changes

- The `skyux upgrade` command no longer supports Angular versions less than `9.1.0`. [#65](https://github.com/blackbaud/skyux-sdk-cli/pull/65) [#68](https://github.com/blackbaud/skyux-sdk-cli/pull/68)

# 3.4.2 (2020-02-11)

- Fixed the message that prompts users to upgrade to the latest version. [#61](https://github.com/blackbaud/skyux-sdk-cli/pull/61)

# 3.4.1 (2020-02-05)

- Fixed an issue that generated invalid certificates for Chrome on Linux. [#58](https://github.com/blackbaud/skyux-sdk-cli/pull/58)

# 3.4.0 (2020-01-22)

- Migrated the `skyux upgrade` command from the SKY UX migration plugin to the CLI. [#35](https://github.com/blackbaud/skyux-sdk-cli/pull/35) Thanks [@Blackbaud-MatthewMiles](https://github.com/Blackbaud-MatthewMiles)!
- Upgraded dependencies to the latest versions. [#54](https://github.com/blackbaud/skyux-sdk-cli/pull/54)

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
