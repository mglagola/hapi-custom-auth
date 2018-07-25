const Boom = require('boom');
const assert = require('assert');
const pkg = require('./package.json');

const isFunction = (v) => typeof v === 'function';

const authenticate = (options, raiseError) => async (request, h) => {
    const {
        tokenType = 'Token',
        validate,
        isValidToken,
    } = options;
    const { authorization: token } = request.headers;

    if (!isValidToken(token)) {
        return h.unauthenticated(
            raiseError('unauthorized', 'Invalid token format', tokenType),
            { credentials: tokenType }
        );
    }
    
    try {
        const { isValid, credentials, response } = await validate(token, request);
        
        if (response !== undefined) {
            return h.response(response).takeover();
        }

        if (!isValid) {
            return h.unauthenticated(
                raiseError('unauthorized', 'Invalid credentials', tokenType),
                { credentials: token },
            );
        }

        return h.authenticated({ credentials, artifacts: token });
    } catch (error) {
        return h.unauthenticated(raiseError('boomify', error), { credentials: token });
    }
};

const implementation = (server, options) => {
    assert(options, 'options are required for jwt auth scheme');
    assert(options.validate, 'validate function is required!');
    assert(options.isValidToken && isFunction(options.isValidToken), 'isValidToken function is required!');

    const raiseError = (errorType, message, scheme, attributes) => {
        const { errorFunc } = options;
        const errorContext = (errorFunc && isFunction(errorFunc))
            ? errorFunc({ errorType, message, scheme, attributes })
            : { errorType, message, scheme, attributes };

        return Boom[errorContext.errorType](errorContext.message, errorContext.scheme, errorContext.attributes);
    };

    return {
        authenticate: authenticate(options, raiseError),
    };
};

exports.plugin = {
    register: (server, { schemeName = 'custom-auth' } = {}) => {
        server.auth.scheme(schemeName, implementation);
    },
    pkg,
};

