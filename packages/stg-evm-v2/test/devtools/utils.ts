import { hexZeroPad } from 'ethers/lib/utils'

import { Bytes20, PossiblyBytes } from '@layerzerolabs/devtools'

export const makeBytes20 = (address?: PossiblyBytes | null | undefined): Bytes20 => hexZeroPad(address || '0x0', 20)
