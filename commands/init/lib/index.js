'use strict'

const Command = require('@ztjy-cli-dev/command')
const log = require('@ztjy-cli-dev/log')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = this._cmd.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }
  exec() {
    console.log('init 业务')
  }
}

function init(argv) {
  // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH)
  new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
