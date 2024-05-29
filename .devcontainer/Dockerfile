ARG SOLC_VERSION=${SOLC_VERSION:-0.8.22}
ARG SLITHER_VERSION=${SLITHER_VERSION:-0.9.6}
ARG FOUNDRY_VERSION=nightly-156cb1396b7076c6f9cb56f3719f8c90f7f52064
ARG BUILDPLATFORM=${BUILDPLATFORM:-linux/arm64}
ARG TARGETPLATFORM=${TARGETPLATFORM:-${BUILDPLATFORM}}

FROM ghcr.io/foundry-rs/foundry:$FOUNDRY_VERSION AS foundry
FROM --platform=$TARGETPLATFORM docker.io/layerzerolabs/solc:${SOLC_VERSION} AS solc

FROM --platform=$TARGETPLATFORM mcr.microsoft.com/devcontainers/typescript-node:1-18-bullseye as devcontainer
ARG SLITHER_VERSION

RUN apt-get update \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends ca-certificates direnv \
  build-essential \
  python3 python3-pip \
  libcvc4-7 \
  skopeo \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN sudo ./aws/install

RUN update-alternatives --install /usr/bin/vim vim /usr/bin/vim.tiny 10 \
  && update-alternatives --install /usr/bin/python python /usr/bin/python3 10

RUN git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ~/.oh-my-zsh/custom/themes/powerlevel10k \
  && git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions \
  && cp ~/.oh-my-zsh/custom/themes/powerlevel10k/config/p10k-lean.zsh ~/.p10k.zsh \
  && sed -i'' -e 's/^plugins.*)/plugins=(git zsh-autosuggestions)/' -e 's,^ZSH_THEME=.*,ZSH_THEME="powerlevel10k/powerlevel10k",' ~/.zshrc \
  && echo '[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh' >> ~/.zshrc    

RUN python3 -m pip install "attrs>=22.2.0" "rlp==3.0.0" slither-analyzer==${SLITHER_VERSION}

COPY --from=foundry /usr/local/bin/anvil /usr/local/bin/anvil
COPY --from=foundry /usr/local/bin/cast /usr/local/bin/cast
COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge
COPY --from=solc /opt/local/ /opt/local/

RUN echo 'export PATH="/root/.foundry/bin:$PATH"' >> /root/.shrc \
  && echo 'export PATH="/opt/local/bin:$PATH"' >> /root/.shrc \
  && echo 'export LD_LIBRARY_PATH="/opt/local/lib:$LD_LIBRARY_PATH"' >> /root/.shrc \
  && echo 'export PKG_CONFIG_PATH="/opt/local/lib/pkgconfig:$PKG_CONFIG_PATH"' >> /root/.shrc

RUN echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc \
  && echo 'eval "$(direnv hook bash)"' >> ~/.bashrc \
  && echo '[[ ! -f ~/.shrc ]] || source ~/.shrc' >> ~/.zshrc \
  && echo '[[ ! -f ~/.shrc ]] || source ~/.shrc' >> ~/.bashrc

COPY ./p10k.zsh /root/.p10k.zsh  

RUN mkdir -p ~/.config/direnv/ \
  && printf '[whitelist]\nprefix = [ "/" ]' >> ~/.config/direnv/direnv.toml