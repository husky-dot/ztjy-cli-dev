'use strict'

const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const pkg = require('../package.json')
const pathExists = require('path-exists').sync
const log = require('@ztjy-cli-dev/log')
const commander = require('commander')
const init = require('@ztjy-cli-dev/init')

const constant = require('./const')
const homedir = require('os').homedir()

const program = new commander.Command()

module.exports = core

async function core() {
  try {
    prepare()
    registerCommander()
  } catch (e) {
    log.error(e.message)
  }
}

function registerCommander() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(init)
  // 开启 debug 模式  
  program.on('option:debug', function () {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = 'verbose' 
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
    log.verbose('test')
  })

  // 指定 targetPath
  program.on('option:targetPath', function() {
    process.env.CLI_TARGET_PATH = program.opts().targetPath
  })
  // if (program.args && program.args.length < 1) {
  //   program.outputHelp()
  // }
  program.parse(process.argv)
}

async function prepare() {
  checkPkgVersion()
  checkNodeVersion()
  checkRoot()
  checkEnv()
  await checkGlobalUpdate()
}
program.on('command:*', function (obj) {
  const availableCommands = program.commands.map((cmd) => cmd.name())
  console.log(colors.red('未知的命令' + obj[0]))
  if (availableCommands.length > 0) {
    console.log(colors.red('可用命令' + availableCommands.join(',')))
  }
})

async function checkGlobalUpdate() {
  // 1.获取当前版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  const { getNpmSemverVersions } = require('@ztjy-cli-dev/get-npm-info')
  const lastVersion = await getNpmSemverVersions(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(
        '更新提示：',
        `请手动更新 ${npmName}，当前版本：${currentVersion}, 最新版本：${lastVersion}
      更新命令：npm install -g ${npmName}
    `
      )
    )
  }
  // 2.调用npm API 获取所有版本号

  // 3.提取所有版本号，比对哪些版本号是大于当前版本号
  // 4.获取最新的版本号，比对哪些版本号
}

function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(homedir, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    })
  }
  createDefaultConfig()
}

function createDefaultConfig() {
  const cliConfig = {
    home: homedir,
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(homedir, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(homedir, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()
}

function checkNodeVersion() {
  // 第一步，获取当前 Node 版本号
  const currentVersion = process.version
  // 第二步，比对最低版本号
  const lowestNodeVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestNodeVersion)) {
    throw new Error(
      colors.red(`ztjy-clc 需要安装 v${lowestNodeVersion} 以上的版本的 Node.js`)
    )
  }
}

function checkPkgVersion() {
  log.info('cli', pkg.version)
}
