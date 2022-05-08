'use strict'

const cp = require('child_process')
const path = require('path')
const Package = require('@ztjy-cli-dev/package')
const log = require('@ztjy-cli-dev/log')

const SETTINGS = {
  init: '@imooc-cli/init',
}

const CATCH_DIR = 'dependencies'

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  let storeDir = ''
  let pkg = ''
  const homePath = process.env.CLI_HOME_PATH
  log.verbose('targetPath', targetPath)
  log.verbose('homePath', homePath)
  const cmdObj = arguments[arguments.length - 1]
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = '1.1.0'

  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, CATCH_DIR) // 生成缓存路径
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    })
    if (await pkg.exists()) {
      // 更新
      await pkg.update()
    } else {
      // 安装
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    })
  }
  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    try {
      // 在当前进程中调用
      // require(rootFile).call(null, Array.from(arguments))
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      const opts = args[1]
      const o = Object.create(null)
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent'
        ) {
          o[key] = cmd[key]
        }
      })
      Object.keys(opts).forEach((key) => {
        if (opts.hasOwnProperty(key)) {
          o[key] = opts[key]
        }
      })
      args[args.length - 1] = o
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      })
      child.on('error', (e) => {
        log.error(e.message)
        process.exit(1)
      })
      child.on('exit', (e) => {
        log.verbose('命令执行成功' + e)
        process.exit(e)
      })
    } catch (e) {
      log.error(e.message)
    }
  }
  // 1.targetPath -> modulePath
  // 2.modulePath -> package(npm 模块)
}


function spawn (command, args, options) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd': command
  const cmdArgs = win32 ? ['/c'].concat(command, args): args
  return cp.spawn(cmd, cmdArgs, options || {})
}

module.exports = exec
