import { ethers } from 'ethers'

import { SEND_MODE_TAXI } from './constants'

export class OftCmd {
    constructor(
        public sendMode: number,
        public passengers: string[]
    ) {}

    toBytes(): string {
        if (this.sendMode === SEND_MODE_TAXI) {
            return '0x'
        } else {
            return ethers.utils.solidityPack(['uint8'], [this.sendMode])
        }
    }
}
