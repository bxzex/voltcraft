import * as THREE from 'three'
import Control from '../../control'
import { htmlToDom } from '../../utils'
import UI from './joystick.html?raw'

enum ActionKey {
  FRONT = 'front',
  LEFT = 'left',
  RIGHT = 'right',
  BACK = 'back',
  MODE = 'mode',
  JUMP = 'jump',
  UP = 'up',
  DOWN = 'down',
  BREAK = 'break',
  PLACE = 'place',
  INVENTORY = 'inventory',
  PAUSE = 'pause'
}

export default class Joystick {
  constructor(control: Control) {
    this.control = control
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ')
  }

  control: Control
  pageX = 0
  pageY = 0
  clickX = 0
  clickY = 0
  euler: THREE.Euler
  clickTimeout?: ReturnType<typeof setTimeout>
  clickInterval?: ReturnType<typeof setInterval>
  hold = false

  // emit keyboard event
  private emitKeyboardEvent = (key: string, code?: string) => {
    return {
      key,
      code: code || key
    } as KeyboardEvent
  }

  // emit click event
  private emitClickEvent = (button: number) => {
    return {
      button,
      preventDefault: () => { }
    } as MouseEvent
  }

  // init joystick button
  private initButton = ({
    actionKey,
    key,
    code,
    mouseButton,
    callback
  }: {
    actionKey: ActionKey
    key?: string
    code?: string
    mouseButton?: number
    callback?: () => void
  }) => {
    const button = document.querySelector(
      `#action-${actionKey}`
    ) as HTMLButtonElement
    if(!button) return;

    button.addEventListener('pointermove', e => {
      e.stopPropagation()
    })
    button.addEventListener('pointerdown', e => {
      if(callback) {
        callback()
      } else {
        if(key) this.control.setMovementHandler(this.emitKeyboardEvent(key, code))
        if(mouseButton !== undefined) this.control.mousedownHandler(this.emitClickEvent(mouseButton))
      }
      e.stopPropagation()
    })
    button.addEventListener('pointerup', e => {
      if(key && !callback) this.control.resetMovementHandler(this.emitKeyboardEvent(key, code))
      e.stopPropagation()
    })
    button.addEventListener('pointerleave', e => {
      if(key && !callback) this.control.resetMovementHandler(this.emitKeyboardEvent(key, code))
      e.stopPropagation()
    })
  }

  init = () => {
    htmlToDom(UI)

    // Disable context menu on all joystick buttons to prevent "copy" behavior on long press
    document.querySelectorAll('.joystick *').forEach(el => {
      el.addEventListener('contextmenu', e => e.preventDefault());
    });

    this.initButton({ actionKey: ActionKey.FRONT, key: 'w' })
    this.initButton({ actionKey: ActionKey.LEFT, key: 'a' })
    this.initButton({ actionKey: ActionKey.RIGHT, key: 'd' })
    this.initButton({ actionKey: ActionKey.BACK, key: 's' })
    this.initButton({ actionKey: ActionKey.JUMP, key: ' ', code: 'Space' })
    this.initButton({ actionKey: ActionKey.BREAK, mouseButton: 0 })
    this.initButton({ actionKey: ActionKey.PLACE, mouseButton: 2 })

    // Inventory toggle
    this.initButton({ 
      actionKey: ActionKey.INVENTORY, 
      callback: () => {
        const event = new KeyboardEvent('keydown', { key: 'e', code: 'KeyE' });
        document.body.dispatchEvent(event);
      }
    })

    // Pause toggle
    this.initButton({
      actionKey: ActionKey.PAUSE,
      callback: () => {
        const menu = document.querySelector('.menu');
        if (menu?.classList.contains('hidden')) {
          this.control.control.unlock(); 
        } else {
          // If already visible (paused), resume
          this.control.control.lock();
        }
      }
    })

    // camera control
    document.addEventListener('pointermove', e => {
      if ((e.target as HTMLElement).closest('.joystick')) return;
      if (this.pageX !== 0 || this.pageY !== 0) {
        this.euler.setFromQuaternion(this.control.camera.quaternion)
        this.euler.y -= 0.005 * (e.pageX - this.pageX)
        this.euler.x -= 0.005 * (e.pageY - this.pageY)
        this.euler.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.euler.x)
        )
        this.control.camera.quaternion.setFromEuler(this.euler)
      }
      this.pageX = e.pageX
      this.pageY = e.pageY
      this.clickTimeout && clearTimeout(this.clickTimeout)
    })

    // click control
    document.addEventListener('pointerdown', e => {
      if ((e.target as HTMLElement).closest('.joystick')) return;
      this.clickX = e.pageX
      this.clickY = e.pageY

      this.clickTimeout = setTimeout(() => {
        if (e.pageX === this.clickX && e.pageY === this.clickY) {
          this.control.mousedownHandler(this.emitClickEvent(0))
          this.clickInterval = setInterval(() => {
            this.control.mousedownHandler(this.emitClickEvent(0))
          }, 333)
          this.hold = true
        }
      }, 500)
    })

    document.addEventListener('pointerup', e => {
      this.clickTimeout && clearTimeout(this.clickTimeout)
      this.clickInterval && clearInterval(this.clickInterval)

      if (!this.hold && e.pageX === this.clickX && e.pageY === this.clickY) {
        if (!(e.target as HTMLElement).closest('.joystick')) {
          this.control.mousedownHandler(this.emitClickEvent(2))
        }
      }
      this.hold = false
      this.pageX = 0
      this.pageY = 0
    })
  }
}
