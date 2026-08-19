let dirty = false;

export function setSessionDirty(v: boolean) {
  dirty = v;
}

export function getSessionDirty(): boolean {
  return dirty;
}
