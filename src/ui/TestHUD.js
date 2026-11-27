export class TestHUD {
  constructor(pointerLock) {
    this.pointerLock = pointerLock;
    this.hasStarted = false;
    this.root = null;
    this.objectiveElement = null;
    this.hintElement = null;
    this.messageElement = null;
    this.startButton = null;
    this.create();
    document.addEventListener('pointerlockchange', () => this.syncPointerLock());
    this.syncPointerLock();
  }

  create() {
    const style = document.createElement('style');
    style.textContent = [
      '#test-hud{position:fixed;inset:0;z-index:1000;color:#e8e4d9;font-family:Arial,sans-serif;pointer-events:none;}',
      '#test-hud .hud-top{position:absolute;top:24px;left:28px;max-width:min(440px,calc(100vw - 56px));text-shadow:0 2px 8px #000;}',
      '#test-hud .eyebrow{font-size:10px;letter-spacing:3px;color:#b9a77e;font-weight:700;}',
      '#test-hud .objective{margin-top:8px;font-size:14px;line-height:1.45;letter-spacing:.3px;}',
      '#test-hud .crosshair{position:absolute;left:50%;top:50%;width:5px;height:5px;border:1px solid rgba(240,235,220,.8);border-radius:50%;transform:translate(-50%,-50%);opacity:.7;}',
      '#test-hud .hint{position:absolute;left:50%;bottom:82px;transform:translateX(-50%);padding:10px 16px;background:rgba(13,16,18,.82);border:1px solid rgba(205,190,155,.28);font-size:12px;letter-spacing:1px;white-space:nowrap;opacity:0;transition:opacity .15s;}',
      '#test-hud .message{position:absolute;left:50%;bottom:32px;transform:translateX(-50%);padding:10px 16px;background:rgba(13,16,18,.8);font-size:12px;letter-spacing:.25px;text-align:center;max-width:min(600px,calc(100vw - 32px));opacity:0;transition:opacity .2s;}',
      '#test-hud .controls{position:absolute;bottom:25px;left:28px;font-size:10px;line-height:1.8;letter-spacing:1px;color:rgba(232,228,217,.68);}',
      '#test-hud .overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(5,8,10,.84);backdrop-filter:blur(5px);pointer-events:auto;opacity:0;visibility:hidden;transition:opacity .2s,visibility .2s;}',
      '#test-hud .overlay.visible{opacity:1;visibility:visible;}',
      '#test-hud .card{width:min(540px,100%);padding:36px;background:rgba(22,27,29,.96);border:1px solid rgba(184,159,111,.42);box-shadow:0 24px 90px rgba(0,0,0,.45);}',
      '#test-hud .card h1{margin:12px 0 8px;font-size:clamp(26px,5vw,42px);font-weight:600;letter-spacing:4px;}',
      '#test-hud .card p{font-size:14px;line-height:1.65;color:#c2c0b8;}',
      '#test-hud .card .small{margin-top:18px;font-size:11px;letter-spacing:1.4px;color:#b9a77e;}',
      '#test-hud .start-button{margin-top:28px;padding:13px 20px;background:#b49b70;color:#16191a;border:0;font-weight:700;letter-spacing:2px;cursor:pointer;}',
      '#test-hud .start-button:hover{background:#d1bc92;}',
      '@media(max-width:600px){#test-hud .hud-top{top:16px;left:16px;}#test-hud .controls{left:16px;bottom:16px;}#test-hud .card{padding:24px;}}'
    ].join('\n');
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'test-hud';
    this.root.innerHTML = [
      '<div class="hud-top"><div id="hud-objective" class="objective">Objective: Find the maintenance panel and restore power.</div></div>',
      '<div class="crosshair"></div>',
      '<div id="hud-hint" class="hint"></div>',
      '<div id="hud-message" class="message"></div>',
      '<div class="controls">W A S D  MOVE<br>SHIFT  RUN &nbsp; • &nbsp; E  INTERACT &nbsp; • &nbsp; ESC  PAUSE</div>',
      '<section id="hud-overlay" class="overlay visible"><div class="card">',
      '<p>Explore the classroom, collect three power relays, repeat the light sequence at the maintenance panel, then return to the entrance.</p>',
      '<p class="small">WASD TO MOVE · MOUSE TO LOOK · SHIFT TO RUN · E TO INTERACT</p>',
      '<button id="hud-start" class="start-button" type="button">ENTER TEST</button>',
      '</div></section>'
    ].join('');

    document.body.appendChild(this.root);
    this.objectiveElement = this.root.querySelector('#hud-objective');
    this.hintElement = this.root.querySelector('#hud-hint');
    this.messageElement = this.root.querySelector('#hud-message');
    this.overlay = this.root.querySelector('#hud-overlay');
    this.startButton = this.root.querySelector('#hud-start');
    this.startButton.addEventListener('click', () => this.pointerLock.requestLock());
  }

  syncPointerLock() {
    const locked = this.pointerLock.isPointerLocked();
    if (locked) this.hasStarted = true;
    this.overlay.classList.toggle('visible', !locked);
    this.startButton.textContent = this.hasStarted ? 'RESUME TEST' : 'ENTER TEST';
  }

  setObjective(text) {
    this.objectiveElement.textContent = 'Objective: ' + text;
  }

  setHint(text) {
    this.hintElement.textContent = text;
    this.hintElement.style.opacity = text ? '1' : '0';
  }

  showMessage(text) {
    this.messageElement.textContent = text;
    this.messageElement.style.opacity = '1';
    window.clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => {
      this.messageElement.style.opacity = '0';
    }, 3600);
  }
}
