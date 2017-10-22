const fuse = require('fuse-bindings')
const info = require('debug')('node-fuse:info')
const error = require('debug')('node-fuse:error')

const mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\'

fuse.mount(mountPath, {
  readdir: function (path, cb) {
    info('readdir', path)
    cb(0, [])
  },
  getattr: function (path, cb) {
    info('getattr', path)
    if (path === '/') {
      cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        size: 100,
        mode: 0o40755,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      })
      return
    }
    cb(fuse.ENOENT)
  }
}, function (err) {
  if (err) throw err
  info('filesystem mounted on ' + mountPath)
})

process.on('SIGINT', function () {
  fuse.unmount(mountPath, function (err) {
    if (err) {
      error('filesystem at ' + mountPath + ' not unmounted', err)
    } else {
      info('filesystem at ' + mountPath + ' unmounted')
    }
  })
})
