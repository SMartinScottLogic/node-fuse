const fuse = require('fuse-bindings')
const debug = require('debug')('node-fuse')

var mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\'

var files = [
  {path: '/', name: 'file1', content: new Buffer('hello')},
  {path: '/', name: 'file2', content: new Buffer('world')}
]

fuse.mount(mountPath, {
  readdir: function (path, cb) {
    debug('readdir', path)
    const idx = path.lastIndexOf('/')
    const content = files.filter(entry => entry.path === path).map(entry => entry.name);
    return cb(0, content)
  },
  getattr: function (path, cb) {
    console.log('getattr(%s)', path)
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
    const match = files.find(entry => path === (entry.path + entry.name))
    if (match) {
      return cb(0, {
	mtime: new Date(),
	atime: new Date(),
	ctime: new Date(),
	nlink: 1,
	size: match.content.length,
	mode: 0o100644,
	uid: process.getuid ? process.getuid() : 0,
	gid: process.getgid ? process.getgid() : 0
      })
    }
    cb(fuse.ENOENT)
  },
  open: function (path, flags, cb) {
    console.log('open(%s, %d)', path, flags)
    const match = files.find(entry => path === (entry.path + entry.name))
    if(match) {
      return cb(0)
    }
    cb(fuse.ENOENT)
  },
  read: function (path, fd, buf, len, pos, cb) {
    console.log('read(%s, %d, %d, %d)', path, fd, len, pos)
    const match = files.find(entry => path === (entry.path + entry.name))
    if (match) {
      const str = match.content.toString('utf8', pos, pos + len)
      if (!str) return cb(0)
      buf.write(str)
      return cb(str.length)
    }
    cb(fuse.ENOENT)
  },
  write: function (path, fd, buf, len, pos, cb) {
    console.log('write(%s, %d, %s, %d, %d)', path, fd, buf, len, pos)
    const match = files.find(entry => path === (entry.path + entry.name))
    if (match) {
      match.content = buf.slice(0, len)
      return cb(buf.length)
    }
    cb(fuse.ENOENT)
  },
  truncate: function (path, size, cb) {
    debug('truncate', {path, size})
    cb(0)
  },
  create: function (path, mode, cb) {
    debug('create', {path, mode})
    
    const idx = path.lastIndexOf('/')
    const file = {path: path.substring(0, idx+1), name: path.substring(idx+1), content: Buffer.alloc(0)}
    files.push(file)
    cb(0)
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
