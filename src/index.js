const core = require('@actions/core') // docs: https://github.com/actions/toolkit/tree/main/packages/core
const tc = require('@actions/tool-cache') // docs: https://github.com/actions/toolkit/tree/main/packages/tool-cache
const github = require('@actions/github') // docs: https://github.com/actions/toolkit/tree/main/packages/github
const io = require('@actions/io') // docs: https://github.com/actions/toolkit/tree/main/packages/io
const cache = require('@actions/cache') // docs: https://github.com/actions/toolkit/tree/main/packages/cache
const exec = require('@actions/exec') // docs: https://github.com/actions/toolkit/tree/main/packages/exec
const semver = require('semver') // docs: https://github.com/npm/node-semver#readme
const path = require('path')
const os = require('os')

// read action inputs
const input = {
  version: core.getInput('version', {required: true}).replace(/^[vV]/, ''), // strip the 'v' prefix
  githubToken: core.getInput('github-token'),
}

// main action entrypoint
async function runAction() {
  let version

  if (input.version.toLowerCase() === 'latest') {
    core.debug('Requesting latest MMock version...')
    version = await getLatestVersion(input.githubToken)
    core.debug(`Latest version: ${version}`)
  } else {
    version = input.version
  }

  core.startGroup('💾 Install MMock')
  await doInstall(version)
  core.endGroup()

  core.startGroup('🧪 Installation check')
  await doCheck()
  core.endGroup()
}

/**
 * @param {string} version
 *
 * @returns {Promise<void>}
 *
 * @throws
 */
async function doInstall(version) {
  const pathToInstall = path.join(os.tmpdir(), `mmock-${version}`)
  const cacheKey = `mmock-cache-${version}-${process.platform}-${process.arch}`

  core.info(`Version to install: ${version} (target directory: ${pathToInstall})`)

  /** @type {string|undefined} */
  let restoredFromCache = undefined

  try {
    restoredFromCache = await cache.restoreCache([pathToInstall], cacheKey)
  } catch (e) {
    core.warning(e)
  }

  if (restoredFromCache) { // cache HIT
    core.info(`👌 MMock restored from cache`)
  } else { // cache MISS
    const distUrl = getDistUrl(process.platform, process.arch, version)

    core.debug(`Downloading mmock from ${distUrl}`)

    const distPath = await tc.downloadTool(distUrl)

    switch (true) {
      case distUrl.endsWith('tar.gz'):
        await tc.extractTar(distPath, pathToInstall)
        break

      case distUrl.endsWith('zip'):
        await tc.extractZip(distPath, pathToInstall)
        break

      default:
        throw new Error('Unsupported distributive format')
    }

    await io.rmRF(distPath)

    try {
      await cache.saveCache([pathToInstall], cacheKey)
    } catch (e) {
      core.warning(e)
    }
  }

  core.addPath(pathToInstall)
}

/**
 * @returns {Promise<void>}
 *
 * @throws {Error} binary file not found in $PATH or version check failed
 */
async function doCheck() {
  const binPath = await io.which('mmock', true)

  if (binPath === "") {
    throw new Error('mmock binary file not found in $PATH')
  }

  let output = ''

  await exec.exec('mmock', ['-h'], {
    silent: true,
    ignoreReturnCode: true,
    listeners: {
      stdout: data => output += data.toString(),
      stderr: data => output += data.toString(),
    }
  })

  if (!output.toLowerCase().includes('mmock v')) {
    throw new Error(`The output does not contain the required substring: ${output}`)
  }

  core.setOutput('mmock-bin', binPath)

  core.info(`MMock installed: ${binPath}`)
}

/**
 * @param {string} githubAuthToken
 * @returns {Promise<string>}
 */
async function getLatestVersion(githubAuthToken) {
  /** @type {import('@actions/github')} */
  const octokit = github.getOctokit(githubAuthToken)

  // docs: https://octokit.github.io/rest.js/v18#repos-get-latest-release
  const latest = await octokit.rest.repos.getLatestRelease({
    owner: 'jmartin82',
    repo: 'mmock',
  })

  return latest.data.tag_name.replace(/^[vV]/, '') // strip the 'v' prefix
}

/**
 * @link https://github.com/jmartin82/mmock/releases
 *
 * @param {('linux'|'darwin'|'win32')} platform
 * @param {('x32'|'x64'|'arm'|'arm64')} arch
 * @param {string} version E.g.: `3.0.2`
 *
 * @returns {string}
 *
 * @throws {Error} Unsupported platform or architecture
 */
function getDistUrl(platform, arch, version) {
  const before301 = semver.lt(version, '3.0.1') // the version is less than 3.0.1
  const before400 = semver.lt(version, '4.0.0') // the version is less than 4.0.0

  switch (platform) {
    case 'linux': {
      switch (arch) {
        case 'x64':
          // v4.2.0 - mmock_Linux_x86_64.tar.gz
          // v4.0.1 - mmock_Linux_x86_64.tar.gz
          // v3.1.6 - mmock_Linux_x86_64.tar.gz
          // v3.1.5 - mmock_Linux_x86_64.tar.gz
          // v3.1.4 - mmock_Linux_x86_64.tar.gz
          // v3.1.3 - mmock_Linux_x86_64.tar.gz
          // v3.1.2 - mmock_Linux_x86_64.tar.gz
          // v3.0.3 - mmock_Linux_x86_64.tar.gz
          // v3.0.1 - mmock_Linux_x86_64.tar.gz
          // v3.0.0 - mmock_3.0.0_linux_64-bit.tar.gz
          // v2.7.9 - mmock_2.7.9_linux_64-bit.tar.gz
          // v2.7.8 - mmock_2.7.8_linux_64-bit.tar.gz
          // v2.7.7 - mmock_2.7.7_linux_64-bit.tar.gz
          if (before301) {
            return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_${version}_linux_64-bit.tar.gz`
          }

          return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_Linux_x86_64.tar.gz`
      }

      throw new Error(`Unsupported linux architecture (${arch})`)
    }

    case 'darwin': {
      switch (arch) {
        case 'x64':
          // v4.2.0 - mmock_Darwin_x86_64.tar.gz
          // v4.0.1 - mmock_Darwin_x86_64.tar.gz
          // v3.1.6 - mmock_macOS_x86_64.tar.gz
          // v3.1.5 - mmock_macOS_x86_64.tar.gz
          // v3.1.4 - mmock_macOS_x86_64.tar.gz
          // v3.1.3 - mmock_macOS_x86_64.tar.gz
          // v3.1.2 - mmock_macOS_x86_64.tar.gz
          // v3.0.3 - mmock_macOS_x86_64.tar.gz
          // v3.0.1 - mmock_macOS_x86_64.tar.gz
          // v3.0.0 - mmock_3.0.0_macOS_64-bit.tar.gz
          // v2.7.9 - mmock_2.7.9_macOS_64-bit.tar.gz
          // v2.7.8 - mmock_2.7.8_macOS_64-bit.tar.gz
          // v2.7.7 - mmock_2.7.7_macOS_64-bit.tar.gz
          if (before301) {
            return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_${version}_macOS_64-bit.tar.gz`
          } else if (before400) {
            return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_macOS_x86_64.tar.gz`
          }

          return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_Darwin_x86_64.tar.gz`

        case 'arm64':
          // v4.2.0 - mmock_Darwin_arm64.tar.gz
          // v4.0.1 - mmock_Darwin_arm64.tar.gz
          // v3.1.6 - mmock_macOS_arm64.tar.gz
          // v3.1.5 - mmock_macOS_arm64.tar.gz
          // v3.1.4 - NONE
          // v3.1.3 - mmock_macOS_arm64.tar.gz
          // v3.1.2 - mmock_macOS_arm64.tar.gz
          // v3.0.3 - NONE
          // v3.0.1 - NONE
          // v3.0.0 - NONE
          // v2.7.9 - NONE
          // v2.7.8 - NONE
          // v2.7.7 - NONE
          if (before301) {
            return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_${version}_macOS_arm64.tar.gz`
          } else if (before400) {
            return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_macOS_arm64.tar.gz`
          }

          return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_Darwin_arm64.tar.gz`
      }

      throw new Error(`Unsupported MacOS architecture (${arch})`)
    }

    case 'win32': {
      switch (arch) {
        case 'x64':
          // v4.2.0 - mmock_Darwin_x86_64.tar.gz
          // v4.0.1 - mmock_Darwin_x86_64.tar.gz
          // v3.1.6 - mmock_Windows_x86_64.zip
          // v3.1.5 - mmock_Windows_x86_64.zip
          // v3.1.4 - mmock_Windows_x86_64.zip
          // v3.1.3 - mmock_Windows_x86_64.zip
          // v3.1.2 - mmock_Windows_x86_64.zip
          // v3.0.3 - mmock_Windows_x86_64.zip
          // v3.0.1 - mmock_Windows_x86_64.zip
          // v3.0.0 - mmock_3.0.0_windows_64-bit.tar.gz
          // v2.7.9 - mmock_2.7.9_windows_64-bit.tar.gz
          // v2.7.8 - mmock_2.7.8_windows_64-bit.tar.gz
          // v2.7.7 - mmock_2.7.7_windows_64-bit.tar.gz
          if (before301) {
            return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_${version}_windows_64-bit.tar.gz`
          }

          return `https://github.com/jmartin82/mmock/releases/download/v${version}/mmock_Windows_x86_64.zip`
      }

      throw new Error(`Unsupported windows architecture (${arch})`)
    }
  }

  throw new Error(`Unsupported platform (${platform})`)
}

// run the action
(async () => {
  await runAction()
})().catch(error => {
  core.setFailed(error.message)
})
