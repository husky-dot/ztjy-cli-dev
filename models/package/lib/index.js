'use strict'
const path = require('path')
const fse = require('fs-extra')
const pathExists = require('path-exists').sync
const npminstall = require('npminstall')
const pkgDir = require('pkg-dir').sync
const { isObject } = require('@ztjy-cli-dev/utils')
const formatPath = require('@ztjy-cli-dev/format-path')
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require('@ztjy-cli-dev/get-npm-info')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package 类的options参数不能为空!')
    }
    if (!isObject(options)) {
      throw new Error('Package 类的options参数必须为对象!')
    }
    // 获取 package 的路径
    this.targetPath = options.targetPath
    // 缓存 package 路径
    this.storeDir = options.storeDir
    // package 的Name
    this.packageName = options.packageName
    // package的  version
    this.packageVersion = options.packageVersion
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }
  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir)
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
    console.log('packageVersion', this.packageVersion)
  }

  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    )
  }

  getSpecificPackageVersion(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    )
  }

  // 判断当前 Package 是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare()
      console.log('cacheFilePath', this.cacheFilePath)
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.targetPath)
    }
  }

  // 安装 Package
  async install() {
    await this.prepare()
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(true),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    })
  }

  // 更新 Package
  async update() {
    await this.prepare()
    // 1. 获取最新的 npm 模块版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName)
    // 2. 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificPackageVersion(latestPackageVersion)
    // 3.如果不存在，则直接安装最新的版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(true),
        pkgs: [
          {
            name: this.packageName,
            version: latestPackageVersion,
          },
        ],
      })
      this.packageVersion = latestPackageVersion
    }
    return latestFilePath
  }
  // 获取接口文件路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      const dir = pkgDir(targetPath)
      if (dir) {
        // 2.读取 package.json -- require()   js/json/node
        const pkgFile = require(path.resolve(dir, 'package.json'))
        // 3. 寻找 main/lib - path
        if (pkgFile && pkgFile.main) {
          // 4. 路径兼容(macOs/ windows)
          return formatPath(path.resolve(dir, pkgFile.main))
        }
      }
      return null
    }
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath)
    } else {
      return _getRootFile(this.targetPath)
    }
  }
}
module.exports = Package
