ARG LOCALNET_VERSION=2.3.27
ARG NETWORK_NAME

#   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-
#  / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \
# `-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'
#
#          Image that runs a LayerZero snapshot node
#
#   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-
#  / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \
# `-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'
FROM 438003944538.dkr.ecr.us-east-1.amazonaws.com/snapshot:${NETWORK_NAME}-${LOCALNET_VERSION} AS layerzero-node

ARG NETWORK_NAME
ENV NETWORK_NAME=$NETWORK_NAME

COPY ./docker/layerzero-node-entrypoint.sh /usr/local/bin/layerzero-node-entrypoint.sh

ENTRYPOINT ["layerzero-node-entrypoint.sh"]

#   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-
#  / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \
# `-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'
#
#          Image that runs a Stargate snapshot node
#
#   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-.   .-.-
#  / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \ \ / / \
# `-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'   `-`-'
FROM layerzero-node AS stargate-node

ARG NETWORK_NAME
ENV NETWORK_NAME=$NETWORK_NAME

COPY ./snapshot/${NETWORK_NAME}/cache /app/cache