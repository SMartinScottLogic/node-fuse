const fuse = require('fuse-bindings')
const info = require('debug')('node-fuse:info')
const error = require('debug')('node-fuse:error')
const request = require('request')

const mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\'
const base = 'http://localhost:16006'

request(base + '/photos', function (err, response, body) {
  if(err) {
    error('request', err);
  }
  info('request', body)
})

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
  },
  statfs: function (path, cb) {
      cb(0, {
	    bsize: 1000000,
	    frsize: 1000000,
	    blocks: 1000000,
	    bfree: 1000000,
	    bavail: 1000000,
	    files: 1000000,
	    ffree: 1000000,
	    favail: 1000000,
	    fsid: 1000000,
	    flag: 1000000,
	    namemax: 1000000
	  })
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
