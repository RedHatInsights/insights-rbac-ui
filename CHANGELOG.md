## [1.79.5](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.79.4...v1.79.5) (2026-01-08)


### Bug Fixes

* **addGroup:** incorporate pf6 to branch ([3c1436a](https://github.com/RedHatInsights/insights-rbac-ui/commit/3c1436a48f1750170a2a2065c595be5b18e30105))
* **AddGroupWizard:** ensure service accounts are properly added ([6393cd6](https://github.com/RedHatInsights/insights-rbac-ui/commit/6393cd650b7a03eba4aaa2f34962e5ac224b9ff2))
* **AddGroupWizard:** fix lint ([61fd6e3](https://github.com/RedHatInsights/insights-rbac-ui/commit/61fd6e3b75a19ab82168bbece5e5b436df12c0aa))
* **CreateGroupWizard:** display user friendly error messages ([9ffdc9d](https://github.com/RedHatInsights/insights-rbac-ui/commit/9ffdc9d1191eada8b48ce4f5e7ecc7e3fe1e138e))
* **CreateGroupWizard:** extend tests to verify service accounts creation ([d422ada](https://github.com/RedHatInsights/insights-rbac-ui/commit/d422adaa345b0656d96c918df62741533238a7aa))

# [1.78.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.77.0...v1.78.0) (2025-12-22)


### Bug Fixes

* inventory API integration and add filtering tests ([a8f8edf](https://github.com/RedHatInsights/insights-rbac-ui/commit/a8f8edf13487f65eead76cf7f22ff798098a5e5f))
* remove legacy role components and fix Storybook test selectors ([73b302f](https://github.com/RedHatInsights/insights-rbac-ui/commit/73b302fd5aa5551c623e80c3ebb11b948c94488b))
* remove redundant User Jest test (covered by 15 Storybook tests) ([e2fcf0e](https://github.com/RedHatInsights/insights-rbac-ui/commit/e2fcf0e504e8b6f1f4470f6c49561ec5e2a34384))
* **RoleResourceDefinitions:** optimize selectors to prevent re-renders ([5a78f48](https://github.com/RedHatInsights/insights-rbac-ui/commit/5a78f48da77e7b9d36348868effade73fdc6dfcb))
* **rolewizard:** clean up some types ([023f76d](https://github.com/RedHatInsights/insights-rbac-ui/commit/023f76d068e5f20161e6bfe9b7c9a4ddd502a803))
* **rolewizard:** convert add role wizard to typescript ([a7b627b](https://github.com/RedHatInsights/insights-rbac-ui/commit/a7b627b3e918242f1ea9c0f8594cb6747927b424))
* **rolewizard:** delete js version of wizard context ([632004d](https://github.com/RedHatInsights/insights-rbac-ui/commit/632004df20177f69030427a693bf26c241b88657))
* **storybook:** fix failing M3 workspace details test ([af00806](https://github.com/RedHatInsights/insights-rbac-ui/commit/af008068303d5b0e2a7decae5b94306dfd20fb9d))
* **storybook:** fix navigation test null console error ([4754e17](https://github.com/RedHatInsights/insights-rbac-ui/commit/4754e17a7078d4fccd4cc2308bae41e33439197b))
* update tests for TableView migration ([b0f17fe](https://github.com/RedHatInsights/insights-rbac-ui/commit/b0f17fe02ca924b6700fcc1590c78603bf8ba38b))


### Features

* convert roles and users JS components to TypeScript with TableView migration ([c3f86a7](https://github.com/RedHatInsights/insights-rbac-ui/commit/c3f86a75e1cc7299f3ee7040a8b934afcb658a38))

# [1.77.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.76.0...v1.77.0) (2025-12-18)


### Features

* **storybook:** add comprehensive tests for remaining JS container components ([6530aed](https://github.com/RedHatInsights/insights-rbac-ui/commit/6530aedf81ff11e5a3c4be0bb009dcb2df27ee8e))

# [1.76.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.75.0...v1.76.0) (2025-12-18)


### Bug Fixes

* **storybook:** adjust WS storybooks to match rolebinding endpoint ([3d2f01a](https://github.com/RedHatInsights/insights-rbac-ui/commit/3d2f01afa674e7e1f8e2a8656d4fb77258c7b77b))
* **types:** use casting to unknown and to request type instead of any ([df6859b](https://github.com/RedHatInsights/insights-rbac-ui/commit/df6859b6205d5f48fe9e81fd393ad6d7686acd45))
* **ws-detail:** do not use as any while going trough rolebinding response ([7372bbd](https://github.com/RedHatInsights/insights-rbac-ui/commit/7372bbdb67bc0f7be8cbff8157bd8e385fbc9910))


### Features

* **role-binding:** use new version of rbac client to support role binding ([aecbce9](https://github.com/RedHatInsights/insights-rbac-ui/commit/aecbce9c1c2dab4826d63b850aac62f7696f53b8))

# [1.75.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.74.0...v1.75.0) (2025-12-18)


### Features

* **GroupRoles:** migrate to TableView ([6df9fd7](https://github.com/RedHatInsights/insights-rbac-ui/commit/6df9fd7c033578b2fb56e753e6dcb17be7a549a0))
* **GroupServiceAccounts:** migrate to TableView ([adced0c](https://github.com/RedHatInsights/insights-rbac-ui/commit/adced0c5b9fb72b45989e10d7bf3e3af98aa3152))
* **UserGroupsTable:** migrate to TableView ([29a38b9](https://github.com/RedHatInsights/insights-rbac-ui/commit/29a38b909cdcba757aab954b90396c7e262be62d))
* **UsersTable:** migrate to TableView ([1aa3cb0](https://github.com/RedHatInsights/insights-rbac-ui/commit/1aa3cb063dfd31f5a839eeab45c02dfb70940983))

# [1.74.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.73.0...v1.74.0) (2025-12-17)


### Features

* **Groups:** use TableView to simplify the code ([e9e3df7](https://github.com/RedHatInsights/insights-rbac-ui/commit/e9e3df74aa32b0641ff6b6bf502313600223ded6))

# [1.73.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.72.3...v1.73.0) (2025-12-16)


### Features

* **components:** add TableView component with type-safe API ([4fab761](https://github.com/RedHatInsights/insights-rbac-ui/commit/4fab7613c27923cf93798bd39d58489df4264912))

## [1.72.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.72.2...v1.72.3) (2025-12-01)


### Bug Fixes

* **Roles:** fix nav for editing roles ([66ebd75](https://github.com/RedHatInsights/insights-rbac-ui/commit/66ebd758eb6088ba2a98c3f4e49452600cb8cfca))

## [1.72.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.72.1...v1.72.2) (2025-11-27)


### Bug Fixes

* **roles:** align filtering + resource definition UX ([#2021](https://github.com/RedHatInsights/insights-rbac-ui/issues/2021)) ([3bfa514](https://github.com/RedHatInsights/insights-rbac-ui/commit/3bfa5149f280bb8a730f44ee5c8d48f40802ea6d))

## [1.72.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.72.0...v1.72.1) (2025-11-26)


### Bug Fixes

* changes to role table filtering to prevent strange behavior ([48febbf](https://github.com/RedHatInsights/insights-rbac-ui/commit/48febbf8eb6cbe242dd30be9008ee85bec2373ba))
* made updates based on sourcery-ai comments ([aaa45f9](https://github.com/RedHatInsights/insights-rbac-ui/commit/aaa45f9eff0c445d5c9e86438acb6fdf7e008a8c))
* made updates based on sourcery-ai comments ([2e49568](https://github.com/RedHatInsights/insights-rbac-ui/commit/2e49568b1991a9dd28b44437a72bfee82f6030ab))

# [1.72.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.71.0...v1.72.0) (2025-11-20)


### Bug Fixes

* **GrantAccessWizard:** update branch ([7eb8903](https://github.com/RedHatInsights/insights-rbac-ui/commit/7eb8903fe4d0bd40d72c9d2e27b16455334959a9))
* **GrantAccessWizard:** update roles step description ([728b9da](https://github.com/RedHatInsights/insights-rbac-ui/commit/728b9da8dd49504196241d187444ea386734d751))
* **productionOrgAdmin:** fix lint ([7088cb2](https://github.com/RedHatInsights/insights-rbac-ui/commit/7088cb29c1f8deed41dae4d497e7fd05201ccd29))
* **Storybook:** remove unsilence assertion ([fbce0c0](https://github.com/RedHatInsights/insights-rbac-ui/commit/fbce0c0cf79d720cb7d115a0c214bfa4c073deff))
* **test:** lint ([d95a966](https://github.com/RedHatInsights/insights-rbac-ui/commit/d95a966438bbaab1237df090cc95d4e88d625dc1))


### Features

* **GrantAccessWizard:** add roles selection step ([3f97b0f](https://github.com/RedHatInsights/insights-rbac-ui/commit/3f97b0f9a6393e12cd85326bc6b7b11fc9cad127))

# [1.71.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.70.1...v1.71.0) (2025-11-20)


### Features

* add message and link to role binding detail ([#2013](https://github.com/RedHatInsights/insights-rbac-ui/issues/2013)) ([9b51ee5](https://github.com/RedHatInsights/insights-rbac-ui/commit/9b51ee5a1ac427dff93af3fa5dceb3788d2d7784))

## [1.70.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.70.0...v1.70.1) (2025-11-17)


### Bug Fixes

* **many:** clear filters now working across the board ([1ab8e2b](https://github.com/RedHatInsights/insights-rbac-ui/commit/1ab8e2b4daaf729e686ff48cdb83e63a4268958f))

# [1.70.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.69.3...v1.70.0) (2025-11-10)


### Features

* **nav:** iam nav overhaul ([#1993](https://github.com/RedHatInsights/insights-rbac-ui/issues/1993)) ([4771166](https://github.com/RedHatInsights/insights-rbac-ui/commit/4771166cf61893e12df87340ad37944148e31bd2))

## [1.69.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.69.2...v1.69.3) (2025-11-07)


### Bug Fixes

* fixed bug with filters in permissions table of create role wizard ([6daa692](https://github.com/RedHatInsights/insights-rbac-ui/commit/6daa692cb778275158dae36a17a58550cdb51b4f))

## [1.69.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.69.1...v1.69.2) (2025-11-06)


### Bug Fixes

* **tests:** correct Storybook play tests for confirmation modals ([9059b22](https://github.com/RedHatInsights/insights-rbac-ui/commit/9059b22888b00e48afb339a42667219da1cae56f))

## [1.69.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.69.0...v1.69.1) (2025-11-05)


### Reverts

* Revert "feat(groups): add confirmation modals for remove actions on roles and…" ([#1995](https://github.com/RedHatInsights/insights-rbac-ui/issues/1995)) ([33a6daf](https://github.com/RedHatInsights/insights-rbac-ui/commit/33a6daf9bcbe9f11b6fd02fbb09fb5f860020006))

# [1.69.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.68.0...v1.69.0) (2025-11-04)


### Features

* **groups:** add confirmation modals for remove actions on roles and members ([#1994](https://github.com/RedHatInsights/insights-rbac-ui/issues/1994)) ([1b94e8a](https://github.com/RedHatInsights/insights-rbac-ui/commit/1b94e8a84549f155d10049bb550766d888b394bb))

# [1.68.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.67.0...v1.68.0) (2025-11-03)


### Features

* **grantaccesswizard:** add user groups selector ([#1992](https://github.com/RedHatInsights/insights-rbac-ui/issues/1992)) ([4fa514d](https://github.com/RedHatInsights/insights-rbac-ui/commit/4fa514d31ca9b90b90b3f68de68ea42301103db5))

# [1.67.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.66.0...v1.67.0) (2025-10-28)


### Features

* add lightspeed rebrand ([#1989](https://github.com/RedHatInsights/insights-rbac-ui/issues/1989)) ([6ad3f96](https://github.com/RedHatInsights/insights-rbac-ui/commit/6ad3f968cd0d8d6a25e20db516237e5be90051af))

# [1.66.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.65.5...v1.66.0) (2025-10-24)


### Features

* **usergroups:** add create usergroup button ([#1972](https://github.com/RedHatInsights/insights-rbac-ui/issues/1972)) ([0d6658b](https://github.com/RedHatInsights/insights-rbac-ui/commit/0d6658b12c37902eada9af4a923c3b8e187fde45))

## [1.65.5](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.65.4...v1.65.5) (2025-10-23)


### Bug Fixes

* **Axios:** update request to use correct params ([ba338ba](https://github.com/RedHatInsights/insights-rbac-ui/commit/ba338ba59cd8fa194f7dd17ae2073b6cb2a17d21))

## [1.65.4](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.65.3...v1.65.4) (2025-10-23)


### Bug Fixes

* **tiles:** permissions for tiles are fixed ([#1961](https://github.com/RedHatInsights/insights-rbac-ui/issues/1961)) ([531e3cd](https://github.com/RedHatInsights/insights-rbac-ui/commit/531e3cd00392e7daf6c63ae6b007dc9c2a76266c))

## [1.65.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.65.2...v1.65.3) (2025-10-23)


### Bug Fixes

* **deps:** update babel monorepo ([#1971](https://github.com/RedHatInsights/insights-rbac-ui/issues/1971)) ([b28803a](https://github.com/RedHatInsights/insights-rbac-ui/commit/b28803a8d9f7d90589b975d2fbd550ae889c2a23))

## [1.65.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.65.1...v1.65.2) (2025-10-17)


### Bug Fixes

* **RHCLOUD-41224:** correct IAM learning resources link and text ([#1948](https://github.com/RedHatInsights/insights-rbac-ui/issues/1948)) ([e4fe13a](https://github.com/RedHatInsights/insights-rbac-ui/commit/e4fe13ad6627ff47ae94b9af13b36fbb48c782a8))
* **RHCLOUD-42361:** correct 'Learn more about workspaces' link URL ([#1949](https://github.com/RedHatInsights/insights-rbac-ui/issues/1949)) ([bda6768](https://github.com/RedHatInsights/insights-rbac-ui/commit/bda676892bbcf2d24a8dde0961c760bd56561649))

## [1.65.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.65.0...v1.65.1) (2025-10-16)


### Bug Fixes

* **Groups:** restore warning dialog when changing Default Group ([3222086](https://github.com/RedHatInsights/insights-rbac-ui/commit/3222086924ffbd07bdddfcd35820271c0a35f993))

# [1.65.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.64.0...v1.65.0) (2025-10-16)


### Bug Fixes

* **grantaccesswizard:** internationalize wizard labels ([fbcba6f](https://github.com/RedHatInsights/insights-rbac-ui/commit/fbcba6f5141aa61295d2c456e0502375601c29f2))
* lint issues in ProductionOrgAdmin ([dcc41cd](https://github.com/RedHatInsights/insights-rbac-ui/commit/dcc41cd7658a8b4ad11a2887ac324ee10eb0ad40))
* more lint ([3d3d870](https://github.com/RedHatInsights/insights-rbac-ui/commit/3d3d87006b0a6ffefb2bc1ac7ee3765b52f8740a))
* resolve merge ([5a8c3b4](https://github.com/RedHatInsights/insights-rbac-ui/commit/5a8c3b4d43c55a558b9b7fa6bcbceaa041c8aff2))


### Features

* **grantaccesswizard:** create grant access wizard ([37f7d19](https://github.com/RedHatInsights/insights-rbac-ui/commit/37f7d19d1fd8c380ced10cfb2b6b3ad1c31ceba9))

# [1.64.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.63.1...v1.64.0) (2025-10-14)


### Features

* **Storybook:** mocked E2E test for Kessel milestones ([bafc655](https://github.com/RedHatInsights/insights-rbac-ui/commit/bafc65554a4c18e0db40fae1318b20345a54829f))

## [1.63.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.63.0...v1.63.1) (2025-10-14)


### Bug Fixes

* **AddGroupMembers:** restored filtering capabilities ([0ba659a](https://github.com/RedHatInsights/insights-rbac-ui/commit/0ba659a6a5c8f7f3120cdc13716340bb62da6987))

# [1.63.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.62.0...v1.63.0) (2025-10-13)


### Bug Fixes

* **rolesdrawer:** replace a tag with applink ([b80e6e8](https://github.com/RedHatInsights/insights-rbac-ui/commit/b80e6e8783a74a5761d805e988d48b524fb6f54b))
* **storybook:** remove waitFor timeouts; fix failing tests ([ba6aeb6](https://github.com/RedHatInsights/insights-rbac-ui/commit/ba6aeb64fb564c9b00645f0d5d58778522669922))
* **tests:** fix console errors in storybook stories ([116813d](https://github.com/RedHatInsights/insights-rbac-ui/commit/116813deccabe6d317d5ac877ba2b67e0b51c45d))


### Features

* **rolesdrawer:** make roles clickable ([c60f075](https://github.com/RedHatInsights/insights-rbac-ui/commit/c60f0757fe57a9f8fbe90fe65fc76210662b630f))

# [1.62.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.61.0...v1.62.0) (2025-10-09)


### Bug Fixes

* correct move workspace notification message variables ([3b2af5b](https://github.com/RedHatInsights/insights-rbac-ui/commit/3b2af5b5bd08300bbb7d72bcd0f85e93bf698bf1))


### Features

* prevent workspace movement to child nodes ([594fafa](https://github.com/RedHatInsights/insights-rbac-ui/commit/594fafa1af77948645614eafcc8b910c656211bc))

# [1.61.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.60.0...v1.61.0) (2025-10-09)


### Features

* **Storybook:** mocked E2E test ([f107580](https://github.com/RedHatInsights/insights-rbac-ui/commit/f107580e36901b3595c64f4041ab5dc6cf7f876e))

# [1.60.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.59.0...v1.60.0) (2025-10-07)


### Features

* **Rolebindings:** add Role binding api ([#1914](https://github.com/RedHatInsights/insights-rbac-ui/issues/1914)) ([9d0d0b3](https://github.com/RedHatInsights/insights-rbac-ui/commit/9d0d0b31cd064bed1237e2046c603b4fd9381ff0))

# [1.59.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.58.0...v1.59.0) (2025-10-07)


### Features

* **roles:** migrate roles list to TypeScript and fix race condition ([a0bd3e1](https://github.com/RedHatInsights/insights-rbac-ui/commit/a0bd3e1c81958f0e1eb5aeb8b0f3b62cdd67cf28))

# [1.58.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.8...v1.58.0) (2025-10-03)


### Bug Fixes

* address console.warns ([c6d342d](https://github.com/RedHatInsights/insights-rbac-ui/commit/c6d342d3ab2cc9a328294964b68bfcc479853755))
* **console:** address all warnings and errors ([6ba7480](https://github.com/RedHatInsights/insights-rbac-ui/commit/6ba74806fd4150c3201c9cddb96604efeabdc1fb))
* key prop spreading error ([25340d6](https://github.com/RedHatInsights/insights-rbac-ui/commit/25340d65cae9fb0835aea40d2359f15747c59899))


### Features

* **Storybook:** detect problematic console messages and flag them as test errors ([a79dcbb](https://github.com/RedHatInsights/insights-rbac-ui/commit/a79dcbb5d1a00d7fe1e5766a9684394af5d30331))

## [1.57.8](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.7...v1.57.8) (2025-10-02)


### Bug Fixes

* **debounce:** resolve flaky test and consolidate utilities ([e1b2cce](https://github.com/RedHatInsights/insights-rbac-ui/commit/e1b2cce0383e5594edbda1bc246c7695078f5ed6))

## [1.57.7](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.6...v1.57.7) (2025-10-01)


### Bug Fixes

* do not checkout the repo from the GH cache action ([a7ee1fd](https://github.com/RedHatInsights/insights-rbac-ui/commit/a7ee1fdb25e777cd21e5ffd2bfd468690554e10b))

## [1.57.6](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.5...v1.57.6) (2025-10-01)


### Bug Fixes

* test-storybook must run on the same code used by chromatic-deployment ([2902d20](https://github.com/RedHatInsights/insights-rbac-ui/commit/2902d201a28466631736da5dc93c08d9a080c154))

## [1.57.5](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.4...v1.57.5) (2025-10-01)


### Bug Fixes

* prevent unauthorized API calls causing error toast spam for non-admin users ([55e0ddc](https://github.com/RedHatInsights/insights-rbac-ui/commit/55e0ddc662ce6069c40624c81cc2bcdff8235d16))

## [1.57.4](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.3...v1.57.4) (2025-10-01)


### Bug Fixes

* crashes when running the app in dev mode ([f0a9942](https://github.com/RedHatInsights/insights-rbac-ui/commit/f0a994236eff2af3d1ce6fa01cd02691f4592e37))
* rename groups.scss to Groups.scss for case sensitivity ([f003895](https://github.com/RedHatInsights/insights-rbac-ui/commit/f003895d37c4adecaabbbbc48bf0cc19a0b24189))

## [1.57.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.2...v1.57.3) (2025-09-30)


### Bug Fixes

* update background image path in overview component ([#1934](https://github.com/RedHatInsights/insights-rbac-ui/issues/1934)) ([42e576d](https://github.com/RedHatInsights/insights-rbac-ui/commit/42e576da03e208341cc67169b62d58cf169c4696))

## [1.57.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.1...v1.57.2) (2025-09-29)


### Bug Fixes

* remove unused @redhat-cloud-services/cost-management-client and update axios to 1.12.0 ([88a42e9](https://github.com/RedHatInsights/insights-rbac-ui/commit/88a42e9e3c402c10386b036ce856a72ee22d638e))

## [1.57.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.57.0...v1.57.1) (2025-09-29)


### Bug Fixes

* **cost-settings:** do not send resource definitions ([#1929](https://github.com/RedHatInsights/insights-rbac-ui/issues/1929)) ([0e5727c](https://github.com/RedHatInsights/insights-rbac-ui/commit/0e5727c85a38d2cfe0c70f843b0368ddcec07e09))

# [1.57.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.56.1...v1.57.0) (2025-09-26)


### Features

* **search:** add org admin global search entry ([17d4811](https://github.com/RedHatInsights/insights-rbac-ui/commit/17d48111fa3fc49024208fa9dcda3d97318e91b2))

## [1.56.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.56.0...v1.56.1) (2025-09-25)


### Bug Fixes

* **disable-users:** use user ID instead of user UUID ([#1927](https://github.com/RedHatInsights/insights-rbac-ui/issues/1927)) ([afefa4c](https://github.com/RedHatInsights/insights-rbac-ui/commit/afefa4c3b2d91382f25b294ca25f77172c48c185))

# [1.56.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.55.0...v1.56.0) (2025-09-24)


### Features

* **dev-proxy:** use dev proxy when running start ([#1923](https://github.com/RedHatInsights/insights-rbac-ui/issues/1923)) ([19fedeb](https://github.com/RedHatInsights/insights-rbac-ui/commit/19fedeb8954a0d674f6636ded7ed6c7ce211234d))

# [1.55.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.54.0...v1.55.0) (2025-09-23)


### Features

* add disabled edit access button to WS details drawer ([#1918](https://github.com/RedHatInsights/insights-rbac-ui/issues/1918)) ([8b59ac4](https://github.com/RedHatInsights/insights-rbac-ui/commit/8b59ac4666c993fbc35c7c7fb509f632eb03c68d))

# [1.54.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.53.1...v1.54.0) (2025-09-18)


### Bug Fixes

* **deps:** bump tmp and inquirer ([#1915](https://github.com/RedHatInsights/insights-rbac-ui/issues/1915)) ([5484280](https://github.com/RedHatInsights/insights-rbac-ui/commit/5484280bc43c435c941283b1b5b8eee322c0f608))


### Features

* replace custom SVG icons with PatternFly icons in WorkspacesOverview ([#1913](https://github.com/RedHatInsights/insights-rbac-ui/issues/1913)) ([f50bbbb](https://github.com/RedHatInsights/insights-rbac-ui/commit/f50bbbb36321fcae5ed3dc460c78f7d53975f533))

## [1.53.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.53.0...v1.53.1) (2025-09-17)


### Bug Fixes

* run npx playwright install before running the tests for PRs ([c20a44a](https://github.com/RedHatInsights/insights-rbac-ui/commit/c20a44aa65171b8984b5d4e5a2134e01d266a60e))

# [1.53.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.52.0...v1.53.0) (2025-09-16)


### Features

* run test-storybook against Chromatic's build ([f0838dc](https://github.com/RedHatInsights/insights-rbac-ui/commit/f0838dc4f22f2a59d82240d228952d0523c8e0d0))

# [1.52.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.51.0...v1.52.0) (2025-09-10)


### Features

* update technology icon path ([#1912](https://github.com/RedHatInsights/insights-rbac-ui/issues/1912)) ([b9d14e2](https://github.com/RedHatInsights/insights-rbac-ui/commit/b9d14e24c9d9f76690ad0a621ab9aadd07066ce6))

# [1.51.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.50.2...v1.51.0) (2025-09-04)


### Bug Fixes

* **lint:** remove import ([f4baac8](https://github.com/RedHatInsights/insights-rbac-ui/commit/f4baac8f97bb477b859a9f1959b8c34020b81fa0))
* **serviceaccountslist:** make table compact ([c139d17](https://github.com/RedHatInsights/insights-rbac-ui/commit/c139d1721dba23dc1ef34f3a9eb33320ae0fb5af))
* **tests:** update snapshots ([34a97ee](https://github.com/RedHatInsights/insights-rbac-ui/commit/34a97ee5034e0721e43c96012d0626fa8e3e7139))
* **test:** update snapshot ([dbe7c36](https://github.com/RedHatInsights/insights-rbac-ui/commit/dbe7c36b7bfac22b44c5cc1a6c03ff648740783f))


### Features

* **serviceaccountslist:** convert service-accounts-list to use DataViewTable ([db75a8d](https://github.com/RedHatInsights/insights-rbac-ui/commit/db75a8d808a24d84d4af8bb9d08e781dec11bcb8))

## [1.50.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.50.1...v1.50.2) (2025-09-03)


### Bug Fixes

* **feo:** removing ciam app data ([#1910](https://github.com/RedHatInsights/insights-rbac-ui/issues/1910)) ([5f5e609](https://github.com/RedHatInsights/insights-rbac-ui/commit/5f5e609b640502b2d2fd71a1f2eb0d635bc1d193))

## [1.50.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.50.0...v1.50.1) (2025-08-28)


### Bug Fixes

* **groups:** adding and removing users from group ([#1907](https://github.com/RedHatInsights/insights-rbac-ui/issues/1907)) ([2e66610](https://github.com/RedHatInsights/insights-rbac-ui/commit/2e66610b5cdd43d78cdf8e15afb7f51d6f084411))

# [1.50.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.49.2...v1.50.0) (2025-08-27)


### Features

* add disabled grant access button to WS details ([#1906](https://github.com/RedHatInsights/insights-rbac-ui/issues/1906)) ([b5772d4](https://github.com/RedHatInsights/insights-rbac-ui/commit/b5772d4c5a705e7a7ca9bbd5d545559c6138de97))

## [1.49.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.49.1...v1.49.2) (2025-08-26)


### Bug Fixes

* **service-accounts:** assign, list and delete from group ([#1901](https://github.com/RedHatInsights/insights-rbac-ui/issues/1901)) ([727a976](https://github.com/RedHatInsights/insights-rbac-ui/commit/727a976eeea501dccb022cac23c51b26276619ce))

## [1.49.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.49.0...v1.49.1) (2025-08-21)


### Bug Fixes

* **roles:** when navigating from my user access ([#1904](https://github.com/RedHatInsights/insights-rbac-ui/issues/1904)) ([2b6af9b](https://github.com/RedHatInsights/insights-rbac-ui/commit/2b6af9bf0b8c8128a40ef4b77f4b848fe63a6d49))

# [1.49.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.48.2...v1.49.0) (2025-08-21)


### Features

* **users:** Unify users table ([#1900](https://github.com/RedHatInsights/insights-rbac-ui/issues/1900)) ([4e15933](https://github.com/RedHatInsights/insights-rbac-ui/commit/4e15933dba2b9ebe5870b3339bd817336351d0ec))

## [1.48.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.48.1...v1.48.2) (2025-08-19)


### Bug Fixes

* update iam.svg url ([#1898](https://github.com/RedHatInsights/insights-rbac-ui/issues/1898)) ([b8a49c4](https://github.com/RedHatInsights/insights-rbac-ui/commit/b8a49c42bb2c72bd66a4b6df39857b58a3978e7f))

## [1.48.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.48.0...v1.48.1) (2025-08-04)


### Bug Fixes

* remove openshift asset from WS details ([#1890](https://github.com/RedHatInsights/insights-rbac-ui/issues/1890)) ([8a742fe](https://github.com/RedHatInsights/insights-rbac-ui/commit/8a742fe409a6890ea60355c49a25e3d7f3554e69))

# [1.48.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.47.1...v1.48.0) (2025-07-30)


### Features

* comprehensive codebase modernization and tooling overhaul ([3d01173](https://github.com/RedHatInsights/insights-rbac-ui/commit/3d011734ada451fe0912b9e7ec396b97cacb60de))

## [1.47.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.47.0...v1.47.1) (2025-07-30)


### Bug Fixes

* fix broken cypress tests ([f8a88d0](https://github.com/RedHatInsights/insights-rbac-ui/commit/f8a88d0231b951ea4471af6c2f308dfc78ed4484))
* workspace selector styling ([#1873](https://github.com/RedHatInsights/insights-rbac-ui/issues/1873)) ([eb491ca](https://github.com/RedHatInsights/insights-rbac-ui/commit/eb491ca5777e297022eee629f28a0dff84c5b3f2))

# [1.47.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.7...v1.47.0) (2025-07-25)


### Features

* temporarily updated tooltip content for workspace naming guidelines ([#1880](https://github.com/RedHatInsights/insights-rbac-ui/issues/1880)) ([74c48d7](https://github.com/RedHatInsights/insights-rbac-ui/commit/74c48d7d536df2ba2d75dbdd708f2c37c38a34a1))

## [1.46.7](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.6...v1.46.7) (2025-07-23)


### Bug Fixes

* **toolbar:** selection by using callback only ([#1885](https://github.com/RedHatInsights/insights-rbac-ui/issues/1885)) ([8905442](https://github.com/RedHatInsights/insights-rbac-ui/commit/890544286c772422854d608d58d3a3c33f64cfa1))

## [1.46.6](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.5...v1.46.6) (2025-07-22)


### Bug Fixes

* **ws:** filter by showing children of found nodes ([#1882](https://github.com/RedHatInsights/insights-rbac-ui/issues/1882)) ([a4532a5](https://github.com/RedHatInsights/insights-rbac-ui/commit/a4532a5342e5446227fea983dcd317501d823bf8))

## [1.46.5](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.4...v1.46.5) (2025-07-22)


### Bug Fixes

* fix swc error on CI ([b6e0493](https://github.com/RedHatInsights/insights-rbac-ui/commit/b6e04934470d4b8eb534d9be3be8085af3d6c641))


### Reverts

* Revert "fix: use node 20 for chromatic" ([677f081](https://github.com/RedHatInsights/insights-rbac-ui/commit/677f081a8f433d605eb422f710dc1dd5c185ce51))

## [1.46.4](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.3...v1.46.4) (2025-07-22)


### Bug Fixes

* use node 20 for chromatic ([9ae14e5](https://github.com/RedHatInsights/insights-rbac-ui/commit/9ae14e51d1214bfe7461c53727344c2200eba71a))

## [1.46.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.2...v1.46.3) (2025-07-22)


### Bug Fixes

* use node lts ([772a3e4](https://github.com/RedHatInsights/insights-rbac-ui/commit/772a3e410d48342b595ce41388109f154579b834))

## [1.46.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.1...v1.46.2) (2025-07-22)


### Bug Fixes

* chromatic workflow ([d4e1b8b](https://github.com/RedHatInsights/insights-rbac-ui/commit/d4e1b8b5c3a0e4f56ec6cbf7b655fa6e3fb6b923))

## [1.46.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.46.0...v1.46.1) (2025-07-22)


### Bug Fixes

* fix OOM on CI ([d835a6a](https://github.com/RedHatInsights/insights-rbac-ui/commit/d835a6ae3e1231ab6b181eba5062f4054332a976))

# [1.46.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.45.1...v1.46.0) (2025-07-21)


### Features

* implement comprehensive Storybook integration and component documentation ([1095985](https://github.com/RedHatInsights/insights-rbac-ui/commit/1095985f79154756ff312c004feb5d7c82e75e25))

## [1.45.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.45.0...v1.45.1) (2025-07-17)


### Bug Fixes

* **create-workspace:** workspace selector can be enabled if hierarchy FF is on ([#1876](https://github.com/RedHatInsights/insights-rbac-ui/issues/1876)) ([baef26c](https://github.com/RedHatInsights/insights-rbac-ui/commit/baef26c680ab99a1ee295e279c3c4b8603ed31a6))

# [1.45.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.44.0...v1.45.0) (2025-07-16)


### Features

* **myuseraccess:** filter out out-of-scope bundles and apps for itless env ([#1867](https://github.com/RedHatInsights/insights-rbac-ui/issues/1867)) ([6d42875](https://github.com/RedHatInsights/insights-rbac-ui/commit/6d4287552d8c27c32e35a1e85232ff5a4b8f8981))

# [1.44.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.43.3...v1.44.0) (2025-06-25)


### Features

* use new workspace selector in create workspace wizard ([#1862](https://github.com/RedHatInsights/insights-rbac-ui/issues/1862)) ([c3eeb71](https://github.com/RedHatInsights/insights-rbac-ui/commit/c3eeb7197189a51ff57a3bf970c8e01f36df9cf1))

## [1.43.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.43.2...v1.43.3) (2025-06-19)


### Bug Fixes

* allow users to see the full list of permissions for their own profile ([#1858](https://github.com/RedHatInsights/insights-rbac-ui/issues/1858)) ([0d0d4de](https://github.com/RedHatInsights/insights-rbac-ui/commit/0d0d4de06a05e54e5cca1b6597b176b9ff669bd1))

## [1.43.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.43.1...v1.43.2) (2025-06-12)


### Bug Fixes

* tweak MUA mobile/tablet breakpoints ([1d30265](https://github.com/RedHatInsights/insights-rbac-ui/commit/1d30265e3c58e846d0184c51a5a7c1f4f29c9ec2))

## [1.43.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.43.0...v1.43.1) (2025-06-11)


### Bug Fixes

* **itless:** fix itless users activate dropdown ([#1856](https://github.com/RedHatInsights/insights-rbac-ui/issues/1856)) ([43b26dc](https://github.com/RedHatInsights/insights-rbac-ui/commit/43b26dc9d3d6523e660a4d6022ce764a966b4d06))

# [1.43.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.42.1...v1.43.0) (2025-06-11)


### Bug Fixes

* flag the selected group as not a plat default after a change ([559c3eb](https://github.com/RedHatInsights/insights-rbac-ui/commit/559c3ebffb0812394f0982c52ffaef48415ac062))


### Features

* programmatically enable redux devtools extension support ([b490e60](https://github.com/RedHatInsights/insights-rbac-ui/commit/b490e60214252da9cbc0e1aff7f33543d89096d1))

## [1.42.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.42.0...v1.42.1) (2025-06-10)


### Bug Fixes

* update 'user management - invite user' text ([d8753aa](https://github.com/RedHatInsights/insights-rbac-ui/commit/d8753aa1011a8d188437a24fc1c04f9532f5be37))

# [1.42.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.41.6...v1.42.0) (2025-06-10)


### Features

* add initial ws selector module ([c44a11e](https://github.com/RedHatInsights/insights-rbac-ui/commit/c44a11edbdfcbe1224c05d50c1e0139cf5d6e12a))

## [1.41.6](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.41.5...v1.41.6) (2025-06-06)


### Bug Fixes

* **common-auth:** current user cannot be disabled ([#1852](https://github.com/RedHatInsights/insights-rbac-ui/issues/1852)) ([e1af3a1](https://github.com/RedHatInsights/insights-rbac-ui/commit/e1af3a1ea7f8fdcec8eab9dca79080742d2a53c9))

## [1.41.5](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.41.4...v1.41.5) (2025-06-04)


### Bug Fixes

* **bug:** fix circular structure error in user activation toggle ([3b3f983](https://github.com/RedHatInsights/insights-rbac-ui/commit/3b3f9836f2898fe8be6e3ad7d5dcb2a33bf065aa))

## [1.41.4](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.41.3...v1.41.4) (2025-06-04)


### Bug Fixes

* fetch all workspaces by default ([#1846](https://github.com/RedHatInsights/insights-rbac-ui/issues/1846)) ([7def691](https://github.com/RedHatInsights/insights-rbac-ui/commit/7def6910925a270d43604b92148ad12e46a470a4))

## [1.41.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.41.2...v1.41.3) (2025-06-04)


### Bug Fixes

* **api-arg:** js clients has broken arguments so we have to use list of args ([#1844](https://github.com/RedHatInsights/insights-rbac-ui/issues/1844)) ([e3f2d4a](https://github.com/RedHatInsights/insights-rbac-ui/commit/e3f2d4a02b78c869bd1dab30048f9f4e4402881d))

## [1.41.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.41.1...v1.41.2) (2025-06-04)


### Bug Fixes

* use inline style when calling workspaces api ([#1845](https://github.com/RedHatInsights/insights-rbac-ui/issues/1845)) ([3cdae15](https://github.com/RedHatInsights/insights-rbac-ui/commit/3cdae15d1e51a476ee5bee1361ac78c191279857))

## [1.41.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.41.0...v1.41.1) (2025-05-27)


### Bug Fixes

* **WS:** raise WS limit to 10k ([#1841](https://github.com/RedHatInsights/insights-rbac-ui/issues/1841)) ([c7f50d7](https://github.com/RedHatInsights/insights-rbac-ui/commit/c7f50d75d62b01a98d288a407993755059ac6502))

# [1.41.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.40.1...v1.41.0) (2025-05-22)


### Features

* **workspaces:** allow ungrouped ws to have inventory detail ([#1839](https://github.com/RedHatInsights/insights-rbac-ui/issues/1839)) ([d631ac0](https://github.com/RedHatInsights/insights-rbac-ui/commit/d631ac0b79c305429738b4e2f26ed13d718e5cec))

## [1.40.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.40.0...v1.40.1) (2025-05-21)


### Bug Fixes

* **cypress:** failing tests ([#1835](https://github.com/RedHatInsights/insights-rbac-ui/issues/1835)) ([5c4bef8](https://github.com/RedHatInsights/insights-rbac-ui/commit/5c4bef8f5a085bb6a928dbf33ef48c653573ff53))

# [1.40.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.39.1...v1.40.0) (2025-05-17)


### Features

* **workspaces:** redirect to inventory ws table ([#1836](https://github.com/RedHatInsights/insights-rbac-ui/issues/1836)) ([ce0d204](https://github.com/RedHatInsights/insights-rbac-ui/commit/ce0d204b5b20cfb87bba0e7e525b5d59de80917b))

## [1.39.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.39.0...v1.39.1) (2025-05-16)


### Bug Fixes

* handle empty responses from Akamai for the potentially optional cost API ([#1834](https://github.com/RedHatInsights/insights-rbac-ui/issues/1834)) ([4f6afcf](https://github.com/RedHatInsights/insights-rbac-ui/commit/4f6afcf45482597a8fdbe57c9a4a8cc2881db3d1))

# [1.39.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.38.0...v1.39.0) (2025-05-15)


### Features

* **workspacewizard:** disable ws parent select ([#1832](https://github.com/RedHatInsights/insights-rbac-ui/issues/1832)) ([a237733](https://github.com/RedHatInsights/insights-rbac-ui/commit/a23773346e8a6cd090512b56de0885e69d0f5fcf))

# [1.38.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.37.1...v1.38.0) (2025-05-15)


### Features

* add workspaces to iam section of services dropdown ([#1833](https://github.com/RedHatInsights/insights-rbac-ui/issues/1833)) ([5dd5fd9](https://github.com/RedHatInsights/insights-rbac-ui/commit/5dd5fd98a023667e185587eefb2941281c94f98b))

## [1.37.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.37.0...v1.37.1) (2025-05-15)


### Reverts

* Revert "chore(deps): bump http-proxy-middleware from 2.0.6 to 2.0.9 ([#1814](https://github.com/RedHatInsights/insights-rbac-ui/issues/1814))" ([#1831](https://github.com/RedHatInsights/insights-rbac-ui/issues/1831)) ([daabcc3](https://github.com/RedHatInsights/insights-rbac-ui/commit/daabcc32b0a2db120703b7c8ea76e21e91941cde))

# [1.37.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.36.2...v1.37.0) (2025-05-14)


### Features

* add cypress test Make user an org admin ([#1796](https://github.com/RedHatInsights/insights-rbac-ui/issues/1796)) ([4bf69cc](https://github.com/RedHatInsights/insights-rbac-ui/commit/4bf69ccfa5ce0f039f4484614dd6792bb60a0965))

## [1.36.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.36.1...v1.36.2) (2025-05-14)


### Bug Fixes

* **permissions:** view WS list for users with groups read ([#1821](https://github.com/RedHatInsights/insights-rbac-ui/issues/1821)) ([9bc20af](https://github.com/RedHatInsights/insights-rbac-ui/commit/9bc20afd7ed7868dea79df7e7366dd0073bf0d9a))

## [1.36.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.36.0...v1.36.1) (2025-04-30)


### Bug Fixes

* **delete-ws:** fix delete workspace by styling it and properly sending request ([#1817](https://github.com/RedHatInsights/insights-rbac-ui/issues/1817)) ([b8b6d13](https://github.com/RedHatInsights/insights-rbac-ui/commit/b8b6d1311d6832994e3f56373b96a7b25ccf7a1d))

# [1.36.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.35.0...v1.36.0) (2025-04-29)


### Features

* **role:** edit role feature ([f581690](https://github.com/RedHatInsights/insights-rbac-ui/commit/f581690bf451e22abf8f2e19f21bdb0180b95e7f)), closes [#1795](https://github.com/RedHatInsights/insights-rbac-ui/issues/1795) [#1812](https://github.com/RedHatInsights/insights-rbac-ui/issues/1812)

# [1.35.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.34.2...v1.35.0) (2025-04-25)


### Features

* **workspacewizard:** expose workspace wizard through fec ([#1794](https://github.com/RedHatInsights/insights-rbac-ui/issues/1794)) ([b61d172](https://github.com/RedHatInsights/insights-rbac-ui/commit/b61d1724fca00eae2af91bcc26728f3bd8c389fb))

## [1.34.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.34.1...v1.34.2) (2025-04-25)


### Reverts

* Revert "feat: add empty new edit role page ([#1795](https://github.com/RedHatInsights/insights-rbac-ui/issues/1795))" ([#1812](https://github.com/RedHatInsights/insights-rbac-ui/issues/1812)) ([e86b412](https://github.com/RedHatInsights/insights-rbac-ui/commit/e86b412deca0c34c99e447e71de8fd255c41e23d))

## [1.34.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.34.0...v1.34.1) (2025-04-25)


### Bug Fixes

* **dependabot:** disable dependabot for weekly npm updates ([#1811](https://github.com/RedHatInsights/insights-rbac-ui/issues/1811)) ([e55e7ee](https://github.com/RedHatInsights/insights-rbac-ui/commit/e55e7ee237856e7c5202872de9a760d477b650e6))

# [1.34.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.33.0...v1.34.0) (2025-04-24)


### Features

* add empty new edit role page ([#1795](https://github.com/RedHatInsights/insights-rbac-ui/issues/1795)) ([2276b4f](https://github.com/RedHatInsights/insights-rbac-ui/commit/2276b4f310a75aed91d3e4920b5ace273ff619ed))

# [1.33.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.32.0...v1.33.0) (2025-04-24)


### Features

* **editworkspace:** add the edit workspace wizard to list view ([#1799](https://github.com/RedHatInsights/insights-rbac-ui/issues/1799)) ([d314f48](https://github.com/RedHatInsights/insights-rbac-ui/commit/d314f4828144bbc4eaad4973f4c69f2e407143e9))

# [1.32.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.31.0...v1.32.0) (2025-04-24)


### Features

* delete workspace disable when non empty ([2fdb4fe](https://github.com/RedHatInsights/insights-rbac-ui/commit/2fdb4fe54ddab5b99ccc62ac0dfb903efa34c748))

# [1.31.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.30.0...v1.31.0) (2025-04-09)


### Features

* **konflux:** introduce remote Konflux pipeline ([#1793](https://github.com/RedHatInsights/insights-rbac-ui/issues/1793)) ([b75e11b](https://github.com/RedHatInsights/insights-rbac-ui/commit/b75e11b20f51685b2f1c01514c90b8be8a5ac8ae))

# [1.30.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.29.1...v1.30.0) (2025-04-04)


### Features

* **EditWorkspace:** add edit workspace modal ([#1783](https://github.com/RedHatInsights/insights-rbac-ui/issues/1783)) ([f7a46e4](https://github.com/RedHatInsights/insights-rbac-ui/commit/f7a46e4c4b1b0ef2d84c44caf247ada8af947009))

## [1.29.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.29.0...v1.29.1) (2025-04-04)


### Bug Fixes

* **common-auth:** remove invite message ([#1789](https://github.com/RedHatInsights/insights-rbac-ui/issues/1789)) ([5d808c5](https://github.com/RedHatInsights/insights-rbac-ui/commit/5d808c5ba27458798fda0cb081a9c70b5ec7676b))

# [1.29.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.28.1...v1.29.0) (2025-04-02)


### Features

* **workspaceDetails:** should be hidden when platform.rbac.workspaces-list flag is on ([#1784](https://github.com/RedHatInsights/insights-rbac-ui/issues/1784)) ([5a68258](https://github.com/RedHatInsights/insights-rbac-ui/commit/5a68258a666d5f206c29f8bcbd705bd7a6b707a2))

## [1.28.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.28.0...v1.28.1) (2025-04-01)


### Bug Fixes

* add sast tasks ([#1787](https://github.com/RedHatInsights/insights-rbac-ui/issues/1787)) ([9442e25](https://github.com/RedHatInsights/insights-rbac-ui/commit/9442e2568bbd2536885bfbc4e71a7c9cb772a3ab))

# [1.28.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.27.1...v1.28.0) (2025-03-25)


### Features

* enable sorting and filtering for users table ([#1777](https://github.com/RedHatInsights/insights-rbac-ui/issues/1777)) ([70507bb](https://github.com/RedHatInsights/insights-rbac-ui/commit/70507bb8c57e4126ab361b6da8dd659649bf90ea))

## [1.27.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.27.0...v1.27.1) (2025-03-21)


### Bug Fixes

* handle case of undefined group ([#1782](https://github.com/RedHatInsights/insights-rbac-ui/issues/1782)) ([f4021f1](https://github.com/RedHatInsights/insights-rbac-ui/commit/f4021f170d990aa07f375e4527f929becfccaaa2))

# [1.27.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.26.0...v1.27.0) (2025-03-12)


### Bug Fixes

* **role wizard:** unflip workspace flag ([9807831](https://github.com/RedHatInsights/insights-rbac-ui/commit/9807831ab82e75ab12e29b14fc688124a53b6931))


### Features

* **role wizard:** include add role wizard to new role page ([18b0aab](https://github.com/RedHatInsights/insights-rbac-ui/commit/18b0aabc54effb0e6f158bb18e38ee50814f8e8b))

# [1.26.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.25.0...v1.26.0) (2025-03-11)


### Features

* **workspaces:** add ability to delete workspace from list view ([d0256af](https://github.com/RedHatInsights/insights-rbac-ui/commit/d0256af541c9a067c29e5819c7ab66299706828c))

# 1.0.0 (2025-03-06)


### Bug Fixes

* **admin-group:** when we don't have admin group do not break ([#1765](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1765)) ([881e1da](https://github.com/CodyWMitchell/insights-rbac-ui/commit/881e1dad988d8e624a7eb4f245ffa1e2b1a5cd66))
* **basename:** basename for workspaces is calculated incorrectly ([#1699](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1699)) ([113a38e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/113a38e4d3475e79252a0e931c203056d6e77359))
* **common-auth:** org admins in users table ([#1774](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1774)) ([32997a0](https://github.com/CodyWMitchell/insights-rbac-ui/commit/32997a0b3e37aa0f925c4877ba3030c0247aa77d))
* **common-auth:** use org ID ([#1757](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1757)) ([5ecb079](https://github.com/CodyWMitchell/insights-rbac-ui/commit/5ecb079d46538f74c10a0ad0848ab533bf0b6695))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1693)) ([1f433e9](https://github.com/CodyWMitchell/insights-rbac-ui/commit/1f433e927df2f3febc5301cedb775bdbea21caa8))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1693)) ([800fbb7](https://github.com/CodyWMitchell/insights-rbac-ui/commit/800fbb7bf3efec362ac3f08e7a690b3982f2b4c3))
* fix typo and update snapshots ([67923e9](https://github.com/CodyWMitchell/insights-rbac-ui/commit/67923e98223249eed39edcb5b4158d1a2d025d81))
* fix users-and-user-groups E2E ([14dcf89](https://github.com/CodyWMitchell/insights-rbac-ui/commit/14dcf89a4ca61c4ae99255c328a62d74bc046b88))
* hide service accounts table for default admin access ([#1709](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1709)) ([1452179](https://github.com/CodyWMitchell/insights-rbac-ui/commit/1452179da1a55c17c486aed55d23e3a1a7e48285))
* **invite:** by adding locale ([#1759](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1759)) ([c11e179](https://github.com/CodyWMitchell/insights-rbac-ui/commit/c11e179995b5476b5a8730c80bb1866a20aaa8ba))
* issues with merge commit ([84917d3](https://github.com/CodyWMitchell/insights-rbac-ui/commit/84917d3caab81a7970f80f148d3f9252582eb746))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1691)) ([81d51ff](https://github.com/CodyWMitchell/insights-rbac-ui/commit/81d51fffbabaf08a4fa3a7461d0bba31407d892d))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1691)) ([981c7ce](https://github.com/CodyWMitchell/insights-rbac-ui/commit/981c7ceae4bc46143f703f666484e2cea4338469))
* **konflux:** failing konflux build by removing JAVA references ([#1743](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1743)) ([76bc417](https://github.com/CodyWMitchell/insights-rbac-ui/commit/76bc4171ac08ab2ecbae61b52634ce868c7d2c97))
* **konflux:** remove duplicate name of task ([#1723](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1723)) ([991729a](https://github.com/CodyWMitchell/insights-rbac-ui/commit/991729a25b0121bda9802c762cb707e3a4757aa2))
* **konflux:** remove sbom json check ([#1722](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1722)) ([9fe1bce](https://github.com/CodyWMitchell/insights-rbac-ui/commit/9fe1bcefd693fa180631164c10c9bd28f51d91d3))
* **konflux:** update buildah image sha ([#1719](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1719)) ([7d637b8](https://github.com/CodyWMitchell/insights-rbac-ui/commit/7d637b801e731a7f5a88fb97e4d9062b18412d7c))
* **konflux:** update oci-ta and rpms scan image dependencies ([#1720](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1720)) ([1b2cf81](https://github.com/CodyWMitchell/insights-rbac-ui/commit/1b2cf8171fb64ce0f3417335dbfda54b4e988973))
* lint ([516279f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/516279f3aa346dcd01d8a66cd3aa0aa15a77f04b))
* linting fixes ([9ad9656](https://github.com/CodyWMitchell/insights-rbac-ui/commit/9ad9656d308a802c9ec233239eda688c544e2a94))
* localize name filter strings ([0832973](https://github.com/CodyWMitchell/insights-rbac-ui/commit/0832973c09fe7962a3c09c638510fefb9b3b2f8c))
* memoize users row data ([60deb9b](https://github.com/CodyWMitchell/insights-rbac-ui/commit/60deb9b76285d3b6899ebe59d8d849f92ae9a384))
* **org admin:** marking user org admin with correct ID ([#1756](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1756)) ([31606bb](https://github.com/CodyWMitchell/insights-rbac-ui/commit/31606bb17750cb2bbcbd2d84a85b7ea7aa60d0fa))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1688)) ([f150391](https://github.com/CodyWMitchell/insights-rbac-ui/commit/f150391edead6b54b4c8255706024a1f09126f49))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1688)) ([2d08c25](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2d08c25204ab35488a01c1c05cb51c942f244510))
* **release:** fix release ([04b5593](https://github.com/CodyWMitchell/insights-rbac-ui/commit/04b55936a99c38324af6458877da86265185b2eb))
* remove mapStateToProps and mapDispatchToProps ([d9179d6](https://github.com/CodyWMitchell/insights-rbac-ui/commit/d9179d636346c3cbb00401820254ed00ff88de41))
* remove withRouter decorators ([5b17ed2](https://github.com/CodyWMitchell/insights-rbac-ui/commit/5b17ed29b8a56abd124257d11d62b033c930e45c))
* replace useRouteMatch with useParams ([d23a2a2](https://github.com/CodyWMitchell/insights-rbac-ui/commit/d23a2a25469e821d41ac14bb70b396f43402db53))
* update snapshots; localize string ([24a5d42](https://github.com/CodyWMitchell/insights-rbac-ui/commit/24a5d42bb235a1ddd9b3e13d486d6bd9abfbba75))
* upgrade utility classes to PF5 ([750a18a](https://github.com/CodyWMitchell/insights-rbac-ui/commit/750a18a60cdeacbee029b70ff1e7920f7b83e8f3))
* **UserAccess:** make user access cards look selected ([#1727](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1727)) ([2e58c45](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2e58c458ec9d9e529a1c953a7f8b5b941871165e))


### Features

* add create user group to user group list ([#1713](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1713)) ([6c4cd82](https://github.com/CodyWMitchell/insights-rbac-ui/commit/6c4cd824ac893aaf9b367f3a78865e2da26f3e00))
* add detailed view to Workspaces ([#1682](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1682)) ([2f1efc1](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2f1efc1fdff0cdd77972b479d3d5a12ad300c204))
* add dropdown to make user an org admin workspaces ([#1771](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1771)) ([b73a7f2](https://github.com/CodyWMitchell/insights-rbac-ui/commit/b73a7f2a3ba221cf8cf31b1b3848b0f1b9bf0f5b))
* add empty and leading states for Roles table ([#1750](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1750)) ([c0d3ef4](https://github.com/CodyWMitchell/insights-rbac-ui/commit/c0d3ef4d3227308860de2b6f97aa67972900fd2a))
* add empty state and loading state to Users & User Groups ([#1707](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1707)) ([92ea430](https://github.com/CodyWMitchell/insights-rbac-ui/commit/92ea430d3c461f11fa2428588e687fde4cab55c4))
* **build-tools:** migrate to build tools ([#1769](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1769)) ([cca1d2f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/cca1d2f8f1466217f91c5f66063fd8a6f7bbb92a))
* **codeowners:** update codeowners to experience-ui ([#1773](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1773)) ([2cf1f08](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2cf1f08977d62af8c20459dcb5d4202eee19eaa3))
* **common auth model:** add dropdown to make user an org admin ([#1740](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1740)) ([ac1b0f6](https://github.com/CodyWMitchell/insights-rbac-ui/commit/ac1b0f6fb6ed1a46c68a36177d231ade9b729a71))
* **common-auth-model:** add mocked requests ([#1695](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1695)) ([966361c](https://github.com/CodyWMitchell/insights-rbac-ui/commit/966361cb70c7bf4784d549a05d46eb43f82dfe59))
* **common-auth:** add it api to invite and edit users ([#1718](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1718)) ([0ac978c](https://github.com/CodyWMitchell/insights-rbac-ui/commit/0ac978c95903f6a1a79cd82899f15cc405e56089))
* **common-auth:** add multi-select and active toggle to Users Table ([#1764](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1764)) ([6ff9f18](https://github.com/CodyWMitchell/insights-rbac-ui/commit/6ff9f18cc7eb5274f67db781b3c6c0d068c325fb))
* create add to user group modal ([0112379](https://github.com/CodyWMitchell/insights-rbac-ui/commit/011237902147bd8f7c6e702bb58524016d353269))
* create delete user groups modal ([#1703](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1703)) ([ed28740](https://github.com/CodyWMitchell/insights-rbac-ui/commit/ed2874000ab2e090d0244865ccafe58aed2a5252))
* create edit user group page ([#1732](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1732)) ([6ee38d3](https://github.com/CodyWMitchell/insights-rbac-ui/commit/6ee38d35da0edbc97ab34126de3349db2421e7fc))
* create user details view ([53ccf7a](https://github.com/CodyWMitchell/insights-rbac-ui/commit/53ccf7a6970e48ff7881a910c69370950a433899))
* create user group page ([#1770](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1770)) ([55f911e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/55f911e3870176d663594b432d66a0dbe84ef2e7))
* enable filtering on user groups table ([8173ebb](https://github.com/CodyWMitchell/insights-rbac-ui/commit/8173ebbb23a2e56b60d91d6ebf85b0141a444d69))
* enable sorting on user groups ([d490afd](https://github.com/CodyWMitchell/insights-rbac-ui/commit/d490afd59ae115065a55126ed8d507d0a7da5bed))
* **invite-users:** add invite users modal via data driven forms ([#1706](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1706)) ([98cb047](https://github.com/CodyWMitchell/insights-rbac-ui/commit/98cb047b14ff13885d7ce2ea3f92cdccd5a7df49))
* **konflux:** enablet unit tests on Konflux ([#1656](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1656)) ([527b4d8](https://github.com/CodyWMitchell/insights-rbac-ui/commit/527b4d89273077820459004049fbd16b79e42d2b))
* **rbac:** add access-requests ([#754](https://github.com/CodyWMitchell/insights-rbac-ui/issues/754)) ([7fa22b0](https://github.com/CodyWMitchell/insights-rbac-ui/commit/7fa22b0bd7ee61f09e266e09ac2691b1f011fd2f))
* **RolesTable:** add bulk Delete Roles button ([7985c1e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/7985c1ed304bc793218635294527ed5a2cf11f4a))
* **RolesTable:** add sorting and filtering ([0558e6e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/0558e6ef4908da00ff6bc0a3a8f07305003327cf))
* **rolestable:** delete roles modal ([#1696](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1696)) ([546a465](https://github.com/CodyWMitchell/insights-rbac-ui/commit/546a465963ea395fdb9c776313687b464d92b816))
* show WS enable alert only if user can perform this action ([#1681](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1681)) ([b89b2d3](https://github.com/CodyWMitchell/insights-rbac-ui/commit/b89b2d3467f34996a36e5bd1052688fa4f021648))
* **userstable:** add delete user modal ([814f7f1](https://github.com/CodyWMitchell/insights-rbac-ui/commit/814f7f161c513f7fe3bfd95c4909f30e10c18f30))
* **Workspaces:** add ability to delete workspaces on details page ([c969f0f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/c969f0f4086a26820af2e753fdfc55c6fcb595fc))
* **workspaces:** enable overview if feature flag enabled ([#1683](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1683)) ([59fa607](https://github.com/CodyWMitchell/insights-rbac-ui/commit/59fa60744a0fe99304f4cda2795c0a2120036c49))
* **WS:** add loading and empty state to workspace list table ([#1751](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1751)) ([b2e8f1d](https://github.com/CodyWMitchell/insights-rbac-ui/commit/b2e8f1d7eade80b826dbf202b085e78c96a483fc))


### Reverts

* Revert "Do not send username when creating service account ([#1559](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1560)) ([a310c88](https://github.com/CodyWMitchell/insights-rbac-ui/commit/a310c885ab44d063e378393b75f161aa04670704))
* Revert "Revert "Do not send username when creating service account ([#1559](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1560))" ([#1561](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1561)) ([38dc92f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/38dc92fea5c5cd4db8a3dd1cbfe90cce572656a1))

# 1.0.0 (2025-03-06)


### Bug Fixes

* **admin-group:** when we don't have admin group do not break ([#1765](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1765)) ([881e1da](https://github.com/CodyWMitchell/insights-rbac-ui/commit/881e1dad988d8e624a7eb4f245ffa1e2b1a5cd66))
* **basename:** basename for workspaces is calculated incorrectly ([#1699](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1699)) ([113a38e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/113a38e4d3475e79252a0e931c203056d6e77359))
* **common-auth:** org admins in users table ([#1774](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1774)) ([32997a0](https://github.com/CodyWMitchell/insights-rbac-ui/commit/32997a0b3e37aa0f925c4877ba3030c0247aa77d))
* **common-auth:** use org ID ([#1757](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1757)) ([5ecb079](https://github.com/CodyWMitchell/insights-rbac-ui/commit/5ecb079d46538f74c10a0ad0848ab533bf0b6695))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1693)) ([1f433e9](https://github.com/CodyWMitchell/insights-rbac-ui/commit/1f433e927df2f3febc5301cedb775bdbea21caa8))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1693)) ([800fbb7](https://github.com/CodyWMitchell/insights-rbac-ui/commit/800fbb7bf3efec362ac3f08e7a690b3982f2b4c3))
* fix typo and update snapshots ([67923e9](https://github.com/CodyWMitchell/insights-rbac-ui/commit/67923e98223249eed39edcb5b4158d1a2d025d81))
* fix users-and-user-groups E2E ([14dcf89](https://github.com/CodyWMitchell/insights-rbac-ui/commit/14dcf89a4ca61c4ae99255c328a62d74bc046b88))
* hide service accounts table for default admin access ([#1709](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1709)) ([1452179](https://github.com/CodyWMitchell/insights-rbac-ui/commit/1452179da1a55c17c486aed55d23e3a1a7e48285))
* **invite:** by adding locale ([#1759](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1759)) ([c11e179](https://github.com/CodyWMitchell/insights-rbac-ui/commit/c11e179995b5476b5a8730c80bb1866a20aaa8ba))
* issues with merge commit ([84917d3](https://github.com/CodyWMitchell/insights-rbac-ui/commit/84917d3caab81a7970f80f148d3f9252582eb746))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1691)) ([81d51ff](https://github.com/CodyWMitchell/insights-rbac-ui/commit/81d51fffbabaf08a4fa3a7461d0bba31407d892d))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1691)) ([981c7ce](https://github.com/CodyWMitchell/insights-rbac-ui/commit/981c7ceae4bc46143f703f666484e2cea4338469))
* **konflux:** failing konflux build by removing JAVA references ([#1743](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1743)) ([76bc417](https://github.com/CodyWMitchell/insights-rbac-ui/commit/76bc4171ac08ab2ecbae61b52634ce868c7d2c97))
* **konflux:** remove duplicate name of task ([#1723](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1723)) ([991729a](https://github.com/CodyWMitchell/insights-rbac-ui/commit/991729a25b0121bda9802c762cb707e3a4757aa2))
* **konflux:** remove sbom json check ([#1722](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1722)) ([9fe1bce](https://github.com/CodyWMitchell/insights-rbac-ui/commit/9fe1bcefd693fa180631164c10c9bd28f51d91d3))
* **konflux:** update buildah image sha ([#1719](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1719)) ([7d637b8](https://github.com/CodyWMitchell/insights-rbac-ui/commit/7d637b801e731a7f5a88fb97e4d9062b18412d7c))
* **konflux:** update oci-ta and rpms scan image dependencies ([#1720](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1720)) ([1b2cf81](https://github.com/CodyWMitchell/insights-rbac-ui/commit/1b2cf8171fb64ce0f3417335dbfda54b4e988973))
* lint ([516279f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/516279f3aa346dcd01d8a66cd3aa0aa15a77f04b))
* localize name filter strings ([0832973](https://github.com/CodyWMitchell/insights-rbac-ui/commit/0832973c09fe7962a3c09c638510fefb9b3b2f8c))
* memoize users row data ([60deb9b](https://github.com/CodyWMitchell/insights-rbac-ui/commit/60deb9b76285d3b6899ebe59d8d849f92ae9a384))
* **org admin:** marking user org admin with correct ID ([#1756](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1756)) ([31606bb](https://github.com/CodyWMitchell/insights-rbac-ui/commit/31606bb17750cb2bbcbd2d84a85b7ea7aa60d0fa))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1688)) ([f150391](https://github.com/CodyWMitchell/insights-rbac-ui/commit/f150391edead6b54b4c8255706024a1f09126f49))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1688)) ([2d08c25](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2d08c25204ab35488a01c1c05cb51c942f244510))
* **release:** fix release ([04b5593](https://github.com/CodyWMitchell/insights-rbac-ui/commit/04b55936a99c38324af6458877da86265185b2eb))
* remove mapStateToProps and mapDispatchToProps ([d9179d6](https://github.com/CodyWMitchell/insights-rbac-ui/commit/d9179d636346c3cbb00401820254ed00ff88de41))
* remove withRouter decorators ([5b17ed2](https://github.com/CodyWMitchell/insights-rbac-ui/commit/5b17ed29b8a56abd124257d11d62b033c930e45c))
* replace useRouteMatch with useParams ([d23a2a2](https://github.com/CodyWMitchell/insights-rbac-ui/commit/d23a2a25469e821d41ac14bb70b396f43402db53))
* update snapshots; localize string ([24a5d42](https://github.com/CodyWMitchell/insights-rbac-ui/commit/24a5d42bb235a1ddd9b3e13d486d6bd9abfbba75))
* upgrade utility classes to PF5 ([750a18a](https://github.com/CodyWMitchell/insights-rbac-ui/commit/750a18a60cdeacbee029b70ff1e7920f7b83e8f3))
* **UserAccess:** make user access cards look selected ([#1727](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1727)) ([2e58c45](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2e58c458ec9d9e529a1c953a7f8b5b941871165e))


### Features

* add create user group to user group list ([#1713](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1713)) ([6c4cd82](https://github.com/CodyWMitchell/insights-rbac-ui/commit/6c4cd824ac893aaf9b367f3a78865e2da26f3e00))
* add detailed view to Workspaces ([#1682](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1682)) ([2f1efc1](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2f1efc1fdff0cdd77972b479d3d5a12ad300c204))
* add dropdown to make user an org admin workspaces ([#1771](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1771)) ([b73a7f2](https://github.com/CodyWMitchell/insights-rbac-ui/commit/b73a7f2a3ba221cf8cf31b1b3848b0f1b9bf0f5b))
* add empty and leading states for Roles table ([#1750](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1750)) ([c0d3ef4](https://github.com/CodyWMitchell/insights-rbac-ui/commit/c0d3ef4d3227308860de2b6f97aa67972900fd2a))
* add empty state and loading state to Users & User Groups ([#1707](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1707)) ([92ea430](https://github.com/CodyWMitchell/insights-rbac-ui/commit/92ea430d3c461f11fa2428588e687fde4cab55c4))
* **build-tools:** migrate to build tools ([#1769](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1769)) ([cca1d2f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/cca1d2f8f1466217f91c5f66063fd8a6f7bbb92a))
* **codeowners:** update codeowners to experience-ui ([#1773](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1773)) ([2cf1f08](https://github.com/CodyWMitchell/insights-rbac-ui/commit/2cf1f08977d62af8c20459dcb5d4202eee19eaa3))
* **common auth model:** add dropdown to make user an org admin ([#1740](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1740)) ([ac1b0f6](https://github.com/CodyWMitchell/insights-rbac-ui/commit/ac1b0f6fb6ed1a46c68a36177d231ade9b729a71))
* **common-auth-model:** add mocked requests ([#1695](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1695)) ([966361c](https://github.com/CodyWMitchell/insights-rbac-ui/commit/966361cb70c7bf4784d549a05d46eb43f82dfe59))
* **common-auth:** add it api to invite and edit users ([#1718](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1718)) ([0ac978c](https://github.com/CodyWMitchell/insights-rbac-ui/commit/0ac978c95903f6a1a79cd82899f15cc405e56089))
* **common-auth:** add multi-select and active toggle to Users Table ([#1764](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1764)) ([6ff9f18](https://github.com/CodyWMitchell/insights-rbac-ui/commit/6ff9f18cc7eb5274f67db781b3c6c0d068c325fb))
* create add to user group modal ([0112379](https://github.com/CodyWMitchell/insights-rbac-ui/commit/011237902147bd8f7c6e702bb58524016d353269))
* create delete user groups modal ([#1703](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1703)) ([ed28740](https://github.com/CodyWMitchell/insights-rbac-ui/commit/ed2874000ab2e090d0244865ccafe58aed2a5252))
* create edit user group page ([#1732](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1732)) ([6ee38d3](https://github.com/CodyWMitchell/insights-rbac-ui/commit/6ee38d35da0edbc97ab34126de3349db2421e7fc))
* create user details view ([53ccf7a](https://github.com/CodyWMitchell/insights-rbac-ui/commit/53ccf7a6970e48ff7881a910c69370950a433899))
* create user group page ([#1770](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1770)) ([55f911e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/55f911e3870176d663594b432d66a0dbe84ef2e7))
* enable sorting on user groups ([d490afd](https://github.com/CodyWMitchell/insights-rbac-ui/commit/d490afd59ae115065a55126ed8d507d0a7da5bed))
* **invite-users:** add invite users modal via data driven forms ([#1706](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1706)) ([98cb047](https://github.com/CodyWMitchell/insights-rbac-ui/commit/98cb047b14ff13885d7ce2ea3f92cdccd5a7df49))
* **konflux:** enablet unit tests on Konflux ([#1656](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1656)) ([527b4d8](https://github.com/CodyWMitchell/insights-rbac-ui/commit/527b4d89273077820459004049fbd16b79e42d2b))
* **rbac:** add access-requests ([#754](https://github.com/CodyWMitchell/insights-rbac-ui/issues/754)) ([7fa22b0](https://github.com/CodyWMitchell/insights-rbac-ui/commit/7fa22b0bd7ee61f09e266e09ac2691b1f011fd2f))
* **RolesTable:** add bulk Delete Roles button ([7985c1e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/7985c1ed304bc793218635294527ed5a2cf11f4a))
* **RolesTable:** add sorting and filtering ([0558e6e](https://github.com/CodyWMitchell/insights-rbac-ui/commit/0558e6ef4908da00ff6bc0a3a8f07305003327cf))
* **rolestable:** delete roles modal ([#1696](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1696)) ([546a465](https://github.com/CodyWMitchell/insights-rbac-ui/commit/546a465963ea395fdb9c776313687b464d92b816))
* show WS enable alert only if user can perform this action ([#1681](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1681)) ([b89b2d3](https://github.com/CodyWMitchell/insights-rbac-ui/commit/b89b2d3467f34996a36e5bd1052688fa4f021648))
* **userstable:** add delete user modal ([814f7f1](https://github.com/CodyWMitchell/insights-rbac-ui/commit/814f7f161c513f7fe3bfd95c4909f30e10c18f30))
* **Workspaces:** add ability to delete workspaces on details page ([c969f0f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/c969f0f4086a26820af2e753fdfc55c6fcb595fc))
* **workspaces:** enable overview if feature flag enabled ([#1683](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1683)) ([59fa607](https://github.com/CodyWMitchell/insights-rbac-ui/commit/59fa60744a0fe99304f4cda2795c0a2120036c49))
* **WS:** add loading and empty state to workspace list table ([#1751](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1751)) ([b2e8f1d](https://github.com/CodyWMitchell/insights-rbac-ui/commit/b2e8f1d7eade80b826dbf202b085e78c96a483fc))


### Reverts

* Revert "Do not send username when creating service account ([#1559](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1560)) ([a310c88](https://github.com/CodyWMitchell/insights-rbac-ui/commit/a310c885ab44d063e378393b75f161aa04670704))
* Revert "Revert "Do not send username when creating service account ([#1559](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1560))" ([#1561](https://github.com/CodyWMitchell/insights-rbac-ui/issues/1561)) ([38dc92f](https://github.com/CodyWMitchell/insights-rbac-ui/commit/38dc92fea5c5cd4db8a3dd1cbfe90cce572656a1))

# [1.25.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.24.1...v1.25.0) (2025-03-05)


### Features

* add dropdown to make user an org admin workspaces ([#1771](https://github.com/RedHatInsights/insights-rbac-ui/issues/1771)) ([b73a7f2](https://github.com/RedHatInsights/insights-rbac-ui/commit/b73a7f2a3ba221cf8cf31b1b3848b0f1b9bf0f5b))

## [1.24.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.24.0...v1.24.1) (2025-03-04)


### Bug Fixes

* **common-auth:** org admins in users table ([#1774](https://github.com/RedHatInsights/insights-rbac-ui/issues/1774)) ([32997a0](https://github.com/RedHatInsights/insights-rbac-ui/commit/32997a0b3e37aa0f925c4877ba3030c0247aa77d))

# [1.24.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.23.0...v1.24.0) (2025-03-04)


### Features

* **common-auth:** add multi-select and active toggle to Users Table ([#1764](https://github.com/RedHatInsights/insights-rbac-ui/issues/1764)) ([6ff9f18](https://github.com/RedHatInsights/insights-rbac-ui/commit/6ff9f18cc7eb5274f67db781b3c6c0d068c325fb))

# [1.23.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.22.0...v1.23.0) (2025-03-04)


### Features

* **codeowners:** update codeowners to experience-ui ([#1773](https://github.com/RedHatInsights/insights-rbac-ui/issues/1773)) ([2cf1f08](https://github.com/RedHatInsights/insights-rbac-ui/commit/2cf1f08977d62af8c20459dcb5d4202eee19eaa3))

# [1.22.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.21.0...v1.22.0) (2025-02-28)


### Features

* create user group page ([#1770](https://github.com/RedHatInsights/insights-rbac-ui/issues/1770)) ([55f911e](https://github.com/RedHatInsights/insights-rbac-ui/commit/55f911e3870176d663594b432d66a0dbe84ef2e7))

# [1.21.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.20.4...v1.21.0) (2025-02-26)


### Features

* **build-tools:** migrate to build tools ([#1769](https://github.com/RedHatInsights/insights-rbac-ui/issues/1769)) ([cca1d2f](https://github.com/RedHatInsights/insights-rbac-ui/commit/cca1d2f8f1466217f91c5f66063fd8a6f7bbb92a))

## [1.20.4](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.20.3...v1.20.4) (2025-02-20)


### Bug Fixes

* **admin-group:** when we don't have admin group do not break ([#1765](https://github.com/RedHatInsights/insights-rbac-ui/issues/1765)) ([881e1da](https://github.com/RedHatInsights/insights-rbac-ui/commit/881e1dad988d8e624a7eb4f245ffa1e2b1a5cd66))

## [1.20.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.20.2...v1.20.3) (2025-02-14)


### Bug Fixes

* **invite:** by adding locale ([#1759](https://github.com/RedHatInsights/insights-rbac-ui/issues/1759)) ([c11e179](https://github.com/RedHatInsights/insights-rbac-ui/commit/c11e179995b5476b5a8730c80bb1866a20aaa8ba))

## [1.20.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.20.1...v1.20.2) (2025-02-11)


### Bug Fixes

* **common-auth:** use org ID ([#1757](https://github.com/RedHatInsights/insights-rbac-ui/issues/1757)) ([5ecb079](https://github.com/RedHatInsights/insights-rbac-ui/commit/5ecb079d46538f74c10a0ad0848ab533bf0b6695))

## [1.20.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.20.0...v1.20.1) (2025-02-11)


### Bug Fixes

* **org admin:** marking user org admin with correct ID ([#1756](https://github.com/RedHatInsights/insights-rbac-ui/issues/1756)) ([31606bb](https://github.com/RedHatInsights/insights-rbac-ui/commit/31606bb17750cb2bbcbd2d84a85b7ea7aa60d0fa))

# [1.20.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.19.0...v1.20.0) (2025-02-10)


### Features

* **Workspaces:** add ability to delete workspaces on details page ([c969f0f](https://github.com/RedHatInsights/insights-rbac-ui/commit/c969f0f4086a26820af2e753fdfc55c6fcb595fc))

# 1.0.0 (2025-02-05)


### Bug Fixes

* **basename:** basename for workspaces is calculated incorrectly ([#1699](https://github.com/aferd/insights-rbac-ui/issues/1699)) ([113a38e](https://github.com/aferd/insights-rbac-ui/commit/113a38e4d3475e79252a0e931c203056d6e77359))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/aferd/insights-rbac-ui/issues/1693)) ([1f433e9](https://github.com/aferd/insights-rbac-ui/commit/1f433e927df2f3febc5301cedb775bdbea21caa8))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/aferd/insights-rbac-ui/issues/1693)) ([800fbb7](https://github.com/aferd/insights-rbac-ui/commit/800fbb7bf3efec362ac3f08e7a690b3982f2b4c3))
* fix typo and update snapshots ([67923e9](https://github.com/aferd/insights-rbac-ui/commit/67923e98223249eed39edcb5b4158d1a2d025d81))
* fix users-and-user-groups E2E ([14dcf89](https://github.com/aferd/insights-rbac-ui/commit/14dcf89a4ca61c4ae99255c328a62d74bc046b88))
* hide service accounts table for default admin access ([#1709](https://github.com/aferd/insights-rbac-ui/issues/1709)) ([1452179](https://github.com/aferd/insights-rbac-ui/commit/1452179da1a55c17c486aed55d23e3a1a7e48285))
* issues with merge commit ([84917d3](https://github.com/aferd/insights-rbac-ui/commit/84917d3caab81a7970f80f148d3f9252582eb746))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/aferd/insights-rbac-ui/issues/1691)) ([81d51ff](https://github.com/aferd/insights-rbac-ui/commit/81d51fffbabaf08a4fa3a7461d0bba31407d892d))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/aferd/insights-rbac-ui/issues/1691)) ([981c7ce](https://github.com/aferd/insights-rbac-ui/commit/981c7ceae4bc46143f703f666484e2cea4338469))
* **konflux:** failing konflux build by removing JAVA references ([#1743](https://github.com/aferd/insights-rbac-ui/issues/1743)) ([76bc417](https://github.com/aferd/insights-rbac-ui/commit/76bc4171ac08ab2ecbae61b52634ce868c7d2c97))
* **konflux:** remove duplicate name of task ([#1723](https://github.com/aferd/insights-rbac-ui/issues/1723)) ([991729a](https://github.com/aferd/insights-rbac-ui/commit/991729a25b0121bda9802c762cb707e3a4757aa2))
* **konflux:** remove sbom json check ([#1722](https://github.com/aferd/insights-rbac-ui/issues/1722)) ([9fe1bce](https://github.com/aferd/insights-rbac-ui/commit/9fe1bcefd693fa180631164c10c9bd28f51d91d3))
* **konflux:** update buildah image sha ([#1719](https://github.com/aferd/insights-rbac-ui/issues/1719)) ([7d637b8](https://github.com/aferd/insights-rbac-ui/commit/7d637b801e731a7f5a88fb97e4d9062b18412d7c))
* **konflux:** update oci-ta and rpms scan image dependencies ([#1720](https://github.com/aferd/insights-rbac-ui/issues/1720)) ([1b2cf81](https://github.com/aferd/insights-rbac-ui/commit/1b2cf8171fb64ce0f3417335dbfda54b4e988973))
* lint ([516279f](https://github.com/aferd/insights-rbac-ui/commit/516279f3aa346dcd01d8a66cd3aa0aa15a77f04b))
* localize name filter strings ([0832973](https://github.com/aferd/insights-rbac-ui/commit/0832973c09fe7962a3c09c638510fefb9b3b2f8c))
* memoize users row data ([60deb9b](https://github.com/aferd/insights-rbac-ui/commit/60deb9b76285d3b6899ebe59d8d849f92ae9a384))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/aferd/insights-rbac-ui/issues/1688)) ([f150391](https://github.com/aferd/insights-rbac-ui/commit/f150391edead6b54b4c8255706024a1f09126f49))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/aferd/insights-rbac-ui/issues/1688)) ([2d08c25](https://github.com/aferd/insights-rbac-ui/commit/2d08c25204ab35488a01c1c05cb51c942f244510))
* **release:** fix release ([04b5593](https://github.com/aferd/insights-rbac-ui/commit/04b55936a99c38324af6458877da86265185b2eb))
* remove mapStateToProps and mapDispatchToProps ([d9179d6](https://github.com/aferd/insights-rbac-ui/commit/d9179d636346c3cbb00401820254ed00ff88de41))
* remove withRouter decorators ([5b17ed2](https://github.com/aferd/insights-rbac-ui/commit/5b17ed29b8a56abd124257d11d62b033c930e45c))
* replace useRouteMatch with useParams ([d23a2a2](https://github.com/aferd/insights-rbac-ui/commit/d23a2a25469e821d41ac14bb70b396f43402db53))
* update snapshots; localize string ([24a5d42](https://github.com/aferd/insights-rbac-ui/commit/24a5d42bb235a1ddd9b3e13d486d6bd9abfbba75))
* upgrade utility classes to PF5 ([750a18a](https://github.com/aferd/insights-rbac-ui/commit/750a18a60cdeacbee029b70ff1e7920f7b83e8f3))
* **UserAccess:** make user access cards look selected ([#1727](https://github.com/aferd/insights-rbac-ui/issues/1727)) ([2e58c45](https://github.com/aferd/insights-rbac-ui/commit/2e58c458ec9d9e529a1c953a7f8b5b941871165e))


### Features

* add create user group to user group list ([#1713](https://github.com/aferd/insights-rbac-ui/issues/1713)) ([6c4cd82](https://github.com/aferd/insights-rbac-ui/commit/6c4cd824ac893aaf9b367f3a78865e2da26f3e00))
* add detailed view to Workspaces ([#1682](https://github.com/aferd/insights-rbac-ui/issues/1682)) ([2f1efc1](https://github.com/aferd/insights-rbac-ui/commit/2f1efc1fdff0cdd77972b479d3d5a12ad300c204))
* add empty and leading states for Roles table ([#1750](https://github.com/aferd/insights-rbac-ui/issues/1750)) ([c0d3ef4](https://github.com/aferd/insights-rbac-ui/commit/c0d3ef4d3227308860de2b6f97aa67972900fd2a))
* add empty state and loading state to Users & User Groups ([#1707](https://github.com/aferd/insights-rbac-ui/issues/1707)) ([92ea430](https://github.com/aferd/insights-rbac-ui/commit/92ea430d3c461f11fa2428588e687fde4cab55c4))
* **common auth model:** add dropdown to make user an org admin ([#1740](https://github.com/aferd/insights-rbac-ui/issues/1740)) ([ac1b0f6](https://github.com/aferd/insights-rbac-ui/commit/ac1b0f6fb6ed1a46c68a36177d231ade9b729a71))
* **common-auth-model:** add mocked requests ([#1695](https://github.com/aferd/insights-rbac-ui/issues/1695)) ([966361c](https://github.com/aferd/insights-rbac-ui/commit/966361cb70c7bf4784d549a05d46eb43f82dfe59))
* **common-auth:** add it api to invite and edit users ([#1718](https://github.com/aferd/insights-rbac-ui/issues/1718)) ([0ac978c](https://github.com/aferd/insights-rbac-ui/commit/0ac978c95903f6a1a79cd82899f15cc405e56089))
* create add to user group modal ([0112379](https://github.com/aferd/insights-rbac-ui/commit/011237902147bd8f7c6e702bb58524016d353269))
* create delete user groups modal ([#1703](https://github.com/aferd/insights-rbac-ui/issues/1703)) ([ed28740](https://github.com/aferd/insights-rbac-ui/commit/ed2874000ab2e090d0244865ccafe58aed2a5252))
* create edit user group page ([#1732](https://github.com/aferd/insights-rbac-ui/issues/1732)) ([6ee38d3](https://github.com/aferd/insights-rbac-ui/commit/6ee38d35da0edbc97ab34126de3349db2421e7fc))
* create user details view ([53ccf7a](https://github.com/aferd/insights-rbac-ui/commit/53ccf7a6970e48ff7881a910c69370950a433899))
* **invite-users:** add invite users modal via data driven forms ([#1706](https://github.com/aferd/insights-rbac-ui/issues/1706)) ([98cb047](https://github.com/aferd/insights-rbac-ui/commit/98cb047b14ff13885d7ce2ea3f92cdccd5a7df49))
* **konflux:** enablet unit tests on Konflux ([#1656](https://github.com/aferd/insights-rbac-ui/issues/1656)) ([527b4d8](https://github.com/aferd/insights-rbac-ui/commit/527b4d89273077820459004049fbd16b79e42d2b))
* **rbac:** add access-requests ([#754](https://github.com/aferd/insights-rbac-ui/issues/754)) ([7fa22b0](https://github.com/aferd/insights-rbac-ui/commit/7fa22b0bd7ee61f09e266e09ac2691b1f011fd2f))
* **RolesTable:** add bulk Delete Roles button ([7985c1e](https://github.com/aferd/insights-rbac-ui/commit/7985c1ed304bc793218635294527ed5a2cf11f4a))
* **RolesTable:** add sorting and filtering ([0558e6e](https://github.com/aferd/insights-rbac-ui/commit/0558e6ef4908da00ff6bc0a3a8f07305003327cf))
* **rolestable:** delete roles modal ([#1696](https://github.com/aferd/insights-rbac-ui/issues/1696)) ([546a465](https://github.com/aferd/insights-rbac-ui/commit/546a465963ea395fdb9c776313687b464d92b816))
* show WS enable alert only if user can perform this action ([#1681](https://github.com/aferd/insights-rbac-ui/issues/1681)) ([b89b2d3](https://github.com/aferd/insights-rbac-ui/commit/b89b2d3467f34996a36e5bd1052688fa4f021648))
* **userstable:** add delete user modal ([814f7f1](https://github.com/aferd/insights-rbac-ui/commit/814f7f161c513f7fe3bfd95c4909f30e10c18f30))
* **workspaces:** enable overview if feature flag enabled ([#1683](https://github.com/aferd/insights-rbac-ui/issues/1683)) ([59fa607](https://github.com/aferd/insights-rbac-ui/commit/59fa60744a0fe99304f4cda2795c0a2120036c49))
* **WS:** add loading and empty state to workspace list table ([#1751](https://github.com/aferd/insights-rbac-ui/issues/1751)) ([b2e8f1d](https://github.com/aferd/insights-rbac-ui/commit/b2e8f1d7eade80b826dbf202b085e78c96a483fc))


### Reverts

* Revert "Do not send username when creating service account ([#1559](https://github.com/aferd/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/aferd/insights-rbac-ui/issues/1560)) ([a310c88](https://github.com/aferd/insights-rbac-ui/commit/a310c885ab44d063e378393b75f161aa04670704))
* Revert "Revert "Do not send username when creating service account ([#1559](https://github.com/aferd/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/aferd/insights-rbac-ui/issues/1560))" ([#1561](https://github.com/aferd/insights-rbac-ui/issues/1561)) ([38dc92f](https://github.com/aferd/insights-rbac-ui/commit/38dc92fea5c5cd4db8a3dd1cbfe90cce572656a1))

# [1.19.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.18.0...v1.19.0) (2025-01-31)


### Features

* **WS:** add loading and empty state to workspace list table ([#1751](https://github.com/RedHatInsights/insights-rbac-ui/issues/1751)) ([b2e8f1d](https://github.com/RedHatInsights/insights-rbac-ui/commit/b2e8f1d7eade80b826dbf202b085e78c96a483fc))

# [1.18.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.17.0...v1.18.0) (2025-01-29)


### Features

* add empty and leading states for Roles table ([#1750](https://github.com/RedHatInsights/insights-rbac-ui/issues/1750)) ([c0d3ef4](https://github.com/RedHatInsights/insights-rbac-ui/commit/c0d3ef4d3227308860de2b6f97aa67972900fd2a))
* create edit user group page ([#1732](https://github.com/RedHatInsights/insights-rbac-ui/issues/1732)) ([6ee38d3](https://github.com/RedHatInsights/insights-rbac-ui/commit/6ee38d35da0edbc97ab34126de3349db2421e7fc))

# [1.17.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.16.2...v1.17.0) (2025-01-15)


### Features

* **common auth model:** add dropdown to make user an org admin ([#1740](https://github.com/RedHatInsights/insights-rbac-ui/issues/1740)) ([ac1b0f6](https://github.com/RedHatInsights/insights-rbac-ui/commit/ac1b0f6fb6ed1a46c68a36177d231ade9b729a71))

## [1.16.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.16.1...v1.16.2) (2025-01-14)


### Bug Fixes

* **konflux:** failing konflux build by removing JAVA references ([#1743](https://github.com/RedHatInsights/insights-rbac-ui/issues/1743)) ([76bc417](https://github.com/RedHatInsights/insights-rbac-ui/commit/76bc4171ac08ab2ecbae61b52634ce868c7d2c97))

## [1.16.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.16.0...v1.16.1) (2025-01-06)


### Bug Fixes

* fix users-and-user-groups E2E ([14dcf89](https://github.com/RedHatInsights/insights-rbac-ui/commit/14dcf89a4ca61c4ae99255c328a62d74bc046b88))

# 1.0.0 (2025-01-06)


### Bug Fixes

* **basename:** basename for workspaces is calculated incorrectly ([#1699](https://github.com/fhlavac/insights-rbac-ui/issues/1699)) ([113a38e](https://github.com/fhlavac/insights-rbac-ui/commit/113a38e4d3475e79252a0e931c203056d6e77359))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/fhlavac/insights-rbac-ui/issues/1693)) ([1f433e9](https://github.com/fhlavac/insights-rbac-ui/commit/1f433e927df2f3febc5301cedb775bdbea21caa8))
* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/fhlavac/insights-rbac-ui/issues/1693)) ([800fbb7](https://github.com/fhlavac/insights-rbac-ui/commit/800fbb7bf3efec362ac3f08e7a690b3982f2b4c3))
* fix typo and update snapshots ([67923e9](https://github.com/fhlavac/insights-rbac-ui/commit/67923e98223249eed39edcb5b4158d1a2d025d81))
* fix users-and-user-groups E2E ([14dcf89](https://github.com/fhlavac/insights-rbac-ui/commit/14dcf89a4ca61c4ae99255c328a62d74bc046b88))
* hide service accounts table for default admin access ([#1709](https://github.com/fhlavac/insights-rbac-ui/issues/1709)) ([1452179](https://github.com/fhlavac/insights-rbac-ui/commit/1452179da1a55c17c486aed55d23e3a1a7e48285))
* issues with merge commit ([84917d3](https://github.com/fhlavac/insights-rbac-ui/commit/84917d3caab81a7970f80f148d3f9252582eb746))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/fhlavac/insights-rbac-ui/issues/1691)) ([81d51ff](https://github.com/fhlavac/insights-rbac-ui/commit/81d51fffbabaf08a4fa3a7461d0bba31407d892d))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/fhlavac/insights-rbac-ui/issues/1691)) ([981c7ce](https://github.com/fhlavac/insights-rbac-ui/commit/981c7ceae4bc46143f703f666484e2cea4338469))
* **konflux:** remove duplicate name of task ([#1723](https://github.com/fhlavac/insights-rbac-ui/issues/1723)) ([991729a](https://github.com/fhlavac/insights-rbac-ui/commit/991729a25b0121bda9802c762cb707e3a4757aa2))
* **konflux:** remove sbom json check ([#1722](https://github.com/fhlavac/insights-rbac-ui/issues/1722)) ([9fe1bce](https://github.com/fhlavac/insights-rbac-ui/commit/9fe1bcefd693fa180631164c10c9bd28f51d91d3))
* **konflux:** update buildah image sha ([#1719](https://github.com/fhlavac/insights-rbac-ui/issues/1719)) ([7d637b8](https://github.com/fhlavac/insights-rbac-ui/commit/7d637b801e731a7f5a88fb97e4d9062b18412d7c))
* **konflux:** update oci-ta and rpms scan image dependencies ([#1720](https://github.com/fhlavac/insights-rbac-ui/issues/1720)) ([1b2cf81](https://github.com/fhlavac/insights-rbac-ui/commit/1b2cf8171fb64ce0f3417335dbfda54b4e988973))
* lint ([516279f](https://github.com/fhlavac/insights-rbac-ui/commit/516279f3aa346dcd01d8a66cd3aa0aa15a77f04b))
* localize name filter strings ([0832973](https://github.com/fhlavac/insights-rbac-ui/commit/0832973c09fe7962a3c09c638510fefb9b3b2f8c))
* memoize users row data ([60deb9b](https://github.com/fhlavac/insights-rbac-ui/commit/60deb9b76285d3b6899ebe59d8d849f92ae9a384))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/fhlavac/insights-rbac-ui/issues/1688)) ([f150391](https://github.com/fhlavac/insights-rbac-ui/commit/f150391edead6b54b4c8255706024a1f09126f49))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/fhlavac/insights-rbac-ui/issues/1688)) ([2d08c25](https://github.com/fhlavac/insights-rbac-ui/commit/2d08c25204ab35488a01c1c05cb51c942f244510))
* **release:** fix release ([04b5593](https://github.com/fhlavac/insights-rbac-ui/commit/04b55936a99c38324af6458877da86265185b2eb))
* remove mapStateToProps and mapDispatchToProps ([d9179d6](https://github.com/fhlavac/insights-rbac-ui/commit/d9179d636346c3cbb00401820254ed00ff88de41))
* remove withRouter decorators ([5b17ed2](https://github.com/fhlavac/insights-rbac-ui/commit/5b17ed29b8a56abd124257d11d62b033c930e45c))
* replace useRouteMatch with useParams ([d23a2a2](https://github.com/fhlavac/insights-rbac-ui/commit/d23a2a25469e821d41ac14bb70b396f43402db53))
* update snapshots; localize string ([24a5d42](https://github.com/fhlavac/insights-rbac-ui/commit/24a5d42bb235a1ddd9b3e13d486d6bd9abfbba75))
* upgrade utility classes to PF5 ([750a18a](https://github.com/fhlavac/insights-rbac-ui/commit/750a18a60cdeacbee029b70ff1e7920f7b83e8f3))
* **UserAccess:** make user access cards look selected ([#1727](https://github.com/fhlavac/insights-rbac-ui/issues/1727)) ([2e58c45](https://github.com/fhlavac/insights-rbac-ui/commit/2e58c458ec9d9e529a1c953a7f8b5b941871165e))


### Features

* add create user group to user group list ([#1713](https://github.com/fhlavac/insights-rbac-ui/issues/1713)) ([6c4cd82](https://github.com/fhlavac/insights-rbac-ui/commit/6c4cd824ac893aaf9b367f3a78865e2da26f3e00))
* add detailed view to Workspaces ([#1682](https://github.com/fhlavac/insights-rbac-ui/issues/1682)) ([2f1efc1](https://github.com/fhlavac/insights-rbac-ui/commit/2f1efc1fdff0cdd77972b479d3d5a12ad300c204))
* add empty state and loading state to Users & User Groups ([#1707](https://github.com/fhlavac/insights-rbac-ui/issues/1707)) ([92ea430](https://github.com/fhlavac/insights-rbac-ui/commit/92ea430d3c461f11fa2428588e687fde4cab55c4))
* **common-auth-model:** add mocked requests ([#1695](https://github.com/fhlavac/insights-rbac-ui/issues/1695)) ([966361c](https://github.com/fhlavac/insights-rbac-ui/commit/966361cb70c7bf4784d549a05d46eb43f82dfe59))
* **common-auth:** add it api to invite and edit users ([#1718](https://github.com/fhlavac/insights-rbac-ui/issues/1718)) ([0ac978c](https://github.com/fhlavac/insights-rbac-ui/commit/0ac978c95903f6a1a79cd82899f15cc405e56089))
* create add to user group modal ([0112379](https://github.com/fhlavac/insights-rbac-ui/commit/011237902147bd8f7c6e702bb58524016d353269))
* create delete user groups modal ([#1703](https://github.com/fhlavac/insights-rbac-ui/issues/1703)) ([ed28740](https://github.com/fhlavac/insights-rbac-ui/commit/ed2874000ab2e090d0244865ccafe58aed2a5252))
* create user details view ([53ccf7a](https://github.com/fhlavac/insights-rbac-ui/commit/53ccf7a6970e48ff7881a910c69370950a433899))
* **invite-users:** add invite users modal via data driven forms ([#1706](https://github.com/fhlavac/insights-rbac-ui/issues/1706)) ([98cb047](https://github.com/fhlavac/insights-rbac-ui/commit/98cb047b14ff13885d7ce2ea3f92cdccd5a7df49))
* **konflux:** enablet unit tests on Konflux ([#1656](https://github.com/fhlavac/insights-rbac-ui/issues/1656)) ([527b4d8](https://github.com/fhlavac/insights-rbac-ui/commit/527b4d89273077820459004049fbd16b79e42d2b))
* **rbac:** add access-requests ([#754](https://github.com/fhlavac/insights-rbac-ui/issues/754)) ([7fa22b0](https://github.com/fhlavac/insights-rbac-ui/commit/7fa22b0bd7ee61f09e266e09ac2691b1f011fd2f))
* **RolesTable:** add bulk Delete Roles button ([7985c1e](https://github.com/fhlavac/insights-rbac-ui/commit/7985c1ed304bc793218635294527ed5a2cf11f4a))
* **RolesTable:** add sorting and filtering ([0558e6e](https://github.com/fhlavac/insights-rbac-ui/commit/0558e6ef4908da00ff6bc0a3a8f07305003327cf))
* **rolestable:** delete roles modal ([#1696](https://github.com/fhlavac/insights-rbac-ui/issues/1696)) ([546a465](https://github.com/fhlavac/insights-rbac-ui/commit/546a465963ea395fdb9c776313687b464d92b816))
* show WS enable alert only if user can perform this action ([#1681](https://github.com/fhlavac/insights-rbac-ui/issues/1681)) ([b89b2d3](https://github.com/fhlavac/insights-rbac-ui/commit/b89b2d3467f34996a36e5bd1052688fa4f021648))
* **userstable:** add delete user modal ([814f7f1](https://github.com/fhlavac/insights-rbac-ui/commit/814f7f161c513f7fe3bfd95c4909f30e10c18f30))
* **workspaces:** enable overview if feature flag enabled ([#1683](https://github.com/fhlavac/insights-rbac-ui/issues/1683)) ([59fa607](https://github.com/fhlavac/insights-rbac-ui/commit/59fa60744a0fe99304f4cda2795c0a2120036c49))


### Reverts

* Revert "Do not send username when creating service account ([#1559](https://github.com/fhlavac/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/fhlavac/insights-rbac-ui/issues/1560)) ([a310c88](https://github.com/fhlavac/insights-rbac-ui/commit/a310c885ab44d063e378393b75f161aa04670704))
* Revert "Revert "Do not send username when creating service account ([#1559](https://github.com/fhlavac/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/fhlavac/insights-rbac-ui/issues/1560))" ([#1561](https://github.com/fhlavac/insights-rbac-ui/issues/1561)) ([38dc92f](https://github.com/fhlavac/insights-rbac-ui/commit/38dc92fea5c5cd4db8a3dd1cbfe90cce572656a1))

# [1.16.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.15.6...v1.16.0) (2025-01-02)


### Bug Fixes

* lint ([516279f](https://github.com/RedHatInsights/insights-rbac-ui/commit/516279f3aa346dcd01d8a66cd3aa0aa15a77f04b))
* localize name filter strings ([0832973](https://github.com/RedHatInsights/insights-rbac-ui/commit/0832973c09fe7962a3c09c638510fefb9b3b2f8c))


### Features

* **RolesTable:** add sorting and filtering ([0558e6e](https://github.com/RedHatInsights/insights-rbac-ui/commit/0558e6ef4908da00ff6bc0a3a8f07305003327cf))

## [1.15.6](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.15.5...v1.15.6) (2024-12-13)


### Bug Fixes

* **UserAccess:** make user access cards look selected ([#1727](https://github.com/RedHatInsights/insights-rbac-ui/issues/1727)) ([2e58c45](https://github.com/RedHatInsights/insights-rbac-ui/commit/2e58c458ec9d9e529a1c953a7f8b5b941871165e))

## [1.15.5](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.15.4...v1.15.5) (2024-12-11)


### Bug Fixes

* **release:** fix release ([04b5593](https://github.com/RedHatInsights/insights-rbac-ui/commit/04b55936a99c38324af6458877da86265185b2eb))

## [1.15.4](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.15.3...v1.15.4) (2024-12-03)


### Bug Fixes

* **konflux:** remove duplicate name of task ([#1723](https://github.com/RedHatInsights/insights-rbac-ui/issues/1723)) ([991729a](https://github.com/RedHatInsights/insights-rbac-ui/commit/991729a25b0121bda9802c762cb707e3a4757aa2))

## [1.15.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.15.2...v1.15.3) (2024-12-03)


### Bug Fixes

* **konflux:** remove sbom json check ([#1722](https://github.com/RedHatInsights/insights-rbac-ui/issues/1722)) ([9fe1bce](https://github.com/RedHatInsights/insights-rbac-ui/commit/9fe1bcefd693fa180631164c10c9bd28f51d91d3))

## [1.15.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.15.1...v1.15.2) (2024-11-28)


### Bug Fixes

* **konflux:** update oci-ta and rpms scan image dependencies ([#1720](https://github.com/RedHatInsights/insights-rbac-ui/issues/1720)) ([1b2cf81](https://github.com/RedHatInsights/insights-rbac-ui/commit/1b2cf8171fb64ce0f3417335dbfda54b4e988973))

## [1.15.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.15.0...v1.15.1) (2024-11-28)


### Bug Fixes

* **konflux:** update buildah image sha ([#1719](https://github.com/RedHatInsights/insights-rbac-ui/issues/1719)) ([7d637b8](https://github.com/RedHatInsights/insights-rbac-ui/commit/7d637b801e731a7f5a88fb97e4d9062b18412d7c))

# [1.15.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.14.0...v1.15.0) (2024-11-27)


### Features

* **common-auth:** add it api to invite and edit users ([#1718](https://github.com/RedHatInsights/insights-rbac-ui/issues/1718)) ([0ac978c](https://github.com/RedHatInsights/insights-rbac-ui/commit/0ac978c95903f6a1a79cd82899f15cc405e56089))

# [1.14.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.13.0...v1.14.0) (2024-11-20)


### Bug Fixes

* fix typo and update snapshots ([67923e9](https://github.com/RedHatInsights/insights-rbac-ui/commit/67923e98223249eed39edcb5b4158d1a2d025d81))
* update snapshots; localize string ([24a5d42](https://github.com/RedHatInsights/insights-rbac-ui/commit/24a5d42bb235a1ddd9b3e13d486d6bd9abfbba75))


### Features

* **RolesTable:** add bulk Delete Roles button ([7985c1e](https://github.com/RedHatInsights/insights-rbac-ui/commit/7985c1ed304bc793218635294527ed5a2cf11f4a))

# [1.13.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.12.0...v1.13.0) (2024-11-20)


### Features

* add create user group to user group list ([#1713](https://github.com/RedHatInsights/insights-rbac-ui/issues/1713)) ([6c4cd82](https://github.com/RedHatInsights/insights-rbac-ui/commit/6c4cd824ac893aaf9b367f3a78865e2da26f3e00))

# [1.12.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.11.1...v1.12.0) (2024-11-19)


### Features

* create delete user groups modal ([#1703](https://github.com/RedHatInsights/insights-rbac-ui/issues/1703)) ([ed28740](https://github.com/RedHatInsights/insights-rbac-ui/commit/ed2874000ab2e090d0244865ccafe58aed2a5252))

## [1.11.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.11.0...v1.11.1) (2024-11-19)


### Bug Fixes

* hide service accounts table for default admin access ([#1709](https://github.com/RedHatInsights/insights-rbac-ui/issues/1709)) ([1452179](https://github.com/RedHatInsights/insights-rbac-ui/commit/1452179da1a55c17c486aed55d23e3a1a7e48285))

# [1.11.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.10.0...v1.11.0) (2024-11-15)


### Features

* add empty state and loading state to Users & User Groups ([#1707](https://github.com/RedHatInsights/insights-rbac-ui/issues/1707)) ([92ea430](https://github.com/RedHatInsights/insights-rbac-ui/commit/92ea430d3c461f11fa2428588e687fde4cab55c4))

# [1.10.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.9.0...v1.10.0) (2024-11-15)


### Features

* **invite-users:** add invite users modal via data driven forms ([#1706](https://github.com/RedHatInsights/insights-rbac-ui/issues/1706)) ([98cb047](https://github.com/RedHatInsights/insights-rbac-ui/commit/98cb047b14ff13885d7ce2ea3f92cdccd5a7df49))

# [1.9.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.8.0...v1.9.0) (2024-11-14)


### Features

* **rolestable:** delete roles modal ([#1696](https://github.com/RedHatInsights/insights-rbac-ui/issues/1696)) ([546a465](https://github.com/RedHatInsights/insights-rbac-ui/commit/546a465963ea395fdb9c776313687b464d92b816))

# [1.8.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.7.1...v1.8.0) (2024-11-13)


### Features

* add detailed view to Workspaces ([#1682](https://github.com/RedHatInsights/insights-rbac-ui/issues/1682)) ([2f1efc1](https://github.com/RedHatInsights/insights-rbac-ui/commit/2f1efc1fdff0cdd77972b479d3d5a12ad300c204))

## [1.7.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.7.0...v1.7.1) (2024-11-12)


### Bug Fixes

* **basename:** basename for workspaces is calculated incorrectly ([#1699](https://github.com/RedHatInsights/insights-rbac-ui/issues/1699)) ([113a38e](https://github.com/RedHatInsights/insights-rbac-ui/commit/113a38e4d3475e79252a0e931c203056d6e77359))

# [1.7.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.6.0...v1.7.0) (2024-11-06)


### Features

* **common-auth-model:** add mocked requests ([#1695](https://github.com/RedHatInsights/insights-rbac-ui/issues/1695)) ([966361c](https://github.com/RedHatInsights/insights-rbac-ui/commit/966361cb70c7bf4784d549a05d46eb43f82dfe59))

# [1.6.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.5.3...v1.6.0) (2024-11-05)


### Bug Fixes

* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/RedHatInsights/insights-rbac-ui/issues/1693)) ([1f433e9](https://github.com/RedHatInsights/insights-rbac-ui/commit/1f433e927df2f3febc5301cedb775bdbea21caa8))
* **konflux:** add rpms check to pull requests ([#1691](https://github.com/RedHatInsights/insights-rbac-ui/issues/1691)) ([81d51ff](https://github.com/RedHatInsights/insights-rbac-ui/commit/81d51fffbabaf08a4fa3a7461d0bba31407d892d))
* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/RedHatInsights/insights-rbac-ui/issues/1688)) ([f150391](https://github.com/RedHatInsights/insights-rbac-ui/commit/f150391edead6b54b4c8255706024a1f09126f49))


### Features

* create user details view ([53ccf7a](https://github.com/RedHatInsights/insights-rbac-ui/commit/53ccf7a6970e48ff7881a910c69370950a433899))

## [1.5.3](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.5.2...v1.5.3) (2024-11-03)


### Bug Fixes

* **deploy:** correct quay repository in frontend config ([#1693](https://github.com/RedHatInsights/insights-rbac-ui/issues/1693)) ([800fbb7](https://github.com/RedHatInsights/insights-rbac-ui/commit/800fbb7bf3efec362ac3f08e7a690b3982f2b4c3))

## [1.5.2](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.5.1...v1.5.2) (2024-11-01)


### Bug Fixes

* **konflux:** add rpms check to pull requests ([#1691](https://github.com/RedHatInsights/insights-rbac-ui/issues/1691)) ([981c7ce](https://github.com/RedHatInsights/insights-rbac-ui/commit/981c7ceae4bc46143f703f666484e2cea4338469))

## [1.5.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.5.0...v1.5.1) (2024-10-29)


### Bug Fixes

* **permission:** unable to load more than 2 pages in permissions ([#1688](https://github.com/RedHatInsights/insights-rbac-ui/issues/1688)) ([2d08c25](https://github.com/RedHatInsights/insights-rbac-ui/commit/2d08c25204ab35488a01c1c05cb51c942f244510))

# [1.5.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.4.0...v1.5.0) (2024-10-25)


### Bug Fixes

* issues with merge commit ([84917d3](https://github.com/RedHatInsights/insights-rbac-ui/commit/84917d3caab81a7970f80f148d3f9252582eb746))


### Features

* create add to user group modal ([0112379](https://github.com/RedHatInsights/insights-rbac-ui/commit/011237902147bd8f7c6e702bb58524016d353269))

# [1.4.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.3.0...v1.4.0) (2024-10-24)


### Features

* **workspaces:** enable overview if feature flag enabled ([#1683](https://github.com/RedHatInsights/insights-rbac-ui/issues/1683)) ([59fa607](https://github.com/RedHatInsights/insights-rbac-ui/commit/59fa60744a0fe99304f4cda2795c0a2120036c49))

# [1.3.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.2.0...v1.3.0) (2024-10-24)


### Bug Fixes

* memoize users row data ([60deb9b](https://github.com/RedHatInsights/insights-rbac-ui/commit/60deb9b76285d3b6899ebe59d8d849f92ae9a384))


### Features

* **userstable:** add delete user modal ([814f7f1](https://github.com/RedHatInsights/insights-rbac-ui/commit/814f7f161c513f7fe3bfd95c4909f30e10c18f30))

# [1.2.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.1.0...v1.2.0) (2024-10-23)


### Features

* **konflux:** enablet unit tests on Konflux ([#1656](https://github.com/RedHatInsights/insights-rbac-ui/issues/1656)) ([527b4d8](https://github.com/RedHatInsights/insights-rbac-ui/commit/527b4d89273077820459004049fbd16b79e42d2b))

# [1.1.0](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.0.1...v1.1.0) (2024-10-22)


### Features

* show WS enable alert only if user can perform this action ([#1681](https://github.com/RedHatInsights/insights-rbac-ui/issues/1681)) ([b89b2d3](https://github.com/RedHatInsights/insights-rbac-ui/commit/b89b2d3467f34996a36e5bd1052688fa4f021648))

## [1.0.1](https://github.com/RedHatInsights/insights-rbac-ui/compare/v1.0.0...v1.0.1) (2024-10-22)


### Bug Fixes

* upgrade utility classes to PF5 ([750a18a](https://github.com/RedHatInsights/insights-rbac-ui/commit/750a18a60cdeacbee029b70ff1e7920f7b83e8f3))

# 1.0.0 (2024-10-18)


### Bug Fixes

* remove mapStateToProps and mapDispatchToProps ([d9179d6](https://github.com/epwinchell/insights-rbac-ui/commit/d9179d636346c3cbb00401820254ed00ff88de41))
* remove withRouter decorators ([5b17ed2](https://github.com/epwinchell/insights-rbac-ui/commit/5b17ed29b8a56abd124257d11d62b033c930e45c))
* replace useRouteMatch with useParams ([d23a2a2](https://github.com/epwinchell/insights-rbac-ui/commit/d23a2a25469e821d41ac14bb70b396f43402db53))


### Features

* **rbac:** add access-requests ([#754](https://github.com/epwinchell/insights-rbac-ui/issues/754)) ([7fa22b0](https://github.com/epwinchell/insights-rbac-ui/commit/7fa22b0bd7ee61f09e266e09ac2691b1f011fd2f))


### Reverts

* Revert "Do not send username when creating service account ([#1559](https://github.com/epwinchell/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/epwinchell/insights-rbac-ui/issues/1560)) ([a310c88](https://github.com/epwinchell/insights-rbac-ui/commit/a310c885ab44d063e378393b75f161aa04670704))
* Revert "Revert "Do not send username when creating service account ([#1559](https://github.com/epwinchell/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/epwinchell/insights-rbac-ui/issues/1560))" ([#1561](https://github.com/epwinchell/insights-rbac-ui/issues/1561)) ([38dc92f](https://github.com/epwinchell/insights-rbac-ui/commit/38dc92fea5c5cd4db8a3dd1cbfe90cce572656a1))

# 1.0.0 (2024-10-17)


### Bug Fixes

* remove mapStateToProps and mapDispatchToProps ([d9179d6](https://github.com/RedHatInsights/insights-rbac-ui/commit/d9179d636346c3cbb00401820254ed00ff88de41))
* remove withRouter decorators ([5b17ed2](https://github.com/RedHatInsights/insights-rbac-ui/commit/5b17ed29b8a56abd124257d11d62b033c930e45c))
* replace useRouteMatch with useParams ([d23a2a2](https://github.com/RedHatInsights/insights-rbac-ui/commit/d23a2a25469e821d41ac14bb70b396f43402db53))


### Features

* **rbac:** add access-requests ([#754](https://github.com/RedHatInsights/insights-rbac-ui/issues/754)) ([7fa22b0](https://github.com/RedHatInsights/insights-rbac-ui/commit/7fa22b0bd7ee61f09e266e09ac2691b1f011fd2f))


### Reverts

* Revert "Do not send username when creating service account ([#1559](https://github.com/RedHatInsights/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/RedHatInsights/insights-rbac-ui/issues/1560)) ([a310c88](https://github.com/RedHatInsights/insights-rbac-ui/commit/a310c885ab44d063e378393b75f161aa04670704))
* Revert "Revert "Do not send username when creating service account ([#1559](https://github.com/RedHatInsights/insights-rbac-ui/issues/1559))" ([#1560](https://github.com/RedHatInsights/insights-rbac-ui/issues/1560))" ([#1561](https://github.com/RedHatInsights/insights-rbac-ui/issues/1561)) ([38dc92f](https://github.com/RedHatInsights/insights-rbac-ui/commit/38dc92fea5c5cd4db8a3dd1cbfe90cce572656a1))
