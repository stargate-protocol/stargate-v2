## Overview

This package provides utilities for handling errors returned by Stargate contracts. It offers a streamlined way to check and parse hexadecimal strings that may represent errors sent by Solidity contracts.

## Installation

To use this package, include it in your project using npm or yarn:

```bash
npm install @stargatefinance/stg-error-parser
```

or

```bash
yarn add @stargatefinance/stg-error-parser
```

## Usage

The package exports two main functions:

```ts
checkError(data: string): void
```

This function checks a given string for any errors sent by a Stargate contract.

```ts
parseError(data: string): LayerZeroParsedError | null
```

This function parses a given string for error and decodes it.
