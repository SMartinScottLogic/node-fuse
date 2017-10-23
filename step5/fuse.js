const fuse = require('fuse-bindings')
const info = require('debug')('node-fuse:info')
const error = require('debug')('node-fuse:error')
const request = require('request')

const mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\'
const base = 'http://localhost:16006'

const known_entities = ['photos', 'documents']

request(base + '/photos', function (err, response, body) {
  if(err) {
    error('request', err);
  }
  info('request', body)
})

fuse.mount(mountPath, {
  readdir: function (path, cb) {
    info('readdir', path)
    if (path === '/') {
      return cb(0, known_entities)
    }
    const match = known_entities.find((entity) => path === '/' + entity)
    if(match) {
      request(base + path, function (err, response, body) {
	if (err) {
	  error('request', base, path, err);
	  return cb(0, [])
	}
	info('request', base, path, JSON.parse(body)["data"])
	const content = JSON.parse(body).data.map((element) => element.attributes.title || element.id)
	return cb(0, content)
      })
    } else cb(0, [])
  },
  getattr: function (path, cb) {
    info('getattr', path)
    if (path === '/') {
      return cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        size: 100,
        mode: 0o40755,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      })
    }
    const match = known_entities.find((entity) => path === '/' + entity)
    if(match) {
      return cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        size: 100,
        mode: 0o40755,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      })
    }
	  // Should do request here.
    request(base + path, function (err, response, body) {
        if (err) {
	  error('request', base, path, err)
          return cb(fuse.ENOENT)
	}
	info('request', base, path, JSON.parse(body)['data'])

      return cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        size: 100,
        mode: 0o100644,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
      })
    })
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
