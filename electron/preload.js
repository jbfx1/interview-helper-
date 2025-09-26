import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('interviewPass', {
  version: appVersion()
});

function appVersion() {
  return process.versions.electron;
}
