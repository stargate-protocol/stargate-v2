import { Contract, ethers } from 'ethers'
import { ParamType, concat, hexlify } from 'ethers/lib/utils'
import { FacetCut, FacetCutAction } from 'hardhat-deploy/dist/types'

// get function selectors from ABI
export function getSelectors(contract: Contract): string[] {
    const signatures: string[] = Object.keys(contract.interface.functions)
    const selectors: string[] = signatures.reduce((acc: string[], val: string) => {
        if (val !== 'init(bytes)') {
            acc.push(contract.interface.getSighash(val))
        }
        return acc
    }, [])
    return selectors
}

// Add functions from the provided contract.
export function addFacet(facet: Contract): FacetCut {
    return {
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet),
    }
}

// Remove functions from the provided contract.
export function rmFacet(facet: Contract): FacetCut {
    return {
        facetAddress: facet.address,
        action: FacetCutAction.Remove,
        functionSelectors: getSelectors(facet),
    }
}

// Replace functions with the ones of a new contract.
export function mvFacet(facet: Contract): FacetCut {
    return {
        facetAddress: facet.address,
        action: FacetCutAction.Replace,
        functionSelectors: getSelectors(facet),
    }
}

export function encodeData(contract: Contract, funct: string, msgValue: number, values: ReadonlyArray<unknown>) {
    const frag = contract.interface.getFunction(funct)

    return ethers.utils.keccak256(
        hexlify(
            concat([
                contract.interface.getSighash(frag),
                contract.interface._encodeParams(
                    [ParamType.fromString('uint256'), ...frag.inputs],
                    [msgValue, ...values]
                ),
            ])
        )
    )
}

export function encodeDataWithoutValue(contract: Contract, funct: string, values: ReadonlyArray<unknown>) {
    const frag = contract.interface.getFunction(funct)

    return ethers.utils.keccak256(
        hexlify(concat([contract.interface.getSighash(frag), contract.interface._encodeParams(frag.inputs, values)]))
    )
}
