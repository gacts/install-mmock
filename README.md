<p align="center">
  <img src="https://github.com/jmartin82/mmock/raw/master/docs/logo.png" alt="Logo" width="450" />
</p>

# Install [MMock][mmock] action

![Release version][badge_release_version]
[![Build Status][badge_build]][link_build]
[![License][badge_license]][link_license]

> MMock is a testing and fast prototyping tool for developers - easy and fast HTTP mock server.

This action installs [MMock][mmock] as a binary file into your workflow. It can be run on **Linux** (`ubuntu-latest`), **macOS** (`macos-latest`), or **Windows** (`windows-latest`).

- 🚀 MMock releases page: <https://github.com/jmartin82/mmock/releases>

Additionally, this action uses GitHub **caching mechanism** to speed up your workflow execution time!

## Usage

```yaml
jobs:
  install-mmock:
    runs-on: ubuntu-20.04
    steps:
      - uses: gacts/install-mmock@v1 # Action page: <https://github.com/gacts/install-mmock>
        #with:
        #  version: 3.0.0 # `latest` by default, but you can set a specific version to install, e.g.: `1.6.0`

      - run: mmock -h # any mmock command can be executed
```

## Customizing

### Inputs

Following inputs can be used as `step.with` keys:

| Name           |   Type   |        Default        | Required | Description                                                 |
|----------------|:--------:|:---------------------:|:--------:|-------------------------------------------------------------|
| `version`      | `string` |       `latest`        |    no    | MMock version to install                                    |
| `github-token` | `string` | `${{ github.token }}` |    no    | GitHub token (for requesting the latest MMock version info) |

### Outputs

| Name        |   Type   | Description                   |
|-------------|:--------:|-------------------------------|
| `mmock-bin` | `string` | Path to the MMock binary file |

## Releasing

New versions releasing scenario:

- Make required changes in the [changelog](CHANGELOG.md) file
- Build the action distribution (`make build` or `yarn build`)
- Commit and push changes (including `dist` directory changes - this is important) into the `master` branch
- Publish new release using repo releases page (git tag should follow `vX.Y.Z` format)

Major and minor git tags (`v1` and `v1.2` if you publish `v1.2.Z` release) will be updated automatically.

## Support

[![Issues][badge_issues]][link_issues]
[![Issues][badge_pulls]][link_pulls]

If you find any action errors, please, [make an issue][link_create_issue] in the current repository.

## License

This is open-sourced software licensed under the [MIT License][link_license].

[badge_build]:https://img.shields.io/github/actions/workflow/status/gacts/install-mmock/tests.yml?branch=master&maxAge=30
[badge_release_version]:https://img.shields.io/github/release/gacts/install-mmock.svg?maxAge=30
[badge_license]:https://img.shields.io/github/license/gacts/install-mmock.svg?longCache=true
[badge_release_date]:https://img.shields.io/github/release-date/gacts/install-mmock.svg?maxAge=180
[badge_commits_since_release]:https://img.shields.io/github/commits-since/gacts/install-mmock/latest.svg?maxAge=45
[badge_issues]:https://img.shields.io/github/issues/gacts/install-mmock.svg?maxAge=45
[badge_pulls]:https://img.shields.io/github/issues-pr/gacts/install-mmock.svg?maxAge=45

[link_build]:https://github.com/gacts/install-mmock/actions
[link_license]:https://github.com/gacts/install-mmock/blob/master/LICENSE
[link_issues]:https://github.com/gacts/install-mmock/issues
[link_create_issue]:https://github.com/gacts/install-mmock/issues/new
[link_pulls]:https://github.com/gacts/install-mmock/pulls

[mmock]:https://github.com/jmartin82/mmock
