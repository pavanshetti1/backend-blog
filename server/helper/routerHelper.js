function isActiveRoute(route, currRoute){
    return route === currRoute ? "active" : "";
}

module.exports = {isActiveRoute};