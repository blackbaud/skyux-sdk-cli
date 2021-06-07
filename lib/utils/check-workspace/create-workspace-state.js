/**
 * Tracks the pass/fail state for a workspace.
 */
class WorkspaceState {
  constructor() {
    this.messages = [];
  }

  addFailed(message) {
    this.messages.push({
      message,
      status: 'failed'
    });
  }

  addPassed(message) {
    this.messages.push({
      message,
      status: 'passed'
    });
  }

  *allStatusMessages() {
    for (const message of this.messages) {
      yield message;
    }
  }
}

function createWorkspaceState() {
  return new WorkspaceState();
}

module.exports = createWorkspaceState;
