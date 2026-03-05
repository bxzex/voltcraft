import Peer, { DataConnection } from 'peerjs';
import * as THREE from 'three';
import Terrain from './terrain';
import Player from './player';
import Control from './control';

export default class Multiplayer {
  peer: Peer | null = null;
  connections: Record<string, DataConnection> = {};
  myId: string | null = null;
  myUsername: string = 'Player';
  
  terrain: Terrain;
  player: Player;
  scene: THREE.Scene;
  control: Control;
  
  remotePlayers: Record<string, THREE.Mesh> = {};

  constructor(scene: THREE.Scene, terrain: Terrain, player: Player, control: Control) {
    this.scene = scene;
    this.terrain = terrain;
    this.player = player;
    this.control = control;

    this.initUI();
  }

  initUI() {
    const hostBtn = document.getElementById('host');
    const joinBtn = document.getElementById('join');
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const joinIdInput = document.getElementById('join-id') as HTMLInputElement;
    const mpStatus = document.getElementById('mp-status');

    if (hostBtn) hostBtn.onclick = () => {
      this.myUsername = usernameInput?.value.trim() || 'Player';
      this.peer = new Peer();
      this.peer.on('open', (id) => {
        this.myId = id;
        if(joinIdInput) joinIdInput.value = id;
        if(mpStatus) mpStatus.innerText = `Hosting World: ${id}`;
        this.appendChat(`[Server] Hosting world. Invite friends with ID: ${id}`);
      });
      this.peer.on('connection', (conn) => {
        this.connections[conn.peer] = conn;
        this.setupConnection(conn);
        this.appendChat(`[Server] A player joined!`);
      });
    };

    if (joinBtn) joinBtn.onclick = () => {
      this.myUsername = usernameInput?.value.trim() || 'Player';
      const targetId = joinIdInput?.value.trim();
      if (!targetId) { alert("Enter a World ID"); return; }
      
      if(mpStatus) mpStatus.innerText = "Connecting...";
      this.peer = new Peer();
      this.peer.on('open', () => {
        const conn = this.peer!.connect(targetId);
        this.connections[targetId] = conn;
        this.setupConnection(conn);
      });
    };

    // Chat
    const chatInputWrapper = document.getElementById('chat-input-wrapper');
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    document.addEventListener('keydown', (e) => {
      if (chatInputWrapper && chatInputWrapper.style.display === 'block') {
        if (e.code === 'Enter') {
          const text = chatInput.value.trim();
          if (text) {
            const formatted = `[${this.myUsername}] ${text}`;
            this.appendChat(formatted);
            this.broadcast({ type: 'chat', text: formatted });
          }
          chatInput.value = '';
          chatInputWrapper.style.display = 'none';
          chatInput.blur();
          if (!document.querySelector('.menu')?.classList.contains('start')) {
            document.body.requestPointerLock();
          }
        }
        if (e.code === 'Escape') {
          chatInputWrapper.style.display = 'none';
          chatInput.blur();
          if (!document.querySelector('.menu')?.classList.contains('start')) {
            document.body.requestPointerLock();
          }
        }
        e.stopPropagation();
        return;
      }
      
      if (e.code === 'KeyT' || e.code === 'Enter') {
        if (!document.querySelector('.menu')?.classList.contains('start')) {
          document.exitPointerLock();
          if (chatInputWrapper) chatInputWrapper.style.display = 'block';
          if (chatInput) chatInput.focus();
          e.preventDefault();
        }
      }
    }, true); 
  }

  appendChat(msg: string) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const m = document.createElement('div');
    m.style.background = 'rgba(0,0,0,0.5)';
    m.style.padding = '4px';
    m.style.borderRadius = '4px';
    m.style.wordWrap = 'break-word';
    m.innerText = msg;
    box.appendChild(m);
    if (box.children.length > 5) box.removeChild(box.children[0]);
  }

  setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      const mpStatus = document.getElementById('mp-status');
      if (mpStatus) mpStatus.innerText = `Connected!`;
      
      if (this.peer?.id === this.myId) {
        conn.send({
          type: 'init_world',
          seeds: {
            seed: this.terrain.noise.seed,
            treeSeed: this.terrain.noise.treeSeed,
            stoneSeed: this.terrain.noise.stoneSeed,
            coalSeed: this.terrain.noise.coalSeed
          },
          customBlocks: this.terrain.customBlocks
        });
      }
    });

    conn.on('data', (data: any) => {
      if (data.type === 'init_world') {
        this.terrain.noise.seed = data.seeds.seed;
        this.terrain.noise.treeSeed = data.seeds.treeSeed;
        this.terrain.noise.stoneSeed = data.seeds.stoneSeed;
        this.terrain.noise.coalSeed = data.seeds.coalSeed;
        this.terrain.customBlocks = data.customBlocks;
        
        this.terrain.initBlocks();
        this.terrain.generate();

        const playBtn = document.getElementById('play');
        if (playBtn) playBtn.click();
        
        const chatContainer = document.getElementById('chat-container');
        if(chatContainer) chatContainer.style.display = 'flex';

        this.appendChat(`[Server] Joined world!`);
      } else if (data.type === 'chat') {
        this.appendChat(data.text);
      } else if (data.type === 'player_move') {
        this.updateRemotePlayer(conn.peer, data.pos, data.rot);
      } else if (data.type === 'sync_custom_blocks') {
         this.terrain.customBlocks = data.customBlocks;
         this.terrain.initBlocks();
         this.terrain.generate();
      }
    });

    conn.on('close', () => {
      this.appendChat(`[Server] Player left.`);
      if (this.remotePlayers[conn.peer]) {
        this.scene.remove(this.remotePlayers[conn.peer]);
        delete this.remotePlayers[conn.peer];
      }
      delete this.connections[conn.peer];
    });
  }

  broadcast(msg: any) {
    Object.values(this.connections).forEach(c => {
      if (c.open) c.send(msg);
    });
  }

  syncBlocks() {
    this.broadcast({
      type: 'sync_custom_blocks',
      customBlocks: this.terrain.customBlocks
    });
  }

  updateRemotePlayer(id: string, pos: {x:number, y:number, z:number}, rot: {y:number}) {
    if (!this.remotePlayers[id]) {
      const geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
      const mat = new THREE.MeshStandardMaterial({color: Math.random() * 0xffffff});
      const mesh = new THREE.Mesh(geo, mat);
      this.scene.add(mesh);
      this.remotePlayers[id] = mesh;
    }
    const p = this.remotePlayers[id];
    p.position.set(pos.x, pos.y, pos.z);
    p.rotation.y = rot.y;
  }

  update() {
    if (Object.keys(this.connections).length > 0 && this.control.control.isLocked) {
      this.broadcast({
        type: 'player_move',
        pos: { x: this.control.camera.position.x, y: this.control.camera.position.y, z: this.control.camera.position.z },
        rot: { y: this.control.camera.rotation.y }
      });
    }
  }
}