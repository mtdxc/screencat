var path = require('path')
var menubar = require('./menubar.js')
var electron = require('electron')
var BrowserWindow = electron.BrowserWindow
var ipc = electron.ipcMain

var icons = {
  connected: path.join(__dirname, 'img', 'IconRed.png'),
  disconnected: path.join(__dirname, 'img', 'Icon.png')
}

var mb = menubar({
  width: 700,
  height: 300,
  index: 'file://' + path.join(__dirname, 'app.html'),
  icon: icons.disconnected,
  tooltip: "screencat",
  alwaysOnTop: true
})

var win

mb.app.commandLine.appendSwitch('disable-renderer-backgrounding')

mb.on('ready', function () {
  console.log('ready')
})
mb.on('after-create-window', function (){
  mb.window.webContents.openDevTools()
})

ipc.on('icon', function (ev, key) {
  mb.tray.setImage(icons[key])
})

mb.app.on('open-url', function (e, lnk) {
  e.preventDefault()
  if (mb.window) mb.window.webContents.send('open-url', lnk)
})

ipc.on('terminate', function (ev) {
  mb.app.quit()
})

ipc.on('resize', function (ev, data) {
  mb.window.setSize(data.width, data.height)
})

ipc.on('error', function (ev, err) {
  console.error(new Error(err.message))
})

ipc.on('create-window', function(ev, config) {
  console.log('create-window', [config])
  mb.app.dock.show()
  win = new BrowserWindow({width: 720, height: 445})
  win.loadUrl('file://' + path.join(__dirname, 'screen.html'))

  win.on('closed', function () {
    mb.app.dock.hide()
    mb.window.webContents.send('disconnected', true)
  })

  ipc.once('window-ready', function () {
    // win.webContents.openDevTools()
    win.webContents.send('peer-config', config)
  })

  ipc.on('connected', function () {
    mb.window.webContents.send('connected', true)
  })

  ipc.on('disconnected', function () {
    mb.window.webContents.send('disconnected', true)
  })

  ipc.on('show-window', function () {
    win.show()
  })

  ipc.on('stop-viewing', function () {
    win.close()
    mb.window.webContents.send('disconnected', true)
  })
})
