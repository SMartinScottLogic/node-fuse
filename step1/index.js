var fuse = require('fuse-bindings')

var mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\'

fuse.mount(mountPath, {
  readdir: function (path, cb) {
    console.log('readdir(%s)', path)
    cb(0, [])
  },
  getattr: function (path, cb) {
    console.log('getattr(%s)', path)
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
  console.log('filesystem mounted on ' + mountPath)
})

process.on('SIGINT', function () {
  fuse.unmount(mountPath, function (err) {
    if (err) {
      console.log('filesystem at ' + mountPath + ' not unmounted', err)
    } else {
      console.log('filesystem at ' + mountPath + ' unmounted')
    }
  })
})
