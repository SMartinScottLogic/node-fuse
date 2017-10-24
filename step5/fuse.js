const fuse = require('fuse-bindings')
const info = require('debug')('node-fuse:info')
const error = require('debug')('node-fuse:error')
const request = require('request')

const mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\'
const base = 'http://localhost:16006'

const known_entities = [ ]

fuse.mount(mountPath, {
  mkdir: function(path, mode, cb) {
    info('mkdir', path)
    known_entities.push(path.slice(1))
    cb(0)
  },
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
	const element_ids = JSON.parse(body).data.map((element) => element.id)
	return cb(0, element_ids)
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
    if (known_entities.indexOf(path.split('/')[1]) === -1) {
      return cb(fuse.ENOENT)
    }
    request(base + path, function (err, response, body) {
        if (err) {
	  error('request', base, path, err)
          return cb(fuse.ENOENT)
	}
        const json_body = JSON.parse(body)
        if (json_body.errors) {
	  error('request', base, path, json_body.errors)
	  return cb(fuse.ENOENT)
        }
	info('request', base, path, json_body['data'])

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
  },
  open: function(path, mode, cb) {
    info('open', path)
    cb(0)
  },
  read: function(path, fd, buf, len, pos, cb) {
    info('read', path, fd, len, pos)
    request(base + path, function(err, response, body) {
      if (err) {
        error('request', base, path, err)
	return cb(0)
      }
      const json_body = JSON.parse(body)
      if (json_body.errors) {
	error('request', base, path, json_body.errors)
	return cb(0)
      }
      const content = JSON.stringify(JSON.parse(body).data.attributes)
      if (!content) {
        return cb(0)
      }
      buf.write(content)
      return cb(content.length)
    })
  },
  unlink: function(path, cb) {
    info('unlink', path)
    request(base + path, {method: 'DELETE'}, function(err, response, body) {
      if (err) {
        error('request', base, path, err)
        return cb(fuse.ENOENT)
      }
      const json_body = JSON.parse(body)
      if (json_body.errors) {
        error('request', base, path, json_body.errors)
	return cb(fuse.ENOENT)
      }
      cb(0)
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
