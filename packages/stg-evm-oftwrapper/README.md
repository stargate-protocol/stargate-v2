# OFT Wrapper Diamond

## Introduction

The OFT Wrapper Diamond is a set of contracts that implement the OFT Wrapper interface using the Diamond (https://eips.ethereum.org/EIPS/eip-2535) proxy pattern.

## Diamond

Diamond proxies comprise multiple facets, each implementing one aspect of the contracts functionality. Facets can generally be added, replaced and removed.
For this contracts case, the replacing and removing of facets has been disabled, so it is effectively append-only. Adding a facet is done by `cutting` it (see `IDiamondCut`).
Existing facets can be examined through the `IDiamondLoupe` interface. Any facets that will be added must be deployed first and then added to the diamond.
Call to the diamond functionality are performed on the diamond contract, which then routes them to the appropriate facet. Routing happens through `delegate call`s, so storage
and state remain in the diamond contract. This poses a departure from the traditional approach to contracts state, which is particularly relevant in the case of constructors.
To run initialization code on a facet when it is being added to the diamond, an initializer contract can be deployed, which gets `delegate call`ed by the diamond at FacetCut time.

## Facets

The OFT functionality is divided in 3 facets:

- OFTSenderV1Facet handles OFT manipulation for V1 OFTs
- OFTSenderV2Facet handles OFT manipulation for V2 OFTs
- OFTStakerFacet handles bps manipulation (per oft / default). Needs to be initialized with a default value, which is achieved through the OFTStakerInitializer contract.

## Ops

Deployment of the diamond and facets should step through the following sequence:

1. Deploy the initial facets contracts (OwnershipFacet, DiamondCutFacet, DiamondLoupeFacet)
1. Deploy the Diamond contract and install the 3 initial facets
1. Deploy the OFT functionality contracts (OFTSenderV1Facet, OFTSenderV2Facet, OFTStakerFacet)
1. Deploy the OFTStakerFacetInitializer contract so it can be used in the next step.
1. Cut the facets OFT facets into the diamond calling diamondCut() on the DiamontCutFacet by pointing it to the OFT functionality contracts. Note that the OFTStakerFacet should be initialized.

## Testing

Testing is performed through hardhat, which at the time of writing provides better support for coverage report. Mock contracts for the OFTs are provided to ease testing.

## References

Diamond Pattern
https://eips.ethereum.org/EIPS/eip-2535

OFTWrapper Interface
https://github.com/LayerZero-Labs/oft-wrapper/blob/main/contracts/interfaces/IOFTWrapper.sol
