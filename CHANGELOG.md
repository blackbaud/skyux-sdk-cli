# 4.7.0 (2021-04-27)

- Updated the `skyux upgrade` command to work with Angular CLI projects. [#121](https://github.com/blackbaud/skyux-sdk-cli/pull/121)
- Updated the `skyux eject` command to migrate basic SKY UX library projects. [#122](https://github.com/blackbaud/skyux-sdk-cli/pull/122)
- Updated the `skyux eject` command to add the `@blackbaud-internal/skyux-angular-builders` package to private projects and the `@skyux-sdk/angular-builders` package to public projects. [#124](https://github.com/blackbaud/skyux-sdk-cli/pull/124)
- Updated the `skyux eject` command to prompt the user if they wish to enable "strict" mode for their ejected project. [#125](https://github.com/blackbaud/skyux-sdk-cli/pull/125)
- Fixed the `skyux eject` command to properly set the `$schema` property for the `skyuxconfig.json` file. [#126](https://github.com/blackbaud/skyux-sdk-cli/pull/126)
- Fixed the `skyux eject` command to properly handle library source files. [#120](https://github.com/blackbaud/skyux-sdk-cli/pull/120)

# 4.6.0 (2021-04-19)

- Updated the `skyux eject` command to create a directory for string resources if one does not exist. [#116](https://github.com/blackbaud/skyux-sdk-cli/pull/116)

- Updated the `skyux eject` command to preserve third-party dependencies in `package.json`. [#117](https://github.com/blackbaud/skyux-sdk-cli/pull/117)

- Updated the `skyux eject` command to migrate the `appSettings` and `routes` sections in `skyuxconfig.json`. [#118](https://github.com/blackbaud/skyux-sdk-cli/pull/118)

# 4.5.1 (2021-04-13)

- Fixed the `skyux eject` command to properly set up child routes and to add route guards to the module providers. [#113](https://github.com/blackbaud/skyux-sdk-cli/pull/113) [#114](https://github.com/blackbaud/skyux-sdk-cli/pull/114)

# 4.5.0 (2021-04-12)

- Added deprecation warnings to modules that should be refactored after running the `skyux eject` command. [#111](https://github.com/blackbaud/skyux-sdk-cli/pull/111)

# 4.4.1 (2021-03-31)

- Fixed the `skyux eject` command to run the Angular CLI schematic after all file operations are completed. [#110](https://github.com/blackbaud/skyux-sdk-cli/pull/110)

# 4.4.0 (2021-03-31)

- Added the experimental `skyux eject` command which converts a SKY UX application into an Angular CLI application. [#107](https://github.com/blackbaud/skyux-sdk-cli/pull/107) [#108](https://github.com/blackbaud/skyux-sdk-cli/pull/108) [#109](https://github.com/blackbaud/skyux-sdk-cli/pull/109)

# 4.3.1 (2021-02-05)

- Fixed the `skyux upgrade --audit` command to work for Windows machines. [#104](https://github.com/blackbaud/skyux-sdk-cli/pull/104)

# 4.3.0 (2021-02-04)

- Added the `--audit` flag to the `skyux upgrade` command which runs a [security vulnerability audit](https://docs.npmjs.com/cli/v6/commands/npm-audit) and attempts to install compatible updates to address them. This step occurs after the initial installation. [#103](https://github.com/blackbaud/skyux-sdk-cli/pull/103)
- Added the `--clean` flag to the `skyux upgrade` command which deletes the `node_modules` directory and `package-lock.json` file before running a fresh install of all dependencies. This flag also runs a security vulnerability audit after the dependencies are installed. [#103](https://github.com/blackbaud/skyux-sdk-cli/pull/103)

# 4.2.0 (2020-08-04)

- Updated the CLI to print the full stack trace of any errors encountered. [#98](https://github.com/blackbaud/skyux-sdk-cli/pull/98) (Thanks [@Blackbaud-DiHuynh](https://github.com/Blackbaud-DiHuynh)!)
- Fixed the `skyux migrate` command to add the `@skyux-sdk/builder-plugin-pact` plugin to the `skyuxconfig.pact.json` file. [#100](https://github.com/blackbaud/skyux-sdk-cli/pull/100)

# 4.1.0 (2020-06-15)

- Added a descriptive error message to `skyux new` when specifying a template that does not support the current version of SKY UX. [#91](https://github.com/blackbaud/skyux-sdk-cli/pull/91)

- Fixed a bug where running `skyux new` and specifying a repo URL caused a `git checkout` error. [#93](https://github.com/blackbaud/skyux-sdk-cli/pull/93)

# 4.0.1 (2020-06-11)

- Fixed the `skyux migrate` command to remove `tslib` and `@skyux-sdk/cli` from the `package.json` dependencies. [#90](https://github.com/blackbaud/skyux-sdk-cli/pull/90)

# 4.0.0 (2020-06-10)

### New features

- Added the `skyux migrate` command to help migrate SKY UX SPAs and libraries to SKY UX 4. [#74](https://github.com/blackbaud/skyux-sdk-cli/pull/74)

# 4.0.0-rc.9 (2020-06-08)

- Fixed the `skyux upgrade` command to set the correct version of `@skyux-sdk/builder` before executing the upgrade utility. [#88](https://github.com/blackbaud/skyux-sdk-cli/pull/88)

# 4.0.0-rc.8 (2020-06-08)

- Fixed the `skyux new` command to clone the template that is compatible with `@skyux-sdk/builder@^4.0.0-rc.15`. [#87](https://github.com/blackbaud/skyux-sdk-cli/pull/87)

# 4.0.0-rc.7 (2020-06-05)

- Fixed the `skyux upgrade` command to work with both `@skyux-sdk/builder@^3` and `@skyux-sdk/builder@^4`. [#85](https://github.com/blackbaud/skyux-sdk-cli/pull/85)

# 4.0.0-rc.6 (2020-05-26)

- Updated the `skyux upgrade` command to install the major releases of all `@blackbaud/skyux-lib-*` packages. [#83](https://github.com/blackbaud/skyux-sdk-cli/pull/83)

# 4.0.0-rc.5 (2020-05-18)

- Updated the `skyux migrate` command to remove unused or deprecated properties from the `package.json` and `skyuxconfig.json` files. [#82](https://github.com/blackbaud/skyux-sdk-cli/pull/82)

# 4.0.0-rc.4 (2020-05-13)

- Fixed the `skyux upgrade` command to skip packages that list invalid version ranges. [#81](https://github.com/blackbaud/skyux-sdk-cli/pull/81)

# 3.4.3 (2020-05-13)

- Fixed the `skyux upgrade` command to install specific version ranges of Angular, SKY UX, and TypeScript packages. [#79](https://github.com/blackbaud/skyux-sdk-cli/pull/79)

# 4.0.0-rc.3 (2020-05-05)

### Bug fixes

- Fixed the `skyux upgrade` command to list new peer dependencies in alphabetical order. [#78](https://github.com/blackbaud/skyux-sdk-cli/pull/78)

# 4.0.0-rc.2 (2020-05-05)

### New features

- Added the `skyux migrate` command to help migrate SKY UX SPAs and libraries to SKY UX 4. [#74](https://github.com/blackbaud/skyux-sdk-cli/pull/74)

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
