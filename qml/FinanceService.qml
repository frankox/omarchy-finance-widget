import QtQuick
import Quickshell
import Quickshell.Io

Item {
  id: root

  property var shell: null
  property var manifest: null

  property string status: "starting"
  property string lastError: ""
  property var health: ({})
  property int requestSequence: 0
  property var pending: ({})

  readonly property string pluginRoot: manifest && manifest.__sourceDir
    ? String(manifest.__sourceDir)
    : Qt.resolvedUrl("..").toString().replace(/^file:\/\//, "").replace(/\/$/, "")
  readonly property string workerPath: Qt.resolvedUrl("../backend/main.ts").toString().replace(/^file:\/\//, "")

  signal responseReceived(string requestId, var response)

  function startWorker() {
    if (worker.running || root.workerPath === "") return
    root.status = "starting"
    root.lastError = ""
    worker.command = [
      "deno",
      "run",
      "--cached-only",
      "--no-prompt",
      "--allow-net=query2.finance.yahoo.com",
      root.workerPath
    ]
    worker.running = true
  }

  function request(method, params, callback) {
    if (!worker.running) {
      root.lastError = "Finance worker is unavailable"
      return ""
    }

    root.requestSequence += 1
    var requestId = "qml-" + root.requestSequence
    var next = ({})
    for (var key in root.pending) next[key] = root.pending[key]
    if (callback) next[requestId] = callback
    root.pending = next
    worker.write(JSON.stringify({
      v: 1,
      id: requestId,
      method: method,
      params: params || {}
    }) + "\n")
    return requestId
  }

  function handleWorkerLine(data) {
    var message
    try {
      message = JSON.parse(String(data || ""))
    } catch (error) {
      root.lastError = "Finance worker returned an invalid response"
      return
    }

    if (!message || typeof message.id !== "string") return
    var callback = root.pending[message.id]
    if (callback) {
      var next = ({})
      for (var key in root.pending) {
        if (key !== message.id) next[key] = root.pending[key]
      }
      root.pending = next
      callback(message)
    }
    root.responseReceived(message.id, message)
  }

  function checkHealth(probeProvider) {
    return request("health.check", { probeProvider: probeProvider === true }, function(message) {
      if (message.ok === true) {
        root.health = message.result || ({})
        root.status = "ready"
        root.lastError = ""
      } else {
        root.status = "unavailable"
        root.lastError = "Finance runtime check failed"
      }
    })
  }

  onManifestChanged: Qt.callLater(startWorker)
  Component.onCompleted: Qt.callLater(startWorker)

  Process {
    id: worker
    command: []
    workingDirectory: root.pluginRoot
    stdinEnabled: true

    stdout: SplitParser {
      onRead: function(data) { root.handleWorkerLine(data) }
    }

    stderr: SplitParser {
      onRead: function(_data) {
        root.lastError = "Finance worker reported an error"
      }
    }

    onStarted: root.checkHealth(false)
    onExited: function(_exitCode, _exitStatus) {
      root.status = "unavailable"
      root.pending = ({})
      if (root.lastError === "") root.lastError = "Finance worker stopped"
    }
  }

  IpcHandler {
    target: "frankox.omarchy-finance-widget"

    function status(): string {
      return JSON.stringify({
        status: root.status,
        health: root.health,
        error: root.lastError
      })
    }

    function probeProvider(): string {
      return root.checkHealth(true) === "" ? "unavailable" : "started"
    }
  }
}
