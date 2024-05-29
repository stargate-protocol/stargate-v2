#!/bin/sh

#   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-
#  / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \
# `-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'
#
#          Setup script for a LayerZero snapshot node
#
#   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-
#  / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \
# `-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'

echo "Running node for ${NETWORK_NAME}"

# Set up the LayerZero specific node functionality
[ -f /srv/packages/localnet/helper/installer ] && /srv/packages/localnet/helper/installer /opt/lz/ ${NETWORK_NAME}
[ -f /opt/lz/restore ] && /opt/lz/restore

# Start a geth node
exec geth \
    --dev \
    --syncmode full \
    --gcmode archive \
    --datadir /app/cache \
    --http --http.addr '0.0.0.0' --http.port 8545 --http.api eth,web3,net --http.vhosts=* --http.corsdomain=* \
    --dev.period 1