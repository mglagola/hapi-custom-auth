# Hapi Custom Auth

Easy way to create a hapi "custom" auth scheme. Looks for value associated with `request.headers.authorization`.

## Usage

##### Install

```
npm install --save hapi-custom-auth
```

##### Configure Server:

```js
const HapiCustomAuth = require('hapi-custom-auth');
// ...

const AuthSetup = {
    // See below example
    plugin: require('./auth-setup');
}

// ...

const server = new Hapi.Server(...);
const plugins = [
    // ...
    HapiCustomAuth,
    AuthSetup,
    // ...,
];
await server.register(plugins);
// ...

```

##### Auth Setup (ex: auth-setup.js)

```js
const validate = async (authorization) => {
    try {
        const user = await fakeSQLQuery(`user.token === ${authorization}`);
        if (!user) return { isValid: false };
        const credentials = {
            userId: user.id,
            scope: [
                'user',
                `user-${user.id}`,
            ],
        };
        return { isValid: true, credentials };
    } catch (error) {
        return { isValid: false };
    }
};

const isValidToken = (token) => token && token.indexOf('pizza') >= 0;

const errorFunc = ({ errorType, message, scheme }) => ({
    errorType,
    message,
    scheme,
    attributes: { error: 'Invalid token', invalid_token: true },
});

exports.register = function (server, options) {
    server.auth.strategy('custom-auth', 'custom-auth', config);
};

exports.pkg = {
    name: 'MyAuth',
    version: '1.0.0',
};
```
