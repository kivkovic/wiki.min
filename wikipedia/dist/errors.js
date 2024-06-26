"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citationError = exports.pdfError = exports.fcError = exports.eventsError = exports.mediaError = exports.relatedError = exports.introError = exports.preloadError = exports.infoboxError = exports.coordinatesError = exports.geoSearchError = exports.linksError = exports.categoriesError = exports.contentError = exports.htmlError = exports.imageError = exports.summaryError = exports.pageError = exports.autocompletionsError = exports.searchError = exports.wikiError = void 0;
class wikiError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'wikiError';
        this.code = code;
    }
}
exports.wikiError = wikiError;
class searchError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'searchError';
    }
}
exports.searchError = searchError;
class autocompletionsError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'autocompletionsError';
    }
}
exports.autocompletionsError = autocompletionsError;
class pageError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'pageError';
    }
}
exports.pageError = pageError;
class summaryError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'summaryError';
    }
}
exports.summaryError = summaryError;
class imageError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'imageError';
    }
}
exports.imageError = imageError;
class htmlError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'htmlError';
    }
}
exports.htmlError = htmlError;
class contentError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'contentError';
    }
}
exports.contentError = contentError;
class categoriesError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'categoriesError';
    }
}
exports.categoriesError = categoriesError;
class linksError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'linksError';
    }
}
exports.linksError = linksError;
class geoSearchError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'geoSearchError';
    }
}
exports.geoSearchError = geoSearchError;
class coordinatesError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'coordinatesError';
    }
}
exports.coordinatesError = coordinatesError;
class infoboxError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'infoboxError';
    }
}
exports.infoboxError = infoboxError;
class preloadError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'preloadError';
    }
}
exports.preloadError = preloadError;
class introError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'introError';
    }
}
exports.introError = introError;
class relatedError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'relatedError';
    }
}
exports.relatedError = relatedError;
class mediaError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'mediaError';
    }
}
exports.mediaError = mediaError;
class eventsError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'eventsError';
    }
}
exports.eventsError = eventsError;
class fcError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'featuredContentError';
    }
}
exports.fcError = fcError;
class pdfError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'pdfError';
    }
}
exports.pdfError = pdfError;
class citationError extends wikiError {
    constructor(message) {
        super(message);
        this.name = 'citationError';
    }
}
exports.citationError = citationError;
