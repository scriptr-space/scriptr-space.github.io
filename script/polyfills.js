// -- Polyfill Regex Escape -- //
RegExp.escape= function(value) {
    return value.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};
// -- Polyfill Regex Escape -- //