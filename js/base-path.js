/**
 * Base path configuration for GitHub Pages deployment
 * This helps with proper path resolution when deployed to a subdirectory
 */

// Get the repository name from the URL
function getRepositoryName() {
    const pathArray = window.location.pathname.split('/');
    // If deployed to GitHub Pages, the repository name will be the first segment after the username
    // For example: https://username.github.io/repo-name/ -> "repo-name"
    
    // If we're at the root or on a GitHub user page, return empty string
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.hostname.endsWith('.github.io') && pathArray.length <= 2) {
        return '';
    }
    
    // Otherwise, return the repository name
    return pathArray[1] || '';
}

// Calculate the base path for assets
function getBasePath() {
    const repoName = getRepositoryName();
    return repoName ? `/${repoName}` : '';
}

// Create global BASE_PATH variable
const BASE_PATH = getBasePath();

// Function to resolve paths with BASE_PATH
function resolveUrl(url) {
    // If the URL is absolute or already has the base path, return it as is
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith(BASE_PATH)) {
        return url;
    }
    
    // If the URL starts with a slash, append it to the base path
    if (url.startsWith('/')) {
        return `${BASE_PATH}${url}`;
    }
    
    // Otherwise, append it to the base path with a slash
    return `${BASE_PATH}/${url}`;
}

// Override fetch to automatically add BASE_PATH to URLs
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    return originalFetch(resolveUrl(url), options);
};

// Log base path information
console.log('📂 Base path configured:', BASE_PATH || '/');

