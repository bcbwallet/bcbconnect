# BCB Connect

## Web API

Browse the [API Documentation](https://bcbwallet.readthedocs.io/en/latest/web_api.html) online.

## Installation

#### Install yarn

**https://yarnpkg.com/en/docs/install**

#### Install dependencies

```sh
$ yarn install
$ lerna bootstrap
```

#### Building

```sh
# Build all sources
$ yarn build
```

```sh
# Build the backend, along with the injected page script
$ yarn build:core
```

```sh
# Build only the popup component 
$ yarn build:popup
```

#### Linting

```sh
# Run linter over the ./packages folder
$ yarn lint
```

#### Packing

```sh
# Pack extension
$ yarn build:zip
```

